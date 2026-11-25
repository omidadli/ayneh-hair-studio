/* «تبلیغات» tab in /admin (owner, Nov 2026): one row per campaign (the city code of the short
   link, '' = no link) with the whole funnel — visits, free signups, checkouts that reached the
   card step, unpaid ones, purchases and their money, stylists vs salons, reservations — for a
   time window. Counts only: no names, mobiles or photos. Visits come from the business pages
   (src/capacity.js → /api/campaign/hit, once per browser per campaign per day). */
import {CITIES} from './cities.js';
import {PLANS} from './prices.js';
const DAY = 86400000;
const all = async (db, sql, ...a) => (await db.prepare(sql).bind(...a).all()).results || [];

export async function campaignReport(db, days = 30, now = Date.now()) {
  const from = days > 0 ? now - days * DAY : 0;
  const rows = {};
  const row = c => rows[c] || (rows[c] = {campaign: c, label: c ? (CITIES[c] || c) : 'بدون لینک', visits: 0, visitors: 0, signups: 0, checkouts: 0, unpaid: 0, paid: 0, revenue: 0, stylists: 0, salons: 0, images_only: 0, reservations: 0, lines: {}});
  for (const r of await all(db, "SELECT meta c, COUNT(*) n, COUNT(DISTINCT visitor) v FROM events_log WHERE kind='cvisit' AND created_at>=? GROUP BY meta", from)) { const x = row(r.c || ''); x.visits = Number(r.n); x.visitors = Number(r.v); }
  for (const r of await all(db, "SELECT campaign c, COUNT(*) n FROM trials WHERE created_at>=? GROUP BY campaign", from)) row(r.c || '').signups += Number(r.n);
  for (const r of await all(db, "SELECT campaign c, COUNT(*) n FROM reservations WHERE created_at>=? GROUP BY campaign", from)) row(r.c || '').reservations += Number(r.n);
  // Orders: every order reached the card step (an order is made only when the card is shown).
  for (const o of await all(db, "SELECT city c, status, kind, plan, amount, line FROM orders WHERE created_at>=? AND kind IN ('plan','images','pack')", from)) {
    const x = row(o.c || '');
    x.checkouts++;
    if (o.status === 'paid') {
      x.paid++; x.revenue += Math.round(Number(o.amount || 0) / 10);
      const p = PLANS[o.plan] || {};
      if (o.kind === 'plan' && p.tier === 'full') { if (p.line === 'all') x.salons++; else x.stylists++; }
      else x.images_only++;
      const ln = p.line === 'all' ? 'salon' : (p.line || o.line || '');
      if (ln) x.lines[ln] = (x.lines[ln] || 0) + 1;
    } else if (['expired', 'cancelled'].includes(o.status)) x.unpaid++;
  }
  const list = Object.values(rows).sort((a, b) => b.visits - a.visits || b.paid - a.paid);
  const total = list.reduce((t, x) => { for (const k of ['visits', 'visitors', 'signups', 'checkouts', 'unpaid', 'paid', 'revenue', 'stylists', 'salons', 'images_only', 'reservations']) t[k] += x[k]; for (const [k, v] of Object.entries(x.lines)) t.lines[k] = (t.lines[k] || 0) + v; return t; },
    {campaign: '*', label: 'همه', visits: 0, visitors: 0, signups: 0, checkouts: 0, unpaid: 0, paid: 0, revenue: 0, stylists: 0, salons: 0, images_only: 0, reservations: 0, lines: {}});
  const active = await all(db, "SELECT settings FROM salons WHERE settings LIKE '%\"tier\":\"full\"%'");
  let liveStylists = 0, liveSalons = 0;
  for (const s of active) { try { const p = JSON.parse(s.settings).plan; if (p && Number(p.until) > now && p.tier === 'full') { if ((PLANS[p.key] || {}).line === 'all') liveSalons++; else liveStylists++; } } catch {} }
  return {days, campaigns: list, total, live: {stylists: liveStylists, salons: liveSalons}};
}
