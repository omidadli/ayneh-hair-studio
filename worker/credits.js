// Image credits for salons that bought a plan (ESSENTIAL / PRO / SIGNATURE).
//
// Rules this file keeps:
//  * Only salons with settings.plan are metered. Owner-made, demo and trial salons are not.
//  * Credits come in through credit_ledger (+20/75/180 for a plan, +10×n for a top-up).
//  * Spending is the count of the salon's generations that did not fail, since the first plan
//    started. A failed image never costs a credit (the same rule as the per-person quota).
//  * A plan runs for its months from confirmation; renewing extends from the later of now and
//    the current end. After the end, the salon page stays up but makes no new images.
//  * The check happens before the image is ordered from the provider. Two images started at
//    the same instant can overshoot the balance by one each; the daily limit caps bursts.
import {Problem, uid, limited} from './domain.js';
import {PLANS, IMAGE_PRICES} from './prices.js';
import {LINE_KEYS} from './lines.js';

const DAY = 86400000;
export const MONTH = 30 * DAY;

const one = (db, sql, ...a) => db.prepare(sql).bind(...a).first();
const run = (db, sql, ...a) => db.prepare(sql).bind(...a).run();
const settingsOf = salon => { try { return JSON.parse(salon?.settings || '{}') || {}; } catch { return {}; } };

export const planOf = salon => {
  const p = settingsOf(salon).plan;
  return p && typeof p === 'object' && p.start ? p : null;
};

/* line: the service the credit is for (pricing v2, drizzle/0032); null = any line of the salon. */
/* line 'pool': toman credit of a subscription, usable by every line the salon has (see balance). */
export const POOL = 'pool';
export const imagePrice = line => IMAGE_PRICES[lineOf(line)]?.single || IMAGE_PRICES.hair.single;
export async function grant(db, salonId, delta, reason, orderId = null, line = null, staffId = null) {
  await run(db, 'INSERT INTO credit_ledger(id,salon_id,delta,reason,order_id,created_at,line,staff_id) VALUES(?,?,?,?,?,?,?,?)',
    uid(), salonId, Math.trunc(delta), String(reason), orderId, Date.now(), LINE_KEYS.includes(line) || line === POOL ? line : null, staffId || null);
}
/* Half of what a subscription costs, in toman (owner's order, Nov 2026). */
export const subCredit = key => Math.floor((Number(PLANS[key]?.amount) || 0) / 2);

/* Paid users at time t. settings.plan.seats is what the current period paid for; a renewal with
   another user count is written as a step {from, seats} that starts when the period it paid for
   starts (seat_steps), so added users are never free for the rest of the current period and
   users already paid for are never taken away before it ends. */
export function seatsAt(plan, t = Date.now()) {
  let seats = Math.trunc(Number(plan?.seats)) || 0;
  for (const s of Array.isArray(plan?.seat_steps) ? plan.seat_steps : []) if (Number(s.from) <= t) seats = Math.trunc(Number(s.seats)) || seats;
  return seats;
}
const LEGACY_LINES = {hair: ['hair', 'color'], color: ['color'], nails: ['nails'], lashes: ['lashes']};
const LINE_FA = {hair: 'مدل مو', color: 'رنگ مو', nails: 'ناخن', lashes: 'مژه'};

/* A confirmed plan: start (or extend) the plan and add its gift images.
   The order (when given) also decides what the salon offers and how many users it may have:
     * a «پنل آرایشگاه» plan (sheet `seats` > 0) opens every line and records the paid users
       (max(seats, orders.users)); while a salon plan is running, a new user count starts with
       the period it pays for (see seatsAt);
     * a single-service plan on a new salon, or one coming down from an ended salon plan, offers
       only the order's service (settings.lines);
     * a single-service plan for ANOTHER service while a single-service plan is running adds that
       service (nails, then lashes = nails + lashes) and extends the plan. A renewal of the same
       service changes nothing, so a salon that bought «مدل و رنگ مو» before the split keeps both.
   createOrder / createRenewal refuse a single-service order for a salon whose salon plan is still
   running, so the salon plan is never downgraded by a purchase. */
