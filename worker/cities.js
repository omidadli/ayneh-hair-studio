/* City links for SMS campaigns (owner, Nov 2026). A short link ayneh-salon.site/<code> (e.g.
   /thr) sets the city for the visitor and opens the business site with UTM tags; the header
   counter then shows that city's places left, and a subscription bought there takes a place in
   that city (orders.city). Every city has its own monthly capacity. Codes are 3 letters so the
   links stay short; none collides with a page address. */
export const CITIES = {
  thr: 'تهران', mhd: 'مشهد', isf: 'اصفهان', shz: 'شیراز', tbz: 'تبریز', krj: 'کرج', ahv: 'اهواز', qom: 'قم',
  ksh: 'کرمانشاه', rsh: 'رشت', krm: 'کرمان', urm: 'ارومیه', yzd: 'یزد', hmd: 'همدان', ard: 'اردبیل', zhn: 'زاهدان',
  arak: 'اراک', bnd: 'بندرعباس', snd: 'سنندج', qzv: 'قزوین', zjn: 'زنجان', sar: 'ساری', gor: 'گرگان', bsh: 'بوشهر',
  kish: 'کیش', khr: 'خرم‌آباد', smn: 'سمنان', brj: 'بجنورد', ilm: 'ایلام', yas: 'یاسوج', shk: 'شهرکرد', bir: 'بیرجند', amol: 'آمل', kashan: 'کاشان'
};
export const DEFAULT_CITY = 'thr';
export const cityOf = code => Object.prototype.hasOwnProperty.call(CITIES, code) ? code : '';
export const cityFromCookie = req => cityOf(((req.headers.get('Cookie') || '').match(/(?:^|;\s*)ayneh_city=([a-z]{3,6})/) || [])[1] || '');
