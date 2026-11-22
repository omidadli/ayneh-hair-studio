// Coins for a regular customer («مشتری عادی») — the owner's plan (Nov 2026):
//   one coin = 2,000 toman; one image = 25 coins (50,000 toman); her first 2 images are free;
//   a top-up is any amount from 100,000 toman (2 images); 200,000+ gets 10% bonus coins,
//   500,000+ gets 20%. Bought coins never expire.
// Kept apart from worker/prices.js, which build.py generates from the salon price sheet:
// never move these into prices.js by hand, and never take a coin count from the browser.
//
// amount: TOMAN on the page; orders store RIALS (×10), like every other order.
// customer_ledger.delta is in COINS (drizzle/0026 turned the older image counts into coins).
export const COIN_TOMAN = 2000;
export const IMAGE_COINS = 25;
export const CUSTOMER_IMAGE_PRICE = COIN_TOMAN * IMAGE_COINS;   // 50,000 toman per image
export const CUSTOMER_FREE_IMAGES = 2;                          // free images on /studio, per person
export const TOPUP_MIN = 100000;                                // toman (2 images)
export const TOPUP_MAX = 10000000;                              // toman, one order
export const TOPUP_PRESETS = [100000, 200000, 500000];          // 50 / 110 / 300 coins
export const TOPUP_BONUS = [[500000, 20], [200000, 10]];        // [from toman, bonus %], largest first
export function coinsFor(toman) {
  const t = Math.floor(Number(toman) || 0), base = Math.floor(t / COIN_TOMAN);
  const pct = (TOPUP_BONUS.find(([from]) => t >= from) || [0, 0])[1];
  return {coins: base + Math.floor(base * pct / 100), base, bonus: Math.floor(base * pct / 100), pct};
}
// Referral: when a salon buys a plan through someone's link, both sides get this many images
// (a salon in its plan credit; a customer as REFERRAL_IMAGES × IMAGE_COINS coins).
export const REFERRAL_IMAGES = 10;
