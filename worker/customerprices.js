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
export const CUSTOMER_FREE_IMAGES = 2;
// The photo analysis (worker/consult.js): one free per person, then this many coins each. Its
// provider cost is a fraction of a coin (~0.1–0.5 KIE credit ≈ a few hundred toman), so one coin
// (2,000 toman) is the smallest price that is still at least twice the cost (owner's rule).
export const CONSULT_COINS = 10;  // 20,000 toman (owner's price, Nov 2026)
export const CONSULT_FREE = 1;
// Templates (story, reels, TikTok, profile) and the download without the Ayneh mark: 10 coins
// each (20,000 toman), charged once per result and format; the marked download stays free.
export const EXPORT_COINS = 10;
// Story reward (owner, Nov 2026): once per account, 100 coins for a story that shows her Ayneh
// result with a link to the site; a vision model checks the screenshot (worker/server.js).
export const STORY_REWARD_COINS = 100;
export const EXPORT_KINDS = ['story', 'reels', 'tiktok', 'profile', 'clean'];                          // free images in the studio, per person
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