export async function applyPlan(db, salonId, {key, months, credits}, orderId) {
  const salon = await one(db, 'SELECT id,settings FROM salons WHERE id=?', salonId);
  if (!salon) throw new Problem(404, 'سالن پیدا نشد.');
  const settings = settingsOf(salon), now = Date.now();
  const prev = settings.plan && typeof settings.plan === 'object' ? settings.plan : null;
  const order = orderId ? await one(db, 'SELECT service,users FROM orders WHERE id=?', orderId) : null;
  const sheet = PLANS[key] || {};
  const from = Math.max(now, Number(prev?.until) || 0);
  settings.plan = {key, start: Number(prev?.start) || now, until: from + months * MONTH};
  const running = !!prev && Number(prev.until) > now;
  if (sheet.seats > 0) {
    const paid = Math.max(sheet.seats, Math.trunc(Number(order?.users)) || 0);
    if (running && PLANS[prev.key]?.seats > 0) {
      const steps = (Array.isArray(prev.seat_steps) ? prev.seat_steps : []).filter(s => Number(s.from) > now);
      settings.plan.seats = seatsAt(prev, now);
      if (paid !== (steps.length ? steps[steps.length - 1].seats : settings.plan.seats)) steps.push({from, seats: paid});
      if (steps.length) settings.plan.seat_steps = steps;
    } else settings.plan.seats = paid;
    settings.lines = [...LINE_KEYS];
    settings.service = 'all';
  } else if (order && LINE_KEYS.includes(order.service)) {
    const fromSalonPlan = !prev || PLANS[prev.key]?.seats > 0;
    const had = Array.isArray(settings.lines) ? settings.lines : LEGACY_LINES[settings.service] || null;
    if (fromSalonPlan || !running || !had) {
      /* no plan yet, an ended plan, or coming down from the salon plan: the order's service only.
         (A running single plan with no recorded service is a legacy all-lines salon: kept.) */
      if (fromSalonPlan || !running) { settings.lines = [order.service]; settings.service = order.service; }
    } else if (!had.includes(order.service)) {
      settings.lines = LINE_KEYS.filter(k => had.includes(k) || k === order.service);
    }
  }
  await run(db, 'UPDATE salons SET settings=? WHERE id=?', JSON.stringify(settings), salonId);
  if (credits > 0) await grant(db, salonId, credits, 'plan:' + key, orderId);
  return settings.plan;
}

/* Pricing v2 keys (sub_* = tier 'full', and the image-only plan 'images'): bought credits never
   expire, so the plan's end never stops images (only an empty line does). */
export const V2_IMAGES = 'images';
export const isV2 = key => key === V2_IMAGES || PLANS[key]?.tier === 'full';
const lineOf = l => LINE_KEYS.includes(l) ? l : 'hair';

/* What the salon has: null for a salon without a plan (not metered).
   Credits are per line (credit_ledger.line). A line spends its own credits first, then the shared
   pool (line NULL: older plan gifts, top-ups, referral rewards); so lines[x].left is what an image
   on line x can still use, and `left` is the salon's total. Spending is still counted from the
   salon's non-failed generations since the plan started (a failed image never costs a credit);
   the 360 view counts as hairstyle. */
export async function balance(db, salon) {
  const plan = planOf(salon);
  if (!plan) return null;
  const g = (await db.prepare('SELECT line,COALESCE(SUM(delta),0) n FROM credit_ledger WHERE salon_id=? GROUP BY line').bind(salon.id).all()).results || [];
  /* An image a customer paid for herself (generations.paid_by, worker/customers.js) is not the salon's. */
  const u = (await db.prepare("SELECT line,COUNT(*) n FROM generations WHERE salon_id=? AND state<>'fail' AND paid_by IS NULL AND created_at>=? GROUP BY line").bind(salon.id, plan.start).all()).results || [];
  const own = Object.fromEntries(LINE_KEYS.map(k => [k, 0])), used = Object.fromEntries(LINE_KEYS.map(k => [k, 0]));
  let shared = 0, pool = 0;
  for (const r of g) { if (LINE_KEYS.includes(r.line)) own[r.line] += Number(r.n); else if (r.line === POOL) pool += Number(r.n); else shared += Number(r.n); }
  for (const r of u) used[lineOf(r.line)] += Number(r.n);
  /* Images past a line's own credit take the shared images first (dearest line first, so the
     toman pool lasts longest), then the toman pool at that line's single-image price. */
  const rest = Object.fromEntries(LINE_KEYS.map(k => [k, Math.max(0, used[k] - own[k])]));
  let sharedLeft = shared;
  for (const k of [...LINE_KEYS].sort((a, b) => imagePrice(b) - imagePrice(a))) { const t = Math.min(sharedLeft, rest[k]); rest[k] -= t; sharedLeft -= t; }
  const poolLeft = Math.max(0, pool - LINE_KEYS.reduce((a, k) => a + rest[k] * imagePrice(k), 0));
  const lines = Object.fromEntries(LINE_KEYS.map(k => [k, {granted: own[k], used: used[k], left: Math.max(0, own[k] - used[k]) + sharedLeft + Math.floor(poolLeft / imagePrice(k))}]));
  const granted = shared + LINE_KEYS.reduce((a, k) => a + own[k], 0), usedAll = LINE_KEYS.reduce((a, k) => a + used[k], 0);
  const now = Date.now(), v2 = isV2(plan.key);
  const until = Number(plan.until) || 0;
  return {
    plan: plan.key, start: plan.start, until: until || null,
    days_left: until ? Math.max(0, Math.ceil((until - now) / DAY)) : 0,
    /* A v2 plan never "expires" for images; `active` says whether its subscription runs. */
    expired: v2 ? false : now >= until,
    v2, active: v2 ? PLANS[plan.key]?.tier === 'full' && until > now : now < until,
    granted, used: usedAll, left: Math.max(...LINE_KEYS.map(k => lines[k].left)), shared: sharedLeft, lines,
    pool: {granted: pool, left: poolLeft},
  };
}

