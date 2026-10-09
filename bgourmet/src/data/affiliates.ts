import { siteInfo } from './site';

/**
 * 県ページに出すアフィリエイトのリンク。
 * - Klook（英語サイトのみ）：その県のツアー・体験の検索結果。東京・京都・大阪はフードツアー・料理教室のページも出す
 *   県ページの最後に JR パスのリンクも付ける
 * - 英語サイトのトップの「Plan your trip」：鉄道パス・新幹線、eSIM・Wi-Fi、空港アクセス（getTripEssentials）
 *   パートナー ID は src/data/site.json の klookAid（リンクの末尾に ?aid= で付ける）
 */
type Link = { label: string; url: string };

const KLOOK = 'https://www.klook.com/en-US';

// Klook に専用ページがある、食べ物の体験（県 ID → [ラベル, パス]）
const klookFood: Record<string, [string, string][]> = {
  tokyo: [
    ['Tokyo food tours', '/destination/c28-tokyo/1005-food-tours/'],
    ['Cooking classes in Tokyo', '/destination/c28-tokyo/1042-cooking-classes/'],
  ],
  kyoto: [
    ['Kyoto food tours', '/destination/c30-kyoto/1005-food-tours/'],
    ['Cooking classes in Kyoto', '/destination/c30-kyoto/1042-cooking-classes/'],
  ],
  osaka: [['Cooking classes in Osaka', '/destination/c29-osaka/1042-cooking-classes/']],
};

/**
 * Klook のウィジェット（サムネ付きの一覧）。県 ID → 種類 → Klook の管理画面で作ったコードの値
 * （data-adid・data-dest_id・data-tid）。コードは書き換えずにそのまま使う。
 * 種類：hotels（ホテル）・experiences（体験）・transport（交通・通信）。県ページの下にこの順で出す
 */
export type WidgetKind = 'hotels' | 'experiences' | 'transport';
/** prod はホテルのウィジェットだけ 'hotel_dynamic_widget'（管理画面のコードの data-prod。省略時は dynamic_widget） */
export type KlookWidgetCode = { adid: string; destId: string; tid: string; prod?: string };

