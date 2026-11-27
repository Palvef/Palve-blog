---
title: "Implementing an rsync Queue with NGINX njs"
date: 2026-09-09 12:00:00 +0800
lang: en
translation_id: nginx-njs-rsync-queue
permalink: /2026/09/nginx-njs-rsync-queue/
redirect_from:
  - /en/2026/09/nginx-njs-rsync-queue/
tags: [NGINX, njs, rsync, Mirrors, Linux]
---

When `rsync` concurrency fills up on a mirror server, both `rsyncd`'s `max connections` and NGINX `limit_conn` simply reject new connections. Clients either bail out or hammer the server in a retry loop.

To queue clients in FIFO order and show live queue status while they wait, I put together an NGINX `stream` + `njs` queue. The patch and example files live in [Palvef/njs (`stream-send-in-preread`)](https://github.com/Palvef/njs/tree/stream-send-in-preread).

## Allowing `s.send()` in `js_preread`

Module routing and queuing have to happen before NGINX opens an upstream connection, which means running inside `js_preread`. Upstream `ngx_stream_js_module` only permits `s.send()` during `js_filter` and throws `cannot send buffer in this handler` if called in `preread`.

In the rsync daemon protocol, the server has to speak first (`@RSYNCD: 31.0\n`) before the client sends its version and module name, and while queued we also need to push valid MOTD lines to the client. I patched `nginx/ngx_stream_js_module.c` to allow this:

- Added `preread` and `preread_send` flags to `ngx_stream_js_ctx_t`;
- Set `ctx->preread = 1` in `ngx_stream_js_preread_handler`;
- Updated `ngx_stream_js_ext_send` and `ngx_stream_qjs_ext_send` to allow downstream writes during `preread` (still blocking upstream writes), setting `flush = ctx->preread` and sending through `ngx_stream_top_filter(s, cl, 1)`;
- Short-circuited `ngx_stream_js_body_filter` to `ngx_stream_next_filter` whenever `ctx->preread_send` is set so preread writes don't collide with `js_filter`.

## Handshake, Queuing, and Bridging

`rsync.njs` handles sessions in two stages.

In `preread`, it first checks a standalone `geo $rsync_forbidden` table (affecting rsync only, returning `403` before any greeting). Otherwise NGINX sends `@RSYNCD: 31.0\n`, parses the client version and requested module into `$rsync_module`, and looks up `$rsync_backend`, `$rsync_max_active`, and `$rsync_max_queued` via `map`.

Queue state lives in `js_shared_dict_zone zone=rsync_queue:1m type=number timeout=1d`, shared across all workers and listeners:

- `next:<backend>` uses `dict.incr()` for monotonic tickets, enforcing strict FIFO per upstream;
- `lock:<backend>` uses `dict.add()` as a short-lease mutex;
- `wait:<backend>:<ticket>` and `active:<backend>:<ticket>` track queued and active slots under `rsync_queue_entry_ttl` (default 120s), renewed periodically so a worker crash cannot leak slots permanently;
- Early client disconnects while queued are caught by `monitorQueuedClient`, and normal exits release tickets right away via `njs.on('exit')` and `$rsync_initial_queue_position` evaluation in the access log.

While waiting, the client gets valid rsync MOTD lines immediately on enqueue, whenever its position or total queue size changes (polled every ~1s), and at least once every 60 seconds as a heartbeat.

Once the connection reaches the front and an active slot opens, `s.done()` hands off to `proxy_pass`. Inside `filter`, the upstream path preserves PROXY protocol v1/v2 headers and rewrites the client's first line to the negotiated `@RSYNCD: <proto>.0\n`, while the downstream path strips the backend's duplicate `@RSYNCD:` greeting line and forwards everything else verbatim.

## Configuration and Logging

Drop `rsync.njs` into `/etc/nginx/njs/` and include `rsync.conf` and `forbidden.conf` inside `stream {}`. Client notices can be customized via the four `rsync_queue_*_message` variables without rebuilding njs:

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

The access log captures `module`, `backend`, `status` (`200` completed, `403` forbidden, `429` queue full or aborted while queued, `500` handshake error, `503` ticket expired or upstream unavailable), `queued`, `initial_queue_position`, and `wait_seconds`. Keep `$rsync_initial_queue_position` in the log format—evaluating it at session end immediately frees the slot and cancels any remaining timers.

Full patch, tests, and config examples: [https://github.com/Palvef/njs/tree/stream-send-in-preread](https://github.com/Palvef/njs/tree/stream-send-in-preread).