/* Called right before an image is ordered. Throws a plain Persian message for the customer;
   the owner hears about it (once a day per salon), never with the customer's mobile or photo. */
/* One member's share. cap NULL = no cap (the salon's credit is the only limit). Credit bought for
   her (credit_ledger.staff_id) adds its value: image credits at that line's single price, toman
   as is. Used = her customers' non-failed images since the plan started, at single prices. */
export async function staffCredit(db, salon, staffId) {
  const plan = planOf(salon);
  const t = await one(db, 'SELECT id,name,credit_cap FROM team WHERE id=? AND salon_id=?', staffId, salon.id);
  if (!t) return null;
  const add = (await db.prepare('SELECT line,COALESCE(SUM(delta),0) n FROM credit_ledger WHERE salon_id=? AND staff_id=? GROUP BY line').bind(salon.id, staffId).all()).results || [];
  const extra = add.reduce((a, r) => a + (r.line === POOL ? Number(r.n) : Number(r.n) * imagePrice(r.line)), 0);
  const u = (await db.prepare("SELECT line,COUNT(*) n FROM generations WHERE salon_id=? AND staff_id=? AND state<>'fail' AND paid_by IS NULL AND created_at>=? GROUP BY line").bind(salon.id, staffId, plan ? plan.start : 0).all()).results || [];
  const used = u.reduce((a, r) => a + Number(r.n) * imagePrice(r.line), 0);
  const cap = t.credit_cap === null || t.credit_cap === undefined ? null : Number(t.credit_cap);
  return {id: t.id, name: t.name, cap, extra, used, left: cap === null ? null : Math.max(0, cap + extra - used)};
}

/* Every active member's share, for the manager's panel. */
export async function staffCredits(db, salon) {
  const rows = (await db.prepare('SELECT id FROM team WHERE salon_id=? AND active=1 ORDER BY created_at').bind(salon.id).all()).results || [];
  const out = [];
  for (const r of rows) out.push(await staffCredit(db, salon, r.id));
  return out.filter(Boolean);
}

export async function spendCredit(db, env, salon, line = 'hair', staffId = null) {
  const b = await balance(db, salon);
  if (!b) return null;
  if (staffId) {
    const st = await staffCredit(db, salon, staffId);
    if (st && st.left !== null && st.left < imagePrice(line)) throw new Problem(402, 'سهم ساخت تصویرِ آرایشگرت در این سالن تمام شده. انتخابت را بدون شبیه‌سازی برای سالن بفرست؛ خودشان با تو تماس می‌گیرند.');
  }
  const reason = b.expired ? 'expired' : b.lines[lineOf(line)].left <= 0 ? 'empty' : '';
  if (!reason) return b;
  /* One alert per salon per day: the limiter throws on the second call, which only skips it. */
  try {
    await limited(db, 'credit-alert:' + salon.id, 1);
    const {notifyOwner} = await import('./alerts.js');
    await notifyOwner(env, {
      salon, kind: 'credits', level: 'warn',
      text: reason === 'expired' ? 'پلن «' + salon.name + '» تمام شده و ساخت تصویر متوقف شد' : 'اعتبار تصویر «' + salon.name + '» تمام شد' + (b.v2 ? ' (' + LINE_FA[lineOf(line)] + ')' : ''),
      detail: 'از /panel می‌تواند اعتبار تازه بخرد یا پلن را تمدید کند.',
    });
  } catch {}
  throw new Problem(402, reason === 'expired'
    ? 'ساخت تصویر در این سالن فعلاً متوقف است. انتخابت را بدون شبیه‌سازی برای سالن بفرست؛ خودشان با تو تماس می‌گیرند.'
    : 'ساخت تصویر در این سالن فعلاً متوقف است. انتخابت را بدون شبیه‌سازی برای سالن بفرست؛ خودشان با تو تماس می‌گیرند.');
}

