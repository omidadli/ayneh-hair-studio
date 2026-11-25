/* The live capacity counter in the business header (owner, Nov 2026). The number is real:
   /api/capacity counts this month's new subscribing salons (worker/orders.js capacity). It polls,
   and listens for 'ayneh:capacity' (fired by the checkout right after a confirmed purchase), so
   the buyer sees it tick down the moment her panel opens. */
(() => {
  const bar = document.getElementById('capBar');
  if (!bar || typeof fetch !== 'function') return;
  const num = document.getElementById('capNum'), tot = document.getElementById('capTotal'), fill = document.getElementById('capFill');
  const fa = n => Number(n).toLocaleString('fa-IR');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shown = null;
  const roll = (from, to) => {
    if (still || from === null) { num.textContent = fa(to); return; }
    let cur = from; const step = to < from ? -1 : 1;
    const tick = () => { cur += step; num.textContent = fa(cur); num.classList.remove('is-tick'); void num.offsetWidth; num.classList.add('is-tick'); if (cur !== to) setTimeout(tick, 140); };
    tick();
    if (to < from) { bar.classList.remove('is-drop'); void bar.offsetWidth; bar.classList.add('is-drop'); }
  };
  const load = () => fetch('/api/capacity', {cache: 'no-store'}).then(r => r.ok ? r.json() : null).then(d => {
    if (!d || !d.total) return;
    bar.hidden = false;
    tot.textContent = fa(d.total);
    fill.style.width = Math.max(4, Math.round(d.left / d.total * 100)) + '%';
    bar.classList.toggle('is-low', d.left <= Math.ceil(d.total * 0.2));
    bar.classList.toggle('is-full', d.left === 0);
    if (shown !== d.left) { roll(shown, d.left); shown = d.left; }
  }).catch(() => {});
  load();
  setInterval(() => { if (!document.hidden) load(); }, 20000);
  addEventListener('ayneh:capacity', () => setTimeout(load, 400));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
})();
