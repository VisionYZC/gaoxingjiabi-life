/* 《高性价比人生指南》阅读站 · 交互
   原则：无依赖、无网络请求、JS 只做增强 —— 禁用 JS 时页面依然可读。 */
(function () {
  'use strict';

  /* ---------- 滚动进度 ---------- */
  var bar = document.querySelector('.progress');
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 证据条形图：滚到眼前再长出来 ---------- */
  var evFills = Array.prototype.slice.call(document.querySelectorAll('.ev-row__bar i[style*="--w"]'));
  if (evFills.length) {
    if ('IntersectionObserver' in window) {
      var evIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); evIo.unobserve(en.target); }
        });
      }, { threshold: .15 });
      evFills.forEach(function (el) { evIo.observe(el); });
    } else {
      evFills.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------- 侧栏目录高亮 ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var best = null, bestV = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestV) { bestV = visible[id]; best = id; }
      });
      tocLinks.forEach(function (a) { a.classList.remove('is-active'); });
      if (best && byId[best]) {
        byId[best].classList.add('is-active');
        var box = byId[best].parentNode;
        if (box && box.scrollHeight > box.clientHeight) {
          var r = byId[best].getBoundingClientRect(), br = box.getBoundingClientRect();
          if (r.top < br.top + 10 || r.bottom > br.bottom - 10) {
            box.scrollTop += r.top - br.top - box.clientHeight / 2 + r.height / 2;
          }
        }
      }
    }, { rootMargin: '-96px 0px -62% 0px', threshold: [0, .12, .5, 1] });
    tocLinks.forEach(function (a) {
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (t) io.observe(t);
    });
  }

  /* ---------- 顶栏当前页高亮 ---------- */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === here || (here === '' && href === 'index.html')) a.classList.add('is-active');
  });

  /* ---------- 原书全库：搜索 + 筛选 ---------- */
  var lib = document.getElementById('lib');
  if (lib) {
    var q = document.getElementById('q');
    var items = Array.prototype.slice.call(lib.querySelectorAll('.item'));
    var secs = Array.prototype.slice.call(lib.querySelectorAll('.sec'));
    var countEl = document.getElementById('count');
    var emptyEl = document.getElementById('empty');
    var evOn = {}, costOn = {};

    items.forEach(function (it) {
      var tx = it.textContent.replace(/\s+/g, ' ').toLowerCase();
      it.dataset.t = tx;
    });

    function apply() {
      var kw = (q && q.value || '').trim().toLowerCase();
      var evs = Object.keys(evOn).filter(function (k) { return evOn[k]; });
      var cs = Object.keys(costOn).filter(function (k) { return costOn[k]; });
      var shown = 0;

      items.forEach(function (it) {
        var ok = true;
        if (kw && it.dataset.t.indexOf(kw) === -1) ok = false;
        if (ok && evs.length && evs.indexOf(it.dataset.ev) === -1) ok = false;
        if (ok && cs.length) {
          var own = (it.dataset.cost || '').split(/\s+/);
          ok = cs.some(function (c) { return own.indexOf(c) !== -1; });
        }
        it.classList.toggle('is-hidden', !ok);
        if (ok) shown++;
      });

      secs.forEach(function (s) {
        var any = s.querySelector('.item:not(.is-hidden)');
        s.classList.toggle('is-hidden', !any);
      });

      if (countEl) countEl.innerHTML = '<b>' + shown + '</b> / ' + items.length + ' 条';
      if (emptyEl) emptyEl.style.display = shown ? 'none' : 'block';
    }

    if (q) {
      var timer;
      q.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(apply, 110);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); }
        if (e.key === 'Escape' && document.activeElement === q) { q.value = ''; apply(); }
      });
    }

    document.querySelectorAll('.chip').forEach(function (c) {
      c.addEventListener('click', function () {
        var t = c.dataset.type, v = c.dataset.val;
        var bag = t === 'ev' ? evOn : costOn;
        bag[v] = !bag[v];
        c.classList.toggle('is-on', !!bag[v]);
        apply();
      });
    });
    apply();
  }

  /* ---------- 行动计划：打勾 + 进度持久化 ---------- */
  var plan = document.getElementById('plan');
  if (plan) {
    var KEY = 'gxjr-plan-v1';
    var boxes = Array.prototype.slice.call(plan.querySelectorAll('.check input[type=checkbox]'));
    boxes.forEach(function (b, i) { b.dataset.k = 'k' + i; });

    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
    boxes.forEach(function (b) {
      if (saved[b.dataset.k]) b.checked = true;
      b.addEventListener('change', function () {
        if (b.checked) saved[b.dataset.k] = 1; else delete saved[b.dataset.k];
        try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
        paint();
      });
    });

    var fill = document.getElementById('pfill');
    var pnum = document.getElementById('pnum');
    function paint() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      if (pnum) pnum.textContent = n;
      if (fill) fill.style.width = (boxes.length ? (n / boxes.length) * 100 : 0) + '%';
    }
    paint();

    var clr = document.getElementById('pclear');
    if (clr) clr.addEventListener('click', function () {
      if (!confirm('清空所有已完成标记？（只清空你浏览器里存的记录）')) return;
      boxes.forEach(function (b) { b.checked = false; });
      saved = {};
      try { localStorage.removeItem(KEY); } catch (e) {}
      paint();
    });
  }

  /* ---------- 十二问自评：本地保存 + 导出 ---------- */
  var self = document.getElementById('selfcheck');
  if (self) {
    var SKEY = 'gxjr-self-v1';
    var inputs = Array.prototype.slice.call(self.querySelectorAll('input.selfinput, textarea'));
    var s = {};
    try { s = JSON.parse(localStorage.getItem(SKEY) || '{}') || {}; } catch (e) { s = {}; }
    inputs.forEach(function (el, i) {
      if (s[i]) el.value = s[i];
      el.addEventListener('input', function () {
        s[i] = el.value;
        try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {}
      });
    });

    var bar = document.createElement('p');
    bar.style.cssText = 'margin:16px 0 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center';
    var note = document.createElement('span');
    note.style.cssText = 'font-size:13px;color:#8A7351;font-family:var(--font-title)';
    note.textContent = '填写内容只存在你自己的浏览器里，不会上传。';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = '导出我的自评（Markdown）';
    btn.addEventListener('click', function () {
      var lines = ['# 我的 12 问自评', ''];
      self.querySelectorAll('tbody tr').forEach(function (tr) {
        var inp = tr.querySelector('input.selfinput, textarea');
        if (!inp) return;
        var cells = tr.querySelectorAll('th, td');
        var label = cells.length > 1 ? cells[1].textContent.replace(/\s+/g, ' ').trim() : '';
        lines.push('- ' + label + '：' + inp.value.trim());
      });
      var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '我的12问自评.md';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });
    bar.appendChild(btn);
    bar.appendChild(note);
    self.parentNode.insertBefore(bar, self.nextSibling);
  }

  /* ================================================================
     华丽层（全部是渐进增强：任何一步失败都不影响阅读）
     ================================================================ */
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- 数字滚动 ---------- */
  var nums = Array.prototype.slice.call(document.querySelectorAll('.hero__stats b'));
  if (nums.length && !reduce && window.requestAnimationFrame) {
    var settle = function () { nums.forEach(function (el) { el.textContent = el.dataset.v; }); };
    nums.forEach(function (el) { el.dataset.v = el.textContent; });
    setTimeout(function () {
      nums.forEach(function (el) {
        var target = parseInt(el.dataset.v, 10);
        if (!target) return;
        var t0 = null, dur = 1150;
        var step = function (ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step); else el.textContent = el.dataset.v;
        };
        el.textContent = '0';
        requestAnimationFrame(step);
      });
      // 兜底：无论动画是否被节流/中断，最终一定落在真实数值上
      setTimeout(settle, 2200);
    }, 420);
  }

  /* ---------- 封面水印视差 ---------- */
  var wm = document.querySelector('.hero__wm');
  if (wm && !reduce && window.requestAnimationFrame) {
    var pTick = false;
    var parallax = function () {
      wm.style.transform = 'translate3d(0,' + (window.scrollY * 0.16).toFixed(1) + 'px,0)';
      pTick = false;
    };
    window.addEventListener('scroll', function () {
      if (pTick) return;
      pTick = true;
      requestAnimationFrame(parallax);
    }, { passive: true });
  }

  /* ---------- 滚动入场（只挑有分量的大块，不逐条观察 498 条） ---------- */
  var revealSel = [
    '.band .h2', '.band .eyebrow', '.band .lede', '.band .res', '.band .formula',
    '.band .ev-row', '.band .secmap__card', '.band .scene__row', '.sec__head',
    '.plan-head .lede', '.plan-body h2'
  ].join(',');
  var revs = Array.prototype.slice.call(document.querySelectorAll(revealSel));
  if (revs.length && 'IntersectionObserver' in window && !reduce) {
    revs.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.setProperty('--rd', ((i % 6) * 65) + 'ms');
    });
    var rIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); rIo.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revs.forEach(function (el) { rIo.observe(el); });
  }

  /* ---------- 回到卷首 ---------- */
  var toTop = document.getElementById('totop');
  if (toTop) {
    var tOn = function () { toTop.classList.toggle('is-on', window.scrollY > 640); };
    window.addEventListener('scroll', tOn, { passive: true });
    tOn();
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ================================================================
     液态玻璃层：指针跟随的镜面高光 + 轻微 3D 倾斜 + 顶栏状态
     （纯增强：不做任何事也不影响阅读）
     ================================================================ */

  /* ---------- 顶栏：滚过一点之后变得更「实」 ---------- */
  var navEl = document.querySelector('.nav');
  if (navEl) {
    var navTick = function () { navEl.classList.toggle('is-scrolled', (window.scrollY || 0) > 24); };
    window.addEventListener('scroll', navTick, { passive: true });
    navTick();
  }

  /* ---------- 卡片：镜面高光跟着指针走 ---------- */
  var SHEEN = '.res, .secmap__card, .formula, .item, .check';
  if (!reduce && window.requestAnimationFrame) {
    var curCard = null, sheenRaf = 0, ptrX = 0, ptrY = 0;

    var flatten = function (el) {
      if (!el) return;
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    var paintSheen = function () {
      sheenRaf = 0;
      if (!curCard || !curCard.isConnected) return;
      var r = curCard.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var x = Math.max(0, Math.min(100, ((ptrX - r.left) / r.width) * 100));
      var y = Math.max(0, Math.min(100, ((ptrY - r.top) / r.height) * 100));
      curCard.style.setProperty('--mx', x.toFixed(2) + '%');
      curCard.style.setProperty('--my', y.toFixed(2) + '%');
      var tilts = curCard.classList.contains('res') || curCard.classList.contains('secmap__card') ||
                  curCard.classList.contains('formula');
      if (tilts) {
        curCard.style.setProperty('--ry', ((x - 50) / 50 * 2.4).toFixed(2) + 'deg');
        curCard.style.setProperty('--rx', ((50 - y) / 50 * 2.0).toFixed(2) + 'deg');
      }
    };

    document.addEventListener('pointermove', function (e) {
      var t = (e.target && e.target.closest) ? e.target.closest(SHEEN) : null;
      if (t !== curCard) { flatten(curCard); curCard = t; }
      ptrX = e.clientX; ptrY = e.clientY;
      if (curCard && !sheenRaf) sheenRaf = window.requestAnimationFrame(paintSheen);
    }, { passive: true });

    document.addEventListener('pointerleave', function () { flatten(curCard); curCard = null; }, { passive: true });
    window.addEventListener('blur', function () { flatten(curCard); curCard = null; });
  }
})();