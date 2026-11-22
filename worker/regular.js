// API for the regular customer flow (/try and the packs sheet on salon pages), the salon's
// referral card in /panel and the owner's timing figures. server.js calls regularApi() once;
// it answers only the paths below and returns null for everything else.
//
//  GET  /api/c/me?v=…            her free images (on /try), her own images, the packs, her link
//  POST /api/c/order {toman,v}   a 'customer_pack' (coin top-up) order; coins come from customerprices.js
//  GET  /api/c/order/:id         the order's figures for the sheet (card, amount, code, status)
//  GET  /api/panel/referral      the salon's referral link and how many rewards it has had
//  GET  /api/owner/timing        measured generation durations (owner only)
//
// There is no receipt step: confirmation is the shared webhook /api/pay/confirm (confirmOrder;
// the owner console's emergency confirm also works), which hands 'customer_pack' to customers.js.
import {must, uid, limited} from './domain.js';
import {smsReady} from './sms.js';
import {publicOrder, closeExpired, orderById, panelSalon, hashKey, ORDER_MINUTES, pickCard} from './orders.js';
import {CUSTOMER_IMAGE_PRICE, CUSTOMER_FREE_IMAGES, REFERRAL_IMAGES, IMAGE_COINS, COIN_TOMAN, TOPUP_MIN, TOPUP_MAX, TOPUP_PRESETS, TOPUP_BONUS, coinsFor} from './customerprices.js';
import {accountFor, anySession, customerBalance, directSalon, directUsed} from './customers.js';
import {codeFor, referralStats} from './rewards.js';
import {timingReport} from './timing.js';
import {uniqueAmount} from './paysms.js';

const J = (v, s = 200) => new Response(JSON.stringify(v), {status: s, headers: {'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store'}});
const run = (db, sql, ...a) => db.prepare(sql).bind(...a).run();
const fa = n => Number(n).toLocaleString('fa-IR');
const topups = () => TOPUP_PRESETS.map(toman => ({toman, ...coinsFor(toman)}));
const economy = () => ({coin_toman: COIN_TOMAN, image_coins: IMAGE_COINS, image_price: CUSTOMER_IMAGE_PRICE, min: TOPUP_MIN, max: TOPUP_MAX, bonus: TOPUP_BONUS, topups: topups()});

/* The sheet sees figures only: no mobile, no key, nothing about other orders. */
async function packView(db, env, row, origin) {
  const o = await publicOrder(db, env, row, {origin});
  return {id: o.id, ref: o.ref, kind: 'customer_pack', coins: Number(row.credits || 0), count: Number(row.credits || 0), amount: o.amount, card: o.card, card_owner: o.card_owner,
    status: o.status, created_at: o.created_at, expires_at: o.expires_at, minutes: ORDER_MINUTES};
}