/* ---------- pricing v2: a confirmed order of kind 'images' / 'pack', or a sub_* plan ----------
   * 'images' (path 1) and 'pack' (a subscriber pack): the order's images go to its line only.
     A salon with no plan yet becomes image-only (plan key 'images', no end); the line is added to
     what the salon offers (settings.lines) unless it already offers every line.
   * a sub_* plan: applyPlan as before (one month; a salon subscription opens every line), then
     the lines the salon had bought images for stay offered, and the first pack bought with it
     (orders.credits on orders.line) is granted.
   Credits never expire (balance() never marks a v2 plan expired). */
export async function applyOrder(db, salonId, order) {
  const salon = await one(db, 'SELECT id,settings FROM salons WHERE id=?', salonId);
  if (!salon) throw new Problem(404, 'سالن پیدا نشد.');
  const before = settingsOf(salon);
  const had = Array.isArray(before.lines) ? before.lines : before.plan ? LEGACY_LINES[before.service] || null : [];
  const line = LINE_KEYS.includes(order.line) ? order.line : null;
  if (order.kind === 'plan') {
    const sheet = PLANS[order.plan] || {};
    await applyPlan(db, salonId, {key: order.plan, months: sheet.months || 1, credits: 0}, order.id);
    if (!(sheet.seats > 0) && had) {
      const now = settingsOf(await one(db, 'SELECT settings FROM salons WHERE id=?', salonId));
      const lines = LINE_KEYS.filter(k => had.includes(k) || (now.lines || []).includes(k));
      if (lines.length) { now.lines = lines; await run(db, 'UPDATE salons SET settings=? WHERE id=?', JSON.stringify(now), salonId); }
    }
  } else {
    const settings = before, now = Date.now();
    if (!settings.plan || typeof settings.plan !== 'object' || !settings.plan.start) {
      settings.plan = {key: V2_IMAGES, start: now};
      settings.lines = line ? [line] : [];
      settings.service = line || '';
    } else if (had && line && !had.includes(line)) {
      settings.lines = LINE_KEYS.filter(k => had.includes(k) || k === line);
    }
    await run(db, 'UPDATE salons SET settings=? WHERE id=?', JSON.stringify(settings), salonId);
  }
  /* A subscription without a pack still leaves a (zero) ledger row: confirmOrder's repair path
     reads the ledger to know an order was applied, so a retry never extends the month twice. */
  await grant(db, salonId, Math.max(0, Number(order.credits) || 0), order.kind === 'plan' ? 'sub:' + order.plan : order.kind, order.id, line, order.staff_id || null);
  /* The top tier of each (salon for 20, one service with the 200-image pack) buys «جذب مشتری و
     تبلیغات»: the salon is listed to Ayneh's regular customers while its month runs. */
  if (order.kind === 'plan' && PLANS[order.plan]?.tier === 'full' && (PLANS[order.plan].seats >= 20 || Number(order.credits) >= 200)) {
    const st = settingsOf(await one(db, 'SELECT settings FROM salons WHERE id=?', salonId));
    st.promoted_until = Number(st.plan?.until) || Date.now() + MONTH;
    await run(db, 'UPDATE salons SET settings=? WHERE id=?', JSON.stringify(st), salonId);
  }
  /* Half the subscription's price comes back as image credit: a salon subscription as toman for
     every service (spent at each service's single-image price); a one-service subscription as
     images of its own service at that single price (owner's order, Nov 2026). */
  const sub = order.kind === 'plan' && PLANS[order.plan]?.tier === 'full' ? PLANS[order.plan] : null;
  if (sub && subCredit(order.plan) > 0) {
    if (sub.line === 'all') await grant(db, salonId, subCredit(order.plan), 'sub-credit:' + order.plan, order.id, POOL);
    else await grant(db, salonId, Math.floor(subCredit(order.plan) / imagePrice(sub.line)), 'sub-credit:' + order.plan, order.id, sub.line);
  }
  return planOf(await one(db, 'SELECT settings FROM salons WHERE id=?', salonId));
}
