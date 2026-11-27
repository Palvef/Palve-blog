---
title: "使用 njs 实现 rsync 排队功能"
date: 2026-09-09 12:00:00 +0800
lang: zh
translation_id: nginx-njs-rsync-queue
permalink: /2026/09/nginx-njs-rsync-queue/
tags: [nginx, njs, rsync, mirrors]
---

镜像站的 `rsync` 并发打满时，无论是 `rsyncd` 自己的 `max connections` 还是 NGINX 的 `limit_conn`，表现都是直接掐断连接。客户端只能报错退出或者写个死循环一直重试。

为了能让客户端按先来后到排队、并且在等待的时候看到当前进度，用 NGINX `stream` + `njs` 写了个排队实现。相关补丁和示例代码在 [Palvef/njs (`stream-send-in-preread`)](https://github.com/Palvef/njs/tree/stream-send-in-preread)。

## 让 `js_preread` 支持发包

按模块名选上游和排队都必须在真正连后端之前完成，也就是在 `js_preread` 阶段。但原生 `ngx_stream_js_module` 只允许在 `js_filter` 里调 `s.send()`，在 `preread` 里直接报错 `cannot send buffer in this handler`。

而 rsync daemon 协议是服务端先吐一行 `@RSYNCD: 31.0\n`，客户端才会把自己的版本和要拉的模块名发过来；排队期间也得靠往客户端持续吐 MOTD 来提示当前排位和保活。所以先给 `nginx/ngx_stream_js_module.c` 打了个 patch：

- 在 `ngx_stream_js_ctx_t` 里加了 `preread` 和 `preread_send` 两个标记位；
- 在 `ngx_stream_js_preread_handler` 中标记 `ctx->preread = 1`；
- 在 `ngx_stream_js_ext_send` 和 `ngx_stream_qjs_ext_send` 里放行 `preread` 阶段向下游发数据（禁止向上游写），自动置 `flush = ctx->preread`，直接走 `ngx_stream_top_filter(s, cl, 1)` 刷出去；
- `ngx_stream_js_body_filter` 遇到 `ctx->preread_send` 直接透传给 `ngx_stream_next_filter`，避免跟后续 filter 回调打架。

## 握手、排队与透传

`rsync.njs` 的处理分两段：

在 `preread` 阶段，先过一遍独立的 `geo $rsync_forbidden` 表（只拦 rsync，不动 HTTP 策略，命中直接 `403` 结束）。通过后由 NGINX 主动发 `@RSYNCD: 31.0\n`，解析客户端发来的版本和模块名写进 `$rsync_module`，再按 `map` 查出对应的 `$rsync_backend`、`$rsync_max_active` 和 `$rsync_max_queued`。

所有队列状态存在 `js_shared_dict_zone zone=rsync_queue:1m type=number timeout=1d` 里，多 worker、多监听端口共享同一套状态：

- `next:<backend>` 用 `dict.incr()` 拿递增票号，保证同一上游严格 FIFO；
- `lock:<backend>` 用 `dict.add()` 做短租约互斥锁；
- `wait:<backend>:<ticket>` 和 `active:<backend>:<ticket>` 分别记等待和活跃槽位，默认租约 `rsync_queue_entry_ttl` 为 120 秒，正常连接会自动续租，防止 worker 异常退出留下死锁；
- 客户端在排队期间提前断连由 `monitorQueuedClient` 捕获立即清理；正常结束时通过 `njs.on('exit')` 和日志里求值 `$rsync_initial_queue_position` 立刻释放槽位。

如果当前上游满载但队列没满，就定时轮询（默认 1 秒），入队时、排位或总人数变化时、以及每隔 60 秒都会往客户端写合法的 rsync MOTD 提示行。

排到队头并且有空闲活跃槽位时调用 `s.done()`，NGINX 才会真正去连上游 `rsyncd`。此时进入 `filter` 阶段：上行方向兼容透传 PROXY protocol v1/v2 头，把客户端首行改写成协商好的 `@RSYNCD: <proto>.0\n`；下行方向吞掉后端重复发出来的第一行 `@RSYNCD:` 问候语，剩下的原样透传给客户端。

## 配置与日志

把 `rsync.njs` 放到 `/etc/nginx/njs/`，在 `stream {}` 中引入 `rsync.conf` 和 `forbidden.conf` 即可。提示文案可以通过四个 `rsync_queue_*_message` 变量直接在配置里改，不用重编模块：

```nginx
js_import rsync from '/etc/nginx/njs/rsync.njs';

js_set $rsync_initial_queue_position rsync.initialQueuePosition;
js_var $rsync_module '-';
js_var $rsync_queue_queued 'false';
js_var $rsync_queue_wait_seconds '0';
js_var $rsync_status_code '500';
js_var $rsync_queue_entry_ttl '120';

js_var $rsync_queue_busy_message 'Upstream {backend} has reached the maximum number of {max_active} connections. Your request is being queued.';
js_var $rsync_queue_status_message 'Your position: {position}, Total queued: {queued}';
js_var $rsync_queue_admitted_message 'Queue slot acquired after {wait_seconds} seconds. Connecting to the upstream.';
js_var $rsync_queue_full_message '@ERROR: Server queue is full for upstream {backend}; please retry later.';

js_shared_dict_zone zone=rsync_queue:1m type=number timeout=1d;

log_format rsync_example '$remote_addr module=$rsync_module '
                         'backend=$rsync_backend status=$rsync_log_status '
                         'queued=$rsync_queue_queued '
                         'initial_queue_position=$rsync_initial_queue_position '
                         'wait_seconds=$rsync_queue_wait_seconds';

server {
    listen 873;
    listen [::]:873;

    js_preread rsync.preread;
    js_filter rsync.filter;
    proxy_pass $rsync_backend;

    access_log /var/log/nginx/rsync.log rsync_example;
}
```

日志里会记下 `module`、`backend`、`status`（`200` 正常、`403` 黑名单、`429` 队列满或中途放弃、`500` 握手错误、`503` 票据过期或上游不可用）、`queued`、`initial_queue_position` 和 `wait_seconds`。注意 `access_log` 里要保留 `$rsync_initial_queue_position`，会话结束求值这个变量时会顺手清掉对应的队列票据和定时器。

完整补丁、测试用例和示例配置都在 [https://github.com/Palvef/njs/tree/stream-send-in-preread](https://github.com/Palvef/njs/tree/stream-send-in-preread)。
