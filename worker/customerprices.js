// Coins for a regular customer («مشتری عادی») — the owner's plan (Nov 2026):
//   one coin = 2,000 toman; one image = 25 coins (50,000 toman); her first 2 images are free.
// Top-ups are whole images, so no coins are ever stranded below the price of an image:
//   any multiple of 50,000 toman from 100,000 (2 images), plus 1 gift image for every full
//   200,000 toman (200k = 5 images = 40,000 toman each; the owner's cost is ~20,000, so the
//   best price still keeps a 50% margin). Bought coins never expire.
// Kept apart from worker/prices.js, which build.py generates from the salon price sheet:
// never move these into prices.js by hand, and never take a coin count from the browser.
//
// amount: TOMAN on the page; orders store RIALS (×10), like every other order.
// customer_ledger.delta is in COINS (drizzle/0026 turned the older image counts into coins).
export const COIN_TOMAN = 2000;
export const IMAGE_COINS = 25;
export const CUSTOMER_IMAGE_PRICE = COIN_TOMAN * IMAGE_COINS;   // 50,000 toman per image
export const CUSTOMER_FREE_IMAGES = 2;                          // free images in the studio, per person
export const TOPUP_STEP = CUSTOMER_IMAGE_PRICE;                 // top-ups move in whole images
export const TOPUP_MIN = 100000;                                // toman (2 images)
export const TOPUP_MAX = 10000000;                              // toman, one order
export const TOPUP_PRESETS = [100000, 200000, 400000];          // 2 / 5 / 10 images
export const GIFT_EVERY = 200000;                               // +1 image for each full 200,000 toman
export function coinsFor(toman) {
  const t = Math.floor(Number(toman) || 0);
  const images = Math.floor(t / CUSTOMER_IMAGE_PRICE), gift = Math.floor(t / GIFT_EVERY);
  return {coins: (images + gift) * IMAGE_COINS, images: images + gift, gift, base: images * IMAGE_COINS, bonus: gift * IMAGE_COINS};
}
// Referral: when a salon buys a plan through someone's link, both sides get this many images
// (a salon in its plan credit; a customer as REFERRAL_IMAGES × IMAGE_COINS coins).
export const REFERRAL_IMAGES = 10;
