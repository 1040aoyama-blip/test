import catalog from './catalog.json';
import featured from './featured.json';
import { getPrefecture, prefectures } from './prefectures';
import { langs, type Lang } from '../i18n';

/**
 * 全国のグルメ一覧（src/data/catalog.json）と、料理ごとの説明（src/data/dishes/<言語>/<県>.json）。
 * 都道府県ページはこれをもとに全料理を表示する（料理ごとの個別ページは作らない）。
 */
export const categories = ['bgourmet', 'local', 'sweets'] as const;
export type Category = (typeof categories)[number];

type CatalogEntry = { ja: string; en: string } & Partial<Record<Lang, string>>;
const data = catalog as Record<string, Record<Category, CatalogEntry[]>>;

export interface Shop {
  /** 店名（この言語での表記） */
  name: string;
  /** Google マップで店を特定する検索語（例: 「串かつだるま 新世界総本店」）。place_id が分かれば placeId を使う */
  query?: string;
  placeId?: string;
  /** 自分で書いたおすすめ理由（Google の口コミは転載しない） */
  comment?: string;
  /** 場所の目安（最寄り駅や目印） */
  access?: string;
}

export interface DishInfo {
  summary: string;
  price?: string;
  area?: string;
  /** おすすめの店（3件まで表示） */
  shops?: Shop[];
  /** アフィリエイトリンク（「PR」表記つきで表示） */
  affiliate?: { label: string; url: string }[];
}

// dishes/<lang>/<pref>.json を読み込む（キーは catalog.json の日本語名）
const infoFiles = import.meta.glob<Record<string, DishInfo>>('./dishes/*/*.json', { eager: true, import: 'default' });
const infos: Record<string, Record<string, Record<string, DishInfo>>> = {};
for (const [path, file] of Object.entries(infoFiles)) {
  const [, lang, pref] = path.match(/\.\/dishes\/([^/]+)\/([^/]+)\.json$/)!;
  ((infos[lang] ??= {})[pref] = file);
}

export interface CatalogItem {
  /** ページ内リンク用の ID（英語名のローマ字部分から作る。例: fujinomiya-yakisoba） */
  anchor: string;
  /** この言語での料理名 */
  name: string;
  /** 日本語の料理名（日本語以外のページで、お店で見せられるよう併記する） */
  ja: string;
  /** この言語の短い説明（まだなければ undefined） */
  info?: DishInfo;
  /** Google マップで探すときの検索語 */
  mapQuery: string;
}

export interface CatalogGroup {
  category: Category;
  items: CatalogItem[];
}

function toAnchor(en: string): string {
  return en
    .split(' (')[0]
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** 都道府県の料理一覧を、ジャンルごとに返す（その言語の名前がある料理だけ） */
export function getCatalog(lang: Lang, prefectureId: string): CatalogGroup[] {
  const pref = data[prefectureId] ?? {};
  const prefName = getPrefecture(prefectureId).name.ja;
  return categories
    .map((category) => ({
      category,
      items: (pref[category] ?? []).flatMap((entry) => {
        const name = entry[lang];
        if (!name) return [];
        return [
          {
            anchor: toAnchor(entry.en),
            name,
            ja: entry.ja,
            info: infos[lang]?.[prefectureId]?.[entry.ja],
            mapQuery: `${entry.ja} ${prefName}`,
          },
        ];
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export interface CatalogEntryWithPlace extends CatalogItem {
  prefectureId: string;
  category: Category;
  /** 英語名（言語に関係なく検索に使う） */
  en: string;
}

/** 全国の料理を、都道府県の順・ジャンルの順に返す（検索ページ用） */
export function getAllDishes(lang: Lang): CatalogEntryWithPlace[] {
  return prefectures.map((p) => p.id).flatMap((prefectureId) =>
    getCatalog(lang, prefectureId).flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        prefectureId,
        category: group.category,
        en: data[prefectureId][group.category].find((e) => e.ja === item.ja)!.en,
      })),
    ),
  );
}

/** 都道府県ごとの掲載数（その言語の名前がある料理の数） */
export function countCatalog(lang: Lang, prefectureId: string): number {
  return categories.reduce((sum, c) => sum + (data[prefectureId]?.[c] ?? []).filter((e) => e[lang]).length, 0);
}

/** 一覧にその料理があるか */
export function hasDish(prefectureId: string, ja: string): boolean {
  return categories.some((c) => data[prefectureId]?.[c]?.some((e) => e.ja === ja));
}

/** データの食い違いを確かめる（見つかったらビルドを止める） */
export function assertCatalogConsistency(): void {
  for (const [lang, prefs] of Object.entries(infos)) {
    if (!langs.includes(lang as Lang)) throw new Error(`src/data/dishes/${lang}/ は対応言語ではありません`);
    for (const [pref, dishes] of Object.entries(prefs)) {
      for (const ja of Object.keys(dishes)) {
        if (!hasDish(pref, ja)) throw new Error(`src/data/dishes/${lang}/${pref}.json の「${ja}」が catalog.json にありません`);
      }
    }
  }
}


export interface FeaturedItem extends CatalogItem {
  prefectureId: string;
}

/** トップページの「注目」欄に出す料理（src/data/featured.json の順。のちに「SNS で紹介中」に使う） */
export function getFeatured(lang: Lang): FeaturedItem[] {
  return featured.flatMap(({ prefecture, ja }) => {
    if (!hasDish(prefecture, ja)) throw new Error(`featured.json の「${ja}」が catalog.json の ${prefecture} にありません`);
    const item = getCatalog(lang, prefecture)
      .flatMap((g) => g.items)
      .find((i) => i.ja === ja);
    return item ? [{ ...item, prefectureId: prefecture }] : [];
  });
}
