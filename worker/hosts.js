// Two sides of one worker (owner's decision, Nov 2026): the customers' site is the main domain
// (ayneh-salon.site); the salons' site is business.<main> (business.ayneh-salon.site).
export const BIZ = 'business.';
export const isBiz = u => u.hostname.toLowerCase().startsWith(BIZ);
export const mainOrigin = (u, env) => isBiz(u) ? u.protocol + '//' + u.host.slice(BIZ.length) : (env.APP_ORIGIN || u.origin);
export const bizOrigin = (u, env) => {
  if (isBiz(u)) return u.origin;
  const m = new URL(env.APP_ORIGIN || u.origin);
  return m.protocol + '//' + BIZ + m.host.replace(/^www\./, '');
};
