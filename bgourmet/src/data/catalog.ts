import catalog from './catalog.json';
import { getGourmets, type Gourmet } from './gourmet';
import { getPrefecture } from './prefectures';
import { langs, type Lang } from '../i18n';

/**
 * 全国のグルメ一覧（src/data/catalog.json）と、料理ごとの短い説明（src/data/dishes/<言語>/<県>.json）。
 * 都道府県ページはこれをもとに全料理を表示する。詳しい記事がある料理は meta.json の catalogName で結びつける。
 */
export const categories = ['bgourmet', 'local', 'sweets'] as const;
export type Category = (typeof categories)[number];

type CatalogEntry = { ja: string; en: string } & Partial<Record<Lang, string>>;
const data = catalog as Record<string, Record<Category, CatalogEntry[]>>;

export interface DishInfo {
  summary: string;
  price?: string;
  area?: string;
  tip?: string;
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
  /** この言語の詳しい記事があればその記事 */
  gourmet?: Gourmet;
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
export async function getCatalog(lang: Lang, prefectureId: string): Promise<CatalogGroup[]> {
  const gourmets = await getGourmets(lang);
  const pref = data[prefectureId] ?? {};
  const prefName = getPrefecture(prefectureId).name.ja;
  return categories
    .map((category) => ({
      category,
      items: (pref[category] ?? []).flatMap((entry) => {
        const name = entry[lang];
        if (!name) return [];
        const gourmet = gourmets.find((g) => g.meta.prefecture === prefectureId && g.meta.catalogName === entry.ja);
        return [
          {
            anchor: toAnchor(entry.en),
            name,
            ja: entry.ja,
            info: infos[lang]?.[prefectureId]?.[entry.ja],
            mapQuery: `${entry.ja} ${prefName}`,
            gourmet,
          },
        ];
      }),
    }))
    .filter((group) => group.items.length > 0);
}

/** 都道府県ごとの掲載数（その言語の名前がある料理の数） */
export function countCatalog(lang: Lang, prefectureId: string): number {
  return categories.reduce((sum, c) => sum + (data[prefectureId]?.[c] ?? []).filter((e) => e[lang]).length, 0);
}

/** データの食い違いを確かめる（見つかったらビルドを止める） */
export async function assertCatalogConsistency(): Promise<void> {
  const has = (pref: string, ja: string) => categories.some((c) => data[pref]?.[c]?.some((e) => e.ja === ja));
  for (const g of await getGourmets('ja')) {
    if (!has(g.meta.prefecture, g.meta.catalogName)) {
      throw new Error(`記事 ${g.id} の catalogName「${g.meta.catalogName}」が catalog.json の ${g.meta.prefecture} にありません`);
    }
  }
  for (const [lang, prefs] of Object.entries(infos)) {
    if (!langs.includes(lang as Lang)) throw new Error(`src/data/dishes/${lang}/ は対応言語ではありません`);
    for (const [pref, dishes] of Object.entries(prefs)) {
      for (const ja of Object.keys(dishes)) {
        if (!has(pref, ja)) throw new Error(`src/data/dishes/${lang}/${pref}.json の「${ja}」が catalog.json にありません`);
      }
    }
  }
}
