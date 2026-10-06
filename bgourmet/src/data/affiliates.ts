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

function klook(path: string, params: Record<string, string> = {}): string {
  const url = new URL(KLOOK + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('aid', siteInfo.klookAid);
  return url.toString();
}

export function getPrefectureAffiliates(lang: string, prefId: string, prefName: string): Link[] {
  if (lang !== 'en' || !siteInfo.klookAid) return [];
  return [
    ...(klookFood[prefId] ?? []).map(([label, path]) => ({ label: `${label} (Klook)`, url: klook(path) })),
    { label: `Tours & activities in ${prefName} (Klook)`, url: klook('/search/result/', { query: prefName }) },
    { label: 'Japan Rail Pass & regional rail passes (Klook)', url: klook('/transport/ttd/jrpass/') },
  ];
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
