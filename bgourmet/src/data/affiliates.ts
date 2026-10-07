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
export type KlookWidgetCode = { adid: string; destId: string; tid: string };

export const klookWidgets: Record<string, Partial<Record<WidgetKind, KlookWidgetCode>>> = {
  hokkaido: {
    transport: { adid: '1482654', destId: '32', tid: '5' },
  },
  aomori: {
    transport: { adid: '1482944', destId: '6257', tid: '5' },
  },
  iwate: {
    transport: { adid: '1482947', destId: '4588', tid: '5' },
  },
  miyagi: {
    transport: { adid: '1482955', destId: '6850', tid: '5' },
  },
  akita: {
    transport: { adid: '1482945', destId: '4920', tid: '5' },
  },
  yamagata: {
    transport: { adid: '1482952', destId: '4507', tid: '5' },
  },
  fukushima: {
    transport: { adid: '1482957', destId: '6263', tid: '5' },
  },
  ibaraki: {
    transport: { adid: '1482983', destId: '5052', tid: '5' },
  },
  tochigi: {
    transport: { adid: '1482985', destId: '4689', tid: '5' },
  },
  gunma: {
    transport: { adid: '1482986', destId: '4259', tid: '5' },
  },
  saitama: {
    transport: { adid: '1482987', destId: '7259', tid: '5' },
  },
  chiba: {
    transport: { adid: '1482988', destId: '6139', tid: '5' },
  },
  tokyo: {
    transport: { adid: '1482990', destId: '28', tid: '5' },
    // dest_id=-1（地域は自動）のコード。東京の体験が出るので、東京の体験として使う
    experiences: { adid: '1482657', destId: '-1', tid: '-1' },
  },
  kanagawa: {
    transport: { adid: '1482991', destId: '6806', tid: '5' },
  },
  niigata: {
    transport: { adid: '1483091', destId: '6810', tid: '5' },
  },
  toyama: {
    transport: { adid: '1483094', destId: '5851', tid: '5' },
  },
  ishikawa: {
    transport: { adid: '1483099', destId: '4693', tid: '5' },
  },
  fukui: {
    transport: { adid: '1483101', destId: '7240', tid: '5' },
  },
  yamanashi: {
    transport: { adid: '1483106', destId: '4529', tid: '5' },
  },
  nagano: {
    transport: { adid: '1483108', destId: '5483', tid: '5' },
  },
  gifu: {
    transport: { adid: '1483112', destId: '6370', tid: '5' },
  },
  shizuoka: {
    transport: { adid: '1483113', destId: '6409', tid: '5' },
  },
  aichi: {
    transport: { adid: '1483030', destId: '6069', tid: '5' },
  },
  mie: {
    transport: { adid: '1484185', destId: '6241', tid: '5' },
  },
  shiga: {
    transport: { adid: '1484187', destId: '6339', tid: '5' },
  },
  kyoto: {
    transport: { adid: '1484190', destId: '5938', tid: '5' },
  },
  osaka: {
    transport: { adid: '1484191', destId: '6093', tid: '5' },
  },
  hyogo: {
    transport: { adid: '1484192', destId: '4819', tid: '5' },
  },
  nara: {
    transport: { adid: '1484193', destId: '7062', tid: '5' },
  },
  wakayama: {
    transport: { adid: '1484195', destId: '6255', tid: '5' },
  },
  tottori: {
    transport: { adid: '1484208', destId: '5923', tid: '5' },
  },
  shimane: {
    transport: { adid: '1484210', destId: '6922', tid: '5' },
  },
  okayama: {
    transport: { adid: '1484211', destId: '4467', tid: '5' },
  },
  hiroshima: {
    transport: { adid: '1484212', destId: '5122', tid: '5' },
  },
  yamaguchi: {
    transport: { adid: '1484215', destId: '8406', tid: '5' },
  },
  tokushima: {
    transport: { adid: '1484259', destId: '4987', tid: '5' },
  },
  kagawa: {
    transport: { adid: '1484262', destId: '5840', tid: '5' },
  },
  ehime: {
    transport: { adid: '1484264', destId: '5829', tid: '5' },
  },
  kochi: {
    transport: { adid: '1484266', destId: '5433', tid: '5' },
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
