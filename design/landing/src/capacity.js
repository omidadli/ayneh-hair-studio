/* The live capacity counter in the business header (owner, Nov 2026). The number is real:
   /api/capacity counts this month's new subscribing salons (worker/orders.js capacity). It polls
   and listens for 'ayneh:capacity' (the checkout fires it right after a confirmed purchase), so the
   buyer sees it tick down the moment her panel opens. When the month is full, every subscription
   button becomes «درخواست رزرو جایگاه»: a professional who has not signed up signs up first
   (the free signup on /pricing), then leaves name, family name, mobile and role (/api/reserve). */
(() => {
  const bar = document.getElementById('capBar');
  if (!bar || typeof fetch !== 'function') return;
  const num = document.getElementById('capNum'), arc = document.getElementById('capArc'), go = document.getElementById('capGo'), txt = document.getElementById('capTxt');
  const fa = n => Number(n).toLocaleString('fa-IR');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = 119.4;
  let shown = null, full = false;
  const roll = (from, to) => {
    if (still || from === null) { num.textContent = fa(to); return; }
    let cur = from; const step = to < from ? -1 : 1;
    const tick = () => { cur += step; num.textContent = fa(cur); num.classList.remove('is-tick'); void num.offsetWidth; num.classList.add('is-tick'); if (cur !== to) setTimeout(tick, 160); };
    tick();
    if (to < from) { bar.classList.remove('is-drop'); void bar.offsetWidth; bar.classList.add('is-drop'); }
  };
  const load = () => fetch('/api/capacity', {cache: 'no-store'}).then(r => r.ok ? r.json() : null).then(d => {
    if (!d || !d.total) return;
    bar.hidden = false;
    if (arc) arc.style.strokeDashoffset = String(C * (1 - d.left / d.total));
    bar.classList.toggle('is-low', d.left <= Math.ceil(d.total * 0.2));
    if (shown !== d.left) { roll(shown, d.left); shown = d.left; }
    if ((d.left === 0) !== full) { full = d.left === 0; setFull(); }
  }).catch(() => {});

  /* ---------- month full: «درخواست رزرو جایگاه» ---------- */
  function setFull() {
    bar.classList.toggle('is-full', full);
    if (txt) txt.textContent = full ? 'ظرفیت این ماه تکمیل شد' : 'ظرفیت باقی‌مانده';
    if (go) go.firstChild.textContent = full ? 'درخواست رزرو جایگاه' : 'رزرو جایگاه';
    bar.href = full ? '/pricing?reserve=1' : '/pricing';
    document.querySelectorAll('[data-kind="sub"]').forEach(b => {
      if (!b.dataset.label) b.dataset.label = b.textContent;
      b.textContent = full ? 'درخواست رزرو جایگاه' : b.dataset.label;
      b.classList.toggle('is-reserve', full);
    });
  }
  // Capture phase: a full month never opens the checkout for a subscription.
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-kind="sub"]');
    if (!full || !b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    reserve(b.dataset.sub && b.dataset.sub.indexOf('salon') >= 0 ? 'salon' : (b.dataset.line || ''));
  }, true);

  let dlg = null;
  function reserve(line) {
    const signed = window.__AYN_PANEL || window.__AYN_TRIAL;
    if (!signed && document.getElementById('prSignup')) {
      // First the free signup; pricing.js opens this form after it instead of leaving the page.
      window.__AYN_AFTER_SIGNUP = () => form(line);
      document.getElementById('prFreeBtn')?.click() || (document.getElementById('prSignup').hidden = false);
      return;
    }
    if (!signed && location.pathname !== '/pricing') { location.href = '/pricing?reserve=1'; return; }
    form(line);
  }
  window.AynehReserve = reserve;
  function form(line) {
    if (dlg) dlg.remove();
    dlg = document.createElement('div');
    dlg.className = 'rsv';
    dlg.innerHTML = '<form class="rsv__card" novalidate><button type="button" class="rsv__x" aria-label="بستن">×</button>'
      + '<h2>درخواست رزرو جایگاه</h2><p>ظرفیت این ماه تکمیل شده. مشخصاتتان را بفرستید تا با باز شدن اولین جایگاه، پیش از همه با شما تماس بگیریم.</p>'
      + '<div class="rsv__pair"><label>نام<input name="first" autocomplete="given-name" required></label><label>نام خانوادگی<input name="last" autocomplete="family-name" required></label></div>'
      + '<label>شمارهٔ موبایل<input name="phone" type="tel" inputmode="tel" dir="ltr" autocomplete="tel" placeholder="09121234567" required></label>'
      + '<div><b style="font-size:13px">آرایشگر هستید یا سالن‌دار؟</b><div class="rsv__roles" style="margin-top:6px"><button type="button" data-role="stylist" aria-pressed="' + (line === 'salon' ? 'false' : 'true') + '">آرایشگر</button><button type="button" data-role="salon" aria-pressed="' + (line === 'salon' ? 'true' : 'false') + '">سالن‌دار</button></div></div>'
      + '<p class="rsv__err" role="alert"></p><button class="btn btn--lg" type="submit">ارسال درخواست</button></form>';
    document.body.append(dlg);
    const f = dlg.querySelector('form'), err = dlg.querySelector('.rsv__err');
    let role = line === 'salon' ? 'salon' : 'stylist';
    dlg.querySelectorAll('[data-role]').forEach(b => b.addEventListener('click', () => { role = b.dataset.role; dlg.querySelectorAll('[data-role]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
    const shut = () => { dlg.remove(); dlg = null; };
    dlg.querySelector('.rsv__x').addEventListener('click', shut);
    dlg.addEventListener('click', e => { if (e.target === dlg) shut(); });
    f.addEventListener('submit', async e => {
      e.preventDefault(); err.textContent = '';
      const body = {first_name: f.first.value.trim(), last_name: f.last.value.trim(), phone: f.phone.value.trim(), role, line};
      if (body.first_name.length < 2 || body.last_name.length < 2) { err.textContent = 'نام و نام خانوادگی را بنویسید.'; return; }
      if (!body.phone) { err.textContent = 'شمارهٔ موبایل را بنویسید.'; return; }
      const btn = f.querySelector('[type=submit]'); btn.disabled = true;
      try {
        const r = await fetch('/api/reserve', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || 'ارسال نشد؛ دوباره امتحان کنید.');
        f.innerHTML = '<div class="rsv__ok"><b>درخواست شما ثبت شد ✓</b><p>با باز شدن اولین جایگاه، پیش از همه با شما تماس می‌گیریم.</p><button type="button" class="btn">باشه</button></div>';
        f.querySelector('.btn').addEventListener('click', shut);
      } catch (x) { err.textContent = x.message; btn.disabled = false; }
    });
    setTimeout(() => f.first.focus(), 50);
  }

  load();
  setInterval(() => { if (!document.hidden) load(); }, 20000);
  addEventListener('ayneh:capacity', () => setTimeout(load, 400));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
  if (/[?&]reserve=1/.test(location.search)) setTimeout(() => { if (full) reserve(''); }, 1200);
})();
