(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const C = window.STACK_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---- ссылки из конфига ---- */
  const setLink = (sel, url) => $$(sel).forEach(a => { if (url) { a.href = url; a.hidden = false; } else a.hidden = true; });
  setLink('[data-cfg="repo"]', C.repo);
  setLink('[data-cfg="github"]', C.github);
  setLink('[data-cfg="tenchat"]', C.tenchat);
  if (!C.repo) $$('[data-needs="repo"]').forEach(e => e.hidden = true);

  /* ---- донаты ---- */
  const D = C.donate || {};
  const isUrl = v => /^https?:\/\//i.test(v);
  const items = [
    ['sbp', 'СБП', 'Быстрый перевод по QR или ссылке'],
    ['card', D.cardLabel || 'Карта', 'Перевод на карту'],
    ['boosty', 'Boosty', 'Регулярная поддержка подпиской'],
    ['yoomoney', 'ЮMoney', 'Перевод из кошелька или картой'],
    ['crypto', 'Крипто', 'Адрес кошелька — нажмите, чтобы скопировать']
  ].filter(([k]) => D[k]);
  const box = $('#donate-methods');
  if (box) {
    if (!items.length) { box.hidden = true; const m = $('#donate-soon'); if (m) m.hidden = false; }
    items.forEach(([k, title, hint]) => {
      const v = D[k];
      const el = document.createElement(isUrl(v) ? 'a' : 'button');
      el.className = 'dm';
      if (isUrl(v)) { el.href = v; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
      else { el.type = 'button'; el.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(v); } catch (_) {}
        const s = $('small', el); const old = s.textContent; s.textContent = 'Скопировано ✓'; setTimeout(() => s.textContent = old, 1800); }); }
      el.innerHTML = '<b></b><small></small>';
      $('b', el).textContent = title; $('small', el).textContent = isUrl(v) ? hint : (k === 'crypto' ? hint : v);
      box.appendChild(el);
    });
  }
  if (C.publicEmail) $$('[data-cfg="email"]').forEach(a => { a.href = 'mailto:' + C.publicEmail; a.textContent = C.publicEmail; a.hidden = false; });

  /* ---- меню ---- */
  const nav = $('#nav'), burger = $('#burger');
  burger && burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  $$('#nav a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));
  const head = $('header.top');
  const onScroll = () => head.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- появление при прокрутке ---- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 }) : null;
  $$('.reveal').forEach(e => io ? io.observe(e) : e.classList.add('in'));

  /* ---- счётчики ---- */
  const cio = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const to = +e.target.dataset.count, t0 = performance.now(), d = 1400;
    const step = t => { const k = Math.min(1, (t - t0) / d); e.target.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); }), { threshold: .6 }) : null;
  $$('[data-count]').forEach(e => cio ? cio.observe(e) : e.textContent = e.dataset.count);

  /* ---- вкладки скриншотов ---- */
  const tabs = $$('.shot-tab'), img = $('#shot-img'), cap = $('#shot-cap');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { x.classList.toggle('on', x === t); x.setAttribute('aria-selected', x === t); });
    img.style.opacity = 0;
    setTimeout(() => { img.src = t.dataset.src; img.alt = t.dataset.alt; cap.textContent = t.dataset.cap; img.style.opacity = 1; }, 160);
  }));

  /* ---- FAQ: по одному ---- */
  $$('details.faq').forEach(d => d.addEventListener('toggle', () => { if (d.open) $$('details.faq').forEach(o => { if (o !== d) o.open = false; }); }));

  /* ---- фон героя: сеть ---- */
  const cv = $('#net'); if (cv && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const x = cv.getContext('2d'); let W, H, N = [], dpr = Math.min(2, devicePixelRatio || 1), mx = -1e3, my = -1e3, run = true;
    const init = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(24, Math.min(70, Math.round(W * H / 17000)));
      N = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: 1.5 + Math.random() * 2.2, t: Math.random() < .2 })); };
    const pk = []; let tick = 0;
    const draw = () => { if (!run) return; x.clearRect(0, 0, W, H);
      for (const a of N) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1; }
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) { const a = N[i], b = N[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 150) { x.strokeStyle = `rgba(79,140,255,${.22 * (1 - d / 150)})`; x.lineWidth = 1; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); } }
      if (++tick % 40 === 0 && pk.length < 6) { const i = Math.random() * N.length | 0; let best = null, bd = 150; N.forEach((b, j) => { const d = Math.hypot(N[i].x - b.x, N[i].y - b.y); if (j !== i && d < bd) { bd = d; best = j; } }); if (best !== null) pk.push({ a: i, b: best, k: 0 }); }
      for (let i = pk.length - 1; i >= 0; i--) { const p = pk[i], a = N[p.a], b = N[p.b]; p.k += .025; if (p.k >= 1) { pk.splice(i, 1); continue; }
        const px = a.x + (b.x - a.x) * p.k, py = a.y + (b.y - a.y) * p.k; x.fillStyle = '#22d3ee'; x.shadowColor = '#22d3ee'; x.shadowBlur = 12; x.beginPath(); x.arc(px, py, 2.6, 0, 7); x.fill(); x.shadowBlur = 0; }
      for (const a of N) { const near = Math.hypot(a.x - mx, a.y - my) < 110; x.fillStyle = a.t ? '#8b5cf6' : (near ? '#22d3ee' : '#4f8cff'); x.beginPath(); x.arc(a.x, a.y, a.r + (near ? 1.5 : 0), 0, 7); x.fill(); }
      requestAnimationFrame(draw); };
    addEventListener('resize', init); cv.parentElement.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    new IntersectionObserver(e => { const v = e[0].isIntersecting; if (v && !run) { run = true; draw(); } run = v; }).observe(cv);
    init(); draw();
  }

  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