export async function regularApi(req, env, u, path, {owner, clientIp}) {
  const db = env.DB;
  if (path === '/api/c/me' && req.method === 'GET') {
    await limited(db, 'c-me:' + clientIp(req), 3000);
    const s = await anySession(req, db), v = u.searchParams.get('v') || '';
    /* Her referral link needs an account: asking for it (ref=1) makes one once she can have one. */
    const acc = await accountFor(db, env, s, v, {create: u.searchParams.get('ref') === '1'});
    const bal = await customerBalance(db, acc?.id);
    await directSalon(db);
    const free = Math.max(0, CUSTOMER_FREE_IMAGES - await directUsed(db, s, v));
    let referral = null;
    if (acc && u.searchParams.get('ref') === '1') {
      const code = await codeFor(db, 'customer', acc.id);
      referral = {link: (env.APP_ORIGIN || u.origin) + '/salons?ref=' + code, ...await referralStats(db, 'customer', acc.id)};
    }
    return J({account: !!acc, verify: smsReady(env) && !s?.verified_phone, free: {per: CUSTOMER_FREE_IMAGES, left: free, coins: free * IMAGE_COINS}, own: bal,
      price: CUSTOMER_IMAGE_PRICE, ...economy(), referral});
  }
  if (path === '/api/c/order' && req.method === 'POST') {
    await limited(db, 'c-order:' + clientIp(req), 20, 'سفارش‌های زیادی از این شبکه باز شده؛ کمی بعد دوباره امتحان کنید');
    const b = await req.json().catch(() => ({}));
    /* {toman}: any amount in the range, whole thousands; an older page's {count} images still works. */
    const toman = b.toman !== undefined ? Number(b.toman) : Number(b.count) * CUSTOMER_IMAGE_PRICE;
    must(Number.isInteger(toman) && toman >= TOPUP_MIN && toman <= TOPUP_MAX && toman % 1000 === 0,
      'مبلغ شارژ را بین ' + fa(TOPUP_MIN) + ' و ' + fa(TOPUP_MAX) + ' تومان (مضرب هزار) انتخاب کنید.');
    const count = coinsFor(toman).coins;
    const s = await anySession(req, db);
    must(!smsReady(env) || s?.verified_phone, 'اول شمارهٔ موبایلت را تأیید کن', 403);
    const acc = await accountFor(db, env, s, b.v, {create: true});
    must(acc, 'صفحه را تازه کنید و دوباره امتحان کنید.', 400);
    const now = Date.now();
    await closeExpired(db);
    /* replaced_by lets a transfer already made to the replaced pack still be confirmed (orders.js confirmOrder). */
    const id = uid();
    await run(db, "UPDATE orders SET status='cancelled',replaced_by=?,updated_at=? WHERE customer_id=? AND kind='customer_pack' AND status='open'", id, now, acc.id);
    const row = {id, ref: 'AY' + Array.from(crypto.getRandomValues(new Uint8Array(6)), x => '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'[x % 32]).join(''),
      plan: 'شارژ ' + fa(count) + ' سکهٔ مشتری', amount: toman * 10, credits: count, created_at: now, expires_at: now + ORDER_MINUTES * 60000};
    /* No panel opens from this order: its key hash is of a random value nobody holds, and
       panel login only ever accepts kind 'plan'. */
    row.amount = await uniqueAmount(db, row.amount, id);
    await run(db, 'INSERT INTO orders(id,ref,plan,kind,service,credits,amount,salon_name,contact_name,phone,city,note,status,expires_at,access_key_hash,coupon,discount,salon_id,customer_id,card,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      row.id, row.ref, row.plan, 'customer_pack', '', count, row.amount, '', '', acc.phone || '', '', '', 'open', row.expires_at, await hashKey(uid()), '', 0, null, acc.id, await pickCard(db), now, now);
    try {
      const {notifyOwner} = await import('./alerts.js');
      await notifyOwner(env, {kind: 'order', level: 'good', text: 'شارژ ' + fa(count) + ' سکهٔ مشتری باز شد', detail: '💳 ' + row.ref + ' · ' + fa(row.amount / 10) + ' تومان\n⏳ ' + ORDER_MINUTES + ' دقیقه'});
    } catch {}
    return J(await packView(db, env, await orderById(db, row.id), u.origin));
  }
  const pack = path.match(/^\/api\/c\/order\/([a-f0-9-]{36})$/);
  if (pack && req.method === 'GET') {
    await closeExpired(db);
    const row = await orderById(db, pack[1]);
    must(row && row.kind === 'customer_pack', 'سفارش پیدا نشد.', 404);
    return J(await packView(db, env, row, u.origin));
  }
  if (path === '/api/panel/referral' && req.method === 'GET') {
    const {salon} = await panelSalon(req, db);
    const code = await codeFor(db, 'salon', salon.id);
    return J({link: (env.APP_ORIGIN || u.origin) + '/salons?ref=' + code, ...await referralStats(db, 'salon', salon.id), images: REFERRAL_IMAGES});
  }
  if (path === '/api/owner/timing' && req.method === 'GET') {
    await owner(req, env);
    const days = [7, 30, 90].includes(Number(u.searchParams.get('days'))) ? Number(u.searchParams.get('days')) : 30;
    return J(await timingReport(db, {days}));
  }
  return null;
}