export const klookWidgets: Record<string, Partial<Record<WidgetKind, KlookWidgetCode>>> = {
  hokkaido: {
    hotels: { adid: '1489767', destId: '133938', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484313', destId: '32', tid: '2' },
    transport: { adid: '1482654', destId: '32', tid: '5' },
  },
  aomori: {
    hotels: { adid: '1489789', destId: '6257', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484317', destId: '6257', tid: '2' },
    transport: { adid: '1482944', destId: '6257', tid: '5' },
  },
  iwate: {
    hotels: { adid: '1489788', destId: '4588', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484318', destId: '4588', tid: '2' },
    transport: { adid: '1482947', destId: '4588', tid: '5' },
  },
  miyagi: {
    hotels: { adid: '1489793', destId: '6850', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484321', destId: '6850', tid: '2' },
    transport: { adid: '1482955', destId: '6850', tid: '5' },
  },
  akita: {
    hotels: { adid: '1489791', destId: '4920', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484322', destId: '4920', tid: '2' },
    transport: { adid: '1482945', destId: '4920', tid: '5' },
  },
  yamagata: {
    hotels: { adid: '1489792', destId: '4507', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484320', destId: '4507', tid: '2' },
    transport: { adid: '1482952', destId: '4507', tid: '5' },
  },
  fukushima: {
    hotels: { adid: '1489795', destId: '6263', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484324', destId: '6263', tid: '2' },
    transport: { adid: '1482957', destId: '6263', tid: '5' },
  },
  ibaraki: {
    hotels: { adid: '1489832', destId: '5052', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484396', destId: '5052', tid: '2' },
    transport: { adid: '1482983', destId: '5052', tid: '5' },
  },
  tochigi: {
    hotels: { adid: '1489834', destId: '4689', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484398', destId: '4689', tid: '2' },
    transport: { adid: '1482985', destId: '4689', tid: '5' },
  },
  gunma: {
    hotels: { adid: '1489838', destId: '4259', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484400', destId: '4259', tid: '2' },
    transport: { adid: '1482986', destId: '4259', tid: '5' },
  },
  saitama: {
    hotels: { adid: '1489835', destId: '7259', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484402', destId: '7259', tid: '2' },
    transport: { adid: '1482987', destId: '7259', tid: '5' },
  },
  chiba: {
    hotels: { adid: '1489836', destId: '6139', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484403', destId: '6139', tid: '2' },
    transport: { adid: '1482988', destId: '6139', tid: '5' },
  },
  tokyo: {
    hotels: { adid: '1489841', destId: '28', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484404', destId: '28', tid: '2' },
    transport: { adid: '1482990', destId: '28', tid: '5' },
  },
  kanagawa: {
    hotels: { adid: '1489839', destId: '6806', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484406', destId: '6806', tid: '2' },
    transport: { adid: '1482991', destId: '6806', tid: '5' },
  },
  niigata: {
    hotels: { adid: '1489848', destId: '6810', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484445', destId: '6810', tid: '2' },
    transport: { adid: '1483091', destId: '6810', tid: '5' },
  },
  toyama: {
    hotels: { adid: '1489849', destId: '5851', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484449', destId: '5851', tid: '2' },
    transport: { adid: '1483094', destId: '5851', tid: '5' },
  },
  ishikawa: {
    hotels: { adid: '1489850', destId: '4693', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484451', destId: '4693', tid: '2' },
    transport: { adid: '1483099', destId: '4693', tid: '5' },
  },
  fukui: {
    hotels: { adid: '1489851', destId: '7240', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484452', destId: '7240', tid: '2' },
    transport: { adid: '1483101', destId: '7240', tid: '5' },
  },
  yamanashi: {
    hotels: { adid: '1489853', destId: '4529', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484458', destId: '4529', tid: '2' },
    transport: { adid: '1483106', destId: '4529', tid: '5' },
  },
  nagano: {
    hotels: { adid: '1489854', destId: '5483', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484465', destId: '5483', tid: '2' },
    transport: { adid: '1483108', destId: '5483', tid: '5' },
  },
  gifu: {
    hotels: { adid: '1489856', destId: '6370', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484480', destId: '6370', tid: '2' },
    transport: { adid: '1483112', destId: '6370', tid: '5' },
  },
  shizuoka: {
    hotels: { adid: '1489857', destId: '6409', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484493', destId: '6409', tid: '2' },
    transport: { adid: '1483113', destId: '6409', tid: '5' },
  },
  aichi: {
    hotels: { adid: '1489858', destId: '71', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484498', destId: '6069', tid: '2' },
    transport: { adid: '1483030', destId: '6069', tid: '5' },
  },
  mie: {
    hotels: { adid: '1489913', destId: '6241', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484608', destId: '6241', tid: '2' },
    transport: { adid: '1484185', destId: '6241', tid: '5' },
  },
  shiga: {
    hotels: { adid: '1489914', destId: '6339', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484609', destId: '6339', tid: '2' },
    transport: { adid: '1484187', destId: '6339', tid: '5' },
  },
  kyoto: {
    hotels: { adid: '1489916', destId: '5938', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484610', destId: '5938', tid: '2' },
    transport: { adid: '1484190', destId: '5938', tid: '5' },
  },
  osaka: {
    hotels: { adid: '1489917', destId: '6093', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484611', destId: '6093', tid: '2' },
    transport: { adid: '1484191', destId: '6093', tid: '5' },
  },
  hyogo: {
    hotels: { adid: '1489918', destId: '4819', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484614', destId: '4819', tid: '2' },
    transport: { adid: '1484192', destId: '4819', tid: '5' },
  },
  nara: {
    hotels: { adid: '1489919', destId: '7062', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484616', destId: '7062', tid: '2' },
    transport: { adid: '1484193', destId: '7062', tid: '5' },
  },
  wakayama: {
    hotels: { adid: '1489920', destId: '6255', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484618', destId: '6255', tid: '2' },
    transport: { adid: '1484195', destId: '6255', tid: '5' },
  },
  tottori: {
    hotels: { adid: '1490063', destId: '5923', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484639', destId: '5923', tid: '2' },
    transport: { adid: '1484208', destId: '5923', tid: '5' },
  },
  shimane: {
    hotels: { adid: '1490064', destId: '6922', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484643', destId: '6922', tid: '2' },
    transport: { adid: '1484210', destId: '6922', tid: '5' },
  },
  okayama: {
    hotels: { adid: '1490065', destId: '4467', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484644', destId: '4467', tid: '2' },
    transport: { adid: '1484211', destId: '4467', tid: '5' },
  },
  hiroshima: {
    hotels: { adid: '1490066', destId: '5122', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484645', destId: '5122', tid: '2' },
    transport: { adid: '1484212', destId: '5122', tid: '5' },
  },
  yamaguchi: {
    hotels: { adid: '1490067', destId: '8406', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484646', destId: '6251', tid: '2' },
    transport: { adid: '1484215', destId: '6251', tid: '5' },
  },
  tokushima: {
    hotels: { adid: '1490069', destId: '4987', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484649', destId: '4987', tid: '2' },
    transport: { adid: '1484259', destId: '4987', tid: '5' },
  },
  kagawa: {
    hotels: { adid: '1490071', destId: '5840', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484652', destId: '5840', tid: '2' },
    transport: { adid: '1484262', destId: '5840', tid: '5' },
  },
  ehime: {
    hotels: { adid: '1490070', destId: '5829', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484654', destId: '5829', tid: '2' },
    transport: { adid: '1484264', destId: '5829', tid: '5' },
  },
  kochi: {
    hotels: { adid: '1490072', destId: '5433', tid: '', prod: 'hotel_dynamic_widget' },
    experiences: { adid: '1484655', destId: '5433', tid: '2' },
    transport: { adid: '1484266', destId: '5433', tid: '5' },
  },
  fukuoka: {
    experiences: { adid: '1484739', destId: '5209', tid: '2' },
    transport: { adid: '1484280', destId: '5209', tid: '5' },
  },
  saga: {
    experiences: { adid: '1484740', destId: '7046', tid: '2' },
    transport: { adid: '1484281', destId: '7046', tid: '5' },
  },
  nagasaki: {
    experiences: { adid: '1484742', destId: '7057', tid: '2' },
    transport: { adid: '1484282', destId: '7057', tid: '5' },
  },
  kumamoto: {
    experiences: { adid: '1484746', destId: '4351', tid: '2' },
    transport: { adid: '1484283', destId: '4351', tid: '5' },
  },
  oita: {
    experiences: { adid: '1484744', destId: '4808', tid: '2' },
    transport: { adid: '1484284', destId: '4808', tid: '5' },
  },
  miyazaki: {
    experiences: { adid: '1484747', destId: '4341', tid: '2' },
    transport: { adid: '1484286', destId: '4341', tid: '5' },
  },
  kagoshima: {
    experiences: { adid: '1484749', destId: '4363', tid: '2' },
    transport: { adid: '1484287', destId: '4363', tid: '5' },
  },
  okinawa: {
    experiences: { adid: '1484751', destId: '6484', tid: '2' },
    transport: { adid: '1484289', destId: '6484', tid: '5' },
  },
};

function klook(path: string, params: Record<string, string> = {}): string {
  const url = new URL(KLOOK + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('aid', siteInfo.klookAid);
  return url.toString();
}

/** 県ページの下の「ホテル・体験・交通と通信」の欄の中身（英語サイトのみ） */
export function getPrefectureAffiliates(
  lang: string,
  prefId: string,
  prefName: string,
): { kind: WidgetKind; widget?: KlookWidgetCode; links: Link[] }[] {
  if (lang !== 'en' || !siteInfo.klookAid) return [];
  const widgets = klookWidgets[prefId] ?? {};
  const links: Record<WidgetKind, Link[]> = {
    hotels: [],
    experiences: [
      ...(klookFood[prefId] ?? []).map(([label, path]) => ({ label: `${label} (Klook)`, url: klook(path) })),
      { label: `Tours & activities in ${prefName} (Klook)`, url: klook('/search/result/', { query: prefName }) },
    ],
    transport: [{ label: 'Japan Rail Pass & regional rail passes (Klook)', url: klook('/transport/ttd/jrpass/') }],
  };
  return (['hotels', 'experiences', 'transport'] as const)
    .map((kind) => ({ kind, widget: widgets[kind], links: links[kind] }))
    .filter((b) => b.widget || b.links.length > 0);
}

/** 英語サイトのトップの「Plan your trip」に出す交通・通信のウィジェット（全国。管理画面のコードのまま） */
export const homeTransportWidget: KlookWidgetCode = { adid: '1482657', destId: '-1', tid: '5' };

/** 英語サイトのトップに出す、旅の準備のリンク */
export function getTripEssentials(lang: string): (Link & { note: string })[] {
  if (lang !== 'en' || !siteInfo.klookAid) return [];
  return [
    { label: 'Japan Rail Pass', note: 'Nationwide and regional JR passes', url: klook('/transport/ttd/jrpass/') },
    { label: 'Shinkansen tickets', note: 'Bullet train tickets on every line', url: klook('/japan-rail/') },
    { label: 'Japan eSIM', note: 'Mobile data from the moment you land', url: klook('/search/result/', { query: 'Japan eSIM' }) },
    { label: 'Pocket Wi-Fi', note: 'Pick up and return at the airport', url: klook('/search/result/', { query: 'Japan pocket wifi' }) },
    { label: 'Airport transfers', note: 'Skyliner, Narita Express, Haruka and more', url: klook('/search/result/', { query: 'Japan airport transfer' }) },
  ];
}
