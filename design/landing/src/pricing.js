/* /pricing «خرید اشتراک و اعتبار»: the service tabs, the custom count, the salon pack picker, the
 * calculator, and what a signed-in salon panel already has. Buying itself is src/pay.js: every
 * [data-buy="v2"] button names WHAT to buy (kind, line, count / sub / pack); the server prices it
 * again from its own table, so nothing here can change an amount.
 * Three taps to the card number: (1) the service tab (pre-selected from ?s= or the panel),
 * (2) «خرید» on a card, (3) the confirm button in the sheet.
 */
(() => {
  const root = document.getElementById('pricing');
  if (!root) return;
  const P = window.__PR || {};
  const fa = n => new Intl.NumberFormat('fa-IR').format(n);
  const money = n => fa(n) + ' تومان';
  const LABEL = {hair: 'مدل مو', color: 'رنگ مو', nails: 'ناخن', lashes: 'مژه', salon: 'آرایشگاه'};
  const tabs = [...root.querySelectorAll('[data-ptab]')];
  const panels = [...root.querySelectorAll('[data-panel]')];
  let current = 'hair', panel = null;

  /* ---------- the cheapest way to make n images (used by the calculator) ---------- */
  /* Covers at least n images with the given packs ({count: amount}) and singles at single. */
  function cheapest(n, packs, single) {
    const sizes = Object.keys(packs).map(Number);
    const top = n + Math.max(0, ...sizes);
    const best = new Array(top + 1).fill(Infinity), pick = new Array(top + 1).fill(null);
    best[0] = 0;
    for (let i = 1; i <= top; i++) {
      if (best[i - 1] + single < best[i]) { best[i] = best[i - 1] + single; pick[i] = 1; }
      for (const s of sizes) if (i >= s && best[i - s] + packs[s] < best[i]) { best[i] = best[i - s] + packs[s]; pick[i] = s; }
    }
    let at = n;
    for (let i = n; i <= top; i++) if (best[i] < best[at]) at = i;
    const parts = {};
    for (let i = at; i > 0; i -= pick[i]) parts[pick[i]] = (parts[pick[i]] || 0) + 1;
    return {cost: best[at], images: at, parts};
  }
  const describe = parts => Object.entries(parts).sort((a, b) => b[0] - a[0])
    .map(([s, k]) => Number(s) === 1 ? fa(k) + ' عکس تکی' : (k > 1 ? fa(k) + ' بستهٔ ' : 'یک بستهٔ ') + fa(s) + 'تایی').join(' + ');

  const calc = document.getElementById('prCalc'), range = document.getElementById('prCalcN'), out = document.getElementById('prCalcOut');
  function drawCalc() {
    if (!calc) return;
    calc.hidden = current === 'salon' || !P.images?.[current];
    if (calc.hidden) return;
    const n = Number(range.value), img = P.images[current], subFee = P.subs[current];
    out.textContent = fa(n) + ' عکس';
    const a = cheapest(n, img.packs, img.single);
    const both = {...img.packs, ...P.subPacks[current]};
    const b = cheapest(n, both, img.single);
    const sub = subFee + b.cost;
    const pa = calc.querySelector('[data-calc="images"]'), pb = calc.querySelector('[data-calc="sub"]');
    pa.querySelector('b').textContent = money(a.cost);
    pb.querySelector('b').textContent = money(sub);
    const note = (p, t) => { let s = p.querySelector('small'); if (!s) { s = document.createElement('small'); p.append(s); } s.textContent = t; };
    note(pa, describe(a.parts));
    note(pb, 'اشتراک ' + money(subFee) + ' + ' + describe(b.parts));
    pa.classList.toggle('is-best', a.cost <= sub);
    pb.classList.toggle('is-best', sub < a.cost);
    const diff = Math.abs(a.cost - sub);
    document.getElementById('prCalcVerdict').textContent = sub < a.cost
      ? 'برای ' + fa(n) + ' عکس در ماه، اشتراک ' + money(diff) + ' ارزان‌تر است و همهٔ امکانات پنل را هم دارد.'
      : diff === 0 ? 'برای ' + fa(n) + ' عکس در ماه، هزینهٔ دو راه یکی است؛ اشتراک امکانات پنل را هم دارد.'
      : 'برای ' + fa(n) + ' عکس در ماه، «فقط ساخت تصویر» ' + money(diff) + ' ارزان‌تر است. از حدود ' + fa(breakEven()) + ' عکس در ماه، اشتراک به‌صرفه‌تر می‌شود.';
  }
  /* The first monthly count (in the slider's steps) where the subscription costs less. */
  function breakEven() {
    const img = P.images[current], both = {...img.packs, ...P.subPacks[current]};
    for (let n = 5; n <= 1000; n += 5) if (P.subs[current] + cheapest(n, both, img.single).cost < cheapest(n, img.packs, img.single).cost) return n;
    return 1000;
  }
  range?.addEventListener('input', drawCalc);

  /* «قیمت هر عکس» row of the comparison: the cheapest per-image price on each path. */
  function drawCompare() {
    const ci = root.querySelector('[data-cmp="images"]'), cs = root.querySelector('[data-cmp="sub"]');
    const salonRow = root.querySelector('[data-cmp-salon]');
    if (salonRow) salonRow.hidden = current !== 'salon';
    const lines = current === 'salon' ? Object.keys(P.images || {}) : [current];
    const per = (packs) => Math.min(...lines.flatMap(l => Object.entries(packs(l)).map(([n, a]) => Math.floor(a / n))));
    const hiImg = Math.max(...lines.map(l => P.images[l].single));
    if (ci) ci.textContent = 'از ' + money(per(l => P.images[l].packs)) + ' تا ' + money(hiImg);
    if (cs) cs.textContent = 'از ' + money(per(l => P.subPacks[l]));
  }

  /* ---------- tabs ---------- */
  function show(key) {
    if (!LABEL[key]) key = 'hair';
    current = key;
    tabs.forEach(t => { const on = t.dataset.ptab === key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    panels.forEach(p => { p.hidden = p.dataset.panel !== key; if (!p.hidden) panel = p; });
    drawCalc(); drawCompare(); drawSigned();
    try { const u = new URL(location.href); u.searchParams.set('s', key); history.replaceState(null, '', u); } catch {}
  }
  tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.ptab)));
  root.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => { show(b.dataset.goto); root.querySelector('.pr-tabs')?.scrollIntoView({behavior: 'smooth', block: 'start'}); }));
  root.querySelector('[role="tablist"]')?.addEventListener('keydown', e => {
    const i = tabs.indexOf(document.activeElement); if (i < 0 || !/Arrow/.test(e.key)) return;
    const next = tabs[(i + (e.key === 'ArrowLeft' ? 1 : -1) + tabs.length) % tabs.length];
    e.preventDefault(); next.focus(); show(next.dataset.ptab);
  });

  /* ---------- the custom count («تعداد دلخواه»): count × single, or the pack price at 5/10/20 ---------- */
  root.querySelectorAll('[data-custom]').forEach(box => {
    const input = box.querySelector('input'), sum = box.querySelector('.pr-custom__sum'), btn = box.querySelector('[data-buy]');
    const single = Number(btn.dataset.single), packs = JSON.parse(btn.dataset.packs || '{}'), line = btn.dataset.line;
    const max = Number(input.max) || 500;
    const sync = () => {
      let n = Math.round(Number(String(input.value).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 1);
      n = Math.max(1, Math.min(max, n));
      const amount = packs[n] || n * single;
      sum.textContent = money(amount);
      btn.dataset.count = String(n); btn.dataset.amount = String(amount);
      btn.dataset.title = fa(n) + ' عکس ' + LABEL[line];
      return n;
    };
    box.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => { input.value = String(Math.max(1, Math.min(max, sync() + Number(b.dataset.step)))); sync(); }));
    input.addEventListener('input', sync);
    input.addEventListener('change', () => { input.value = String(sync()); });
    sync();
  });

  /* ---------- the salon subscription's optional first pack ---------- */
  root.querySelectorAll('[data-pack-select]').forEach(btn => {
    const sel = document.getElementById(btn.dataset.packSelect), base = Number(btn.dataset.amount), name = btn.dataset.title;
    const sync = () => {
      const [line, pack] = (sel.value || '').split(':');
      const add = Number(sel.selectedOptions[0]?.dataset.add || 0);
      btn.dataset.line = line || ''; btn.dataset.pack = pack || '0';
      btn.dataset.amount = String(base + add);
      btn.dataset.title = name + (pack ? ' + بستهٔ ' + fa(pack) + ' عکس ' + LABEL[line] : '');
      btn.textContent = pack ? 'خرید · ' + money(base + add) : 'خرید';
    };
    sel.addEventListener('change', sync);
    sync();
  });

  /* ---------- a signed-in salon panel: no form, and what it already has ---------- */
  const signed = document.getElementById('prSigned');
  let me = null;
  function drawSigned() {
    if (!me || !signed) return;
    const p = me.pricing;
    const line = current === 'salon' ? '' : current;
    const left = p && line ? p.lines[line]?.left || 0 : null;
    signed.hidden = false;
    signed.replaceChildren();
    const b = document.createElement('b'); b.textContent = me.salon.name;
    signed.append('خرید برای «', b, '»');
    if (p && line) signed.append(' · اعتبار ' + LABEL[line] + ': ' + fa(left) + ' عکس');
    if (p?.sub && p.active) signed.append(' · ' + p.sub.name + ' فعال است');
    else if (p && p.image_only) signed.append(' · بدون اشتراک (فقط ساخت تصویر)');
    /* A running subscription that covers this tab: its packs can be bought alone. */
    root.querySelectorAll('[data-subscriber]').forEach(box => {
      const s = p?.sub, k = box.dataset.subscriber;
      box.hidden = !(s && p.active && (s.line === 'all' ? k === 'all' : k === s.line));
    });
  }
  const pick = new URLSearchParams(location.search).get('s');
  /* ---------- credit for one member of a salon (/pricing?for=<member id>) ----------
     The manager's panel gives each member this link; the manager can open it too. Only image
     credit is sold here (subscriber packs while the salon's subscription runs, else single
     packs); the server checks the same. */
  const forId = new URLSearchParams(location.search).get('for');
  if (forId && /^[a-f0-9-]{36}$/.test(forId)) {
    fetch('/api/staff-credit/' + forId).then(r => r.ok ? r.json() : Promise.reject(r)).then(d => {
      window.__AYN_STAFF = {id: d.member.id, name: d.member.name, salon: d.salon.name};
      document.documentElement.classList.add('pr-staff');
      if (freeBox) freeBox.hidden = true;
      if (freeOut) {
        freeOut.hidden = false;
        freeOut.textContent = 'خرید اعتبار برای «' + d.member.name + '» در «' + d.salon.name + '». هر بسته‌ای بخرید به اعتبار سالن و سهم ' + d.member.name + ' اضافه می‌شود.';
      }
      root.querySelectorAll('[data-kind="sub"]').forEach(b => { b.disabled = true; b.title = 'اشتراک را مدیر سالن می‌خرد'; });
      root.querySelectorAll('[data-subscriber]').forEach(box => { const k = box.dataset.subscriber; box.hidden = !(d.subscribed && (d.sub === 'all' ? k === 'all' : k === d.sub)); });
      if (!LABEL[pick]) show(d.sub === 'all' ? 'salon' : d.sub || d.lines[0] || 'hair');
    }).catch(() => { if (freeOut) { freeOut.hidden = false; freeOut.textContent = 'این لینک خرید معتبر نیست؛ از مدیر سالن لینک تازه بگیرید.'; } });
  }

  show(LABEL[pick] ? pick : 'hair');
  fetch('/api/panel/me', {credentials: 'same-origin'}).then(r => r.ok ? r.json() : null).then(d => {
    if (!d || !d.salon) return;
    me = d;
    window.__AYN_PANEL = {name: d.salon.name};
    if (freeBox) freeBox.hidden = true;
    if (freeOut) freeOut.hidden = true;
    window.__AYN_TRIAL = null;
    if (!LABEL[pick]) {
      const s = d.pricing?.sub, offered = d.pricing?.offered || [];
      show(s ? (s.line === 'all' ? 'salon' : s.line) : offered[0] || 'hair');
    } else drawSigned();
  }).catch(() => {});

  /* ---------- free signup: 3 images (owner's decision, Nov 2026) ----------
     Name + mobile (+ the SMS code when SMS is on) → /api/trial makes the page, sets the signup
     cookie and answers with the page address; the browser goes straight there. A browser that
     already signed up (cookie) buys for the same mobile and page without a form (src/pay.js). */
  const freeBox = document.getElementById('prFree'), freeOut = document.getElementById('prFreeOut');
  const su = document.getElementById('prSignup'), suForm = document.getElementById('prSignupForm');
  const suErr = document.getElementById('prSuErr'), codeBox = document.getElementById('prSuCodeBox'), go = document.getElementById('prSuGo');
  const openSu = () => { if (!su) return; su.hidden = false; document.documentElement.classList.add('pr-lock'); setTimeout(() => document.getElementById('prSuName')?.focus(), 60); };
  const shutSu = () => { if (!su) return; su.hidden = true; document.documentElement.classList.remove('pr-lock'); };
  document.getElementById('prFreeBtn')?.addEventListener('click', openSu);
  document.getElementById('prSignupX')?.addEventListener('click', shutSu);
  su?.addEventListener('click', e => { if (e.target === su) shutSu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && su && !su.hidden) shutSu(); });
  suForm?.addEventListener('submit', async e => {
    e.preventDefault();
    suErr.textContent = '';
    const name = document.getElementById('prSuName').value.trim(), tel = document.getElementById('prSuPhone').value.trim(), code = document.getElementById('prSuCode').value.trim();
    if (name.length < 2) { suErr.textContent = 'نام سالن یا نام کاری خود را بنویسید.'; return; }
    if (!tel) { suErr.textContent = 'شمارهٔ موبایل را بنویسید.'; return; }
    if (!codeBox.hidden && !code) { suErr.textContent = 'کد پیامک‌شده را بنویسید.'; return; }
    go.disabled = true;
    try {
      const r = await fetch('/api/trial', {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, salon: name, phone: tel, line: current === 'salon' ? 'hair' : current, consent: true, code: codeBox.hidden ? '' : code})});
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'ثبت‌نام انجام نشد؛ دوباره امتحان کنید.');
      if (d.code_sent) { codeBox.hidden = false; go.textContent = 'تأیید کد و گرفتن ۳ تصویر رایگان'; document.getElementById('prSuCode').focus(); return; }
      /* Signed up to reserve a place (src/capacity.js): stay here and open the form. */
      if (window.__AYN_AFTER_SIGNUP) { const next = window.__AYN_AFTER_SIGNUP; window.__AYN_AFTER_SIGNUP = null; window.__AYN_TRIAL = {name, phone: tel}; shutSu(); next(); return; }
      go.textContent = 'صفحهٔ شما آماده شد…';
      const line = d.line || (current === 'salon' ? 'hair' : current);
      location.href = d.url + (d.url.includes('?') ? '&' : '?') + 'l=' + line;
    } catch (err) { suErr.textContent = err.message; } finally { go.disabled = false; }
  });
  fetch('/api/trial/me', {credentials: 'same-origin'}).then(r => r.ok ? r.json() : null).then(d => {
    const t = d?.trial;
    if (!t || window.__AYN_PANEL) return;
    if (freeBox) freeBox.hidden = true;
    if (t.converted) return;
    window.__AYN_TRIAL = {name: t.name, phone: t.phone};
    if (freeOut) {
      freeOut.hidden = false;
      freeOut.textContent = t.images_left > 0
        ? 'صفحهٔ رایگان شما فعال است · ' + fa(t.images_left) + ' تصویر رایگان مانده. هر بسته یا اشتراکی بخرید، روی شمارهٔ ' + '\u2066' + t.phone + '\u2069 و همان صفحه فعال می‌شود.'
        : 'تصویرهای رایگان شما تمام شد. بسته یا اشتراک را انتخاب کنید؛ روی شمارهٔ ' + '\u2066' + t.phone + '\u2069 و همان صفحه فعال می‌شود.';
    }
    if (!LABEL[pick] && t.line) show(t.line);
  }).catch(() => {});

  /* ---------- the checkout sheet: a close button and no page scroll behind it ---------- */
  const sheet = document.getElementById('pay');
  if (sheet) {
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'pr-close'; close.setAttribute('aria-label', 'بستن'); close.textContent = '×';
    sheet.querySelector('.pay-card')?.prepend(close);
    const shut = () => { sheet.hidden = true; document.documentElement.classList.remove('pr-lock'); dispatchEvent(new CustomEvent('ayneh:pay-close')); };
    close.addEventListener('click', shut);
    sheet.addEventListener('click', e => { if (e.target === sheet) shut(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) shut(); });
    new MutationObserver(() => document.documentElement.classList.toggle('pr-lock', !sheet.hidden)).observe(sheet, {attributes: true, attributeFilter: ['hidden']});
  }
})();
