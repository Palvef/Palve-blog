'use strict';

(function () {
  var WORKER_SRC = [
    'const K = new Uint32Array([',
    '0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,',
    '0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,',
    '0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,',
    '0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,',
    '0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,',
    '0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,',
    '0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,',
    '0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2',
    ']);',
    'const W = new Uint32Array(64);',
    'const encoder = new TextEncoder();',
    'function sha256(str) {',
    '  const bytes = encoder.encode(str);',
    '  const len = bytes.length;',
    '  const bitLen = len * 8;',
    '  const blocks = ((len + 9 + 63) >> 6);',
    '  const buf = new Uint8Array(blocks * 64);',
    '  buf.set(bytes);',
    '  buf[len] = 0x80;',
    '  const view = new DataView(buf.buffer);',
    '  view.setUint32(buf.length - 8, Math.floor(bitLen / 0x100000000), false);',
    '  view.setUint32(buf.length - 4, bitLen >>> 0, false);',
    '  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;',
    '  for (let o = 0; o < buf.length; o += 64) {',
    '    for (let i = 0; i < 16; i++) W[i] = view.getUint32(o + i * 4, false);',
    '    for (let i = 16; i < 64; i++) {',
    '      const s0 = ((W[i-15]>>>7)|(W[i-15]<<25)) ^ ((W[i-15]>>>18)|(W[i-15]<<14)) ^ (W[i-15]>>>3);',
    '      const s1 = ((W[i-2]>>>17)|(W[i-2]<<15)) ^ ((W[i-2]>>>19)|(W[i-2]<<13)) ^ (W[i-2]>>>10);',
    '      W[i] = (W[i-16] + s0 + W[i-7] + s1) >>> 0;',
    '    }',
    '    let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;',
    '    for (let i = 0; i < 64; i++) {',
    '      const S1 = ((e>>>6)|(e<<26)) ^ ((e>>>11)|(e<<21)) ^ ((e>>>25)|(e<<7));',
    '      const ch = (e & f) ^ ((~e) & g);',
    '      const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;',
    '      const S0 = ((a>>>2)|(a<<30)) ^ ((a>>>13)|(a<<19)) ^ ((a>>>22)|(a<<10));',
    '      const maj = (a & b) ^ (a & c) ^ (b & c);',
    '      const t2 = (S0 + maj) >>> 0;',
    '      h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;',
    '    }',
    '    h0=(h0+a)>>>0; h1=(h1+b)>>>0; h2=(h2+c)>>>0; h3=(h3+d)>>>0;',
    '    h4=(h4+e)>>>0; h5=(h5+f)>>>0; h6=(h6+g)>>>0; h7=(h7+h)>>>0;',
    '  }',
    '  const out = new Uint8Array(32);',
    '  const ov = new DataView(out.buffer);',
    '  ov.setUint32(0,h0,false); ov.setUint32(4,h1,false); ov.setUint32(8,h2,false); ov.setUint32(12,h3,false);',
    '  ov.setUint32(16,h4,false); ov.setUint32(20,h5,false); ov.setUint32(24,h6,false); ov.setUint32(28,h7,false);',
    '  return out;',
    '}',
    'function meets(digest, difficulty) {',
    '  const full = difficulty >> 3;',
    '  const rem = difficulty & 7;',
    '  for (let i = 0; i < full; i++) { if (digest[i] !== 0) return false; }',
    '  if (rem && (digest[full] & ((0xff << (8 - rem)) & 0xff)) !== 0) return false;',
    '  return true;',
    '}',
    'function hexToBytes(hex) {',
    '  const arr = new Uint8Array(hex.length / 2);',
    '  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);',
    '  return arr;',
    '}',
    'self.onmessage = function (ev) {',
    '  const { salt, difficulty, ct } = ev.data;',
    '  const start = Date.now();',
    '  let nonce = 0;',
    '  while (true) {',
    '    const d = sha256(salt + ":" + nonce);',
    '    if (meets(d, difficulty)) {',
    '      const key = sha256("reveal:" + salt + ":" + nonce);',
    '      const cipher = hexToBytes(ct);',
    '      const plain = new Uint8Array(cipher.length);',
    '      for (let i = 0; i < cipher.length; i++) plain[i] = cipher[i] ^ key[i % key.length];',
    '      const text = new TextDecoder().decode(plain);',
    '      if (text.startsWith("ok:")) {',
    '        self.postMessage({ done: true, email: text.slice(3), nonce, ms: Date.now() - start });',
    '        return;',
    '      }',
    '    }',
    '    nonce++;',
    '    if ((nonce & 0x7fff) === 0) {',
    '      self.postMessage({ done: false, hashes: nonce, ms: Date.now() - start });',
    '    }',
    '  }',
    '};'
  ].join('\n');

  function solvePoW(cfg, onProgress, onDone) {
    var blob = new Blob([WORKER_SRC], { type: 'application/javascript' });
    var url = URL.createObjectURL(blob);
    var worker = new Worker(url);
    worker.onmessage = function (e) {
      if (e.data.done) {
        worker.terminate();
        URL.revokeObjectURL(url);
        onDone(e.data);
      } else if (onProgress) {
        onProgress(e.data);
      }
    };
    worker.postMessage(cfg);
    return worker;
  }

  function setupPowModal() {
    var cfg = window.PALVE_EMAIL_POW;
    if (!cfg) return;

    var triggers = document.querySelectorAll('[data-pow-email-trigger]');
    if (!triggers.length) return;

    var isEn = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
    var i18n = isEn ? {
      title: 'Email Verification',
      desc: 'Complete a brief browser Proof-of-Work (SHA-256) challenge to reveal the email address.',
      start: 'Verify & Reveal',
      working: 'Computing SHA-256 PoW…',
      progress: function (h, ms) { return 'Solving PoW: ' + h.toLocaleString() + ' hashes (' + (ms / 1000).toFixed(1) + 's)'; },
      verified: function (n, ms) { return 'Verified in ' + (ms / 1000).toFixed(2) + 's (nonce ' + n + ').'; },
      copy: 'Copy',
      copied: 'Copied'
    } : {
      title: '邮箱验证',
      desc: '为防止爬虫采集，需在浏览器本地完成一次轻量 SHA-256 工作量证明（PoW）后显示邮箱地址。',
      start: '开始验证并显示',
      working: '正在执行 SHA-256 计算…',
      progress: function (h, ms) { return '计算中：已完成 ' + h.toLocaleString() + ' 次哈希（' + (ms / 1000).toFixed(1) + 's）'; },
      verified: function (n, ms) { return '验证通过，耗时 ' + (ms / 1000).toFixed(2) + 's（nonce ' + n + '）。'; },
      copy: '复制',
      copied: '已复制'
    };

    var backdrop = document.createElement('div');
    backdrop.className = 'pow-modal-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML =
      '<div class="pow-modal" role="dialog" aria-modal="true" aria-labelledby="pow-modal-title">' +
        '<div class="pow-modal-header">' +
          '<h3 class="pow-modal-title" id="pow-modal-title">' + i18n.title + '</h3>' +
          '<button type="button" class="pow-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<p class="pow-modal-desc">' + i18n.desc + '</p>' +
        '<div class="pow-action-row">' +
          '<button type="button" class="pow-btn" id="pow-start-btn">' + i18n.start + '</button>' +
        '</div>' +
        '<div class="pow-status" id="pow-status" aria-live="polite"></div>' +
        '<div class="pow-result" id="pow-result" hidden></div>' +
      '</div>';
    document.body.appendChild(backdrop);

    var closeBtn = backdrop.querySelector('.pow-modal-close');
    var startBtn = backdrop.querySelector('#pow-start-btn');
    var statusEl = backdrop.querySelector('#pow-status');
    var resultEl = backdrop.querySelector('#pow-result');
    var activeWorker = null;
    var cachedEmail = null;

    function renderEmail(email) {
      resultEl.innerHTML = '';
      var link = document.createElement('a');
      link.href = 'mailto:' + email;
      link.textContent = email;
      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'pow-btn pow-btn-secondary';
      copyBtn.textContent = i18n.copy;
      copyBtn.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(function () {
            copyBtn.textContent = i18n.copied;
          });
        }
      });
      resultEl.appendChild(link);
      resultEl.appendChild(copyBtn);
      resultEl.hidden = false;
    }

    function openModal() {
      backdrop.hidden = false;
      if (cachedEmail) {
        renderEmail(cachedEmail);
      }
    }

    function closeModal() {
      backdrop.hidden = true;
      if (activeWorker) {
        activeWorker.terminate();
        activeWorker = null;
        startBtn.disabled = false;
      }
    }

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !backdrop.hidden) closeModal();
    });

    startBtn.addEventListener('click', function () {
      if (cachedEmail) {
        renderEmail(cachedEmail);
        return;
      }
      startBtn.disabled = true;
      statusEl.textContent = i18n.working;
      activeWorker = solvePoW(
        cfg,
        function (p) { statusEl.textContent = i18n.progress(p.hashes, p.ms); },
        function (res) {
          activeWorker = null;
          cachedEmail = res.email;
          startBtn.disabled = false;
          startBtn.hidden = true;
          statusEl.textContent = i18n.verified(res.nonce, res.ms);
          renderEmail(res.email);
        }
      );
    });

    triggers.forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    });
  }

  window.PalveEmailPoW = { solve: solvePoW };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPowModal);
  } else {
    setupPowModal();
  }
})();
