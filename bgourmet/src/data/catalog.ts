import catalog from './catalog.json';
import { getGourmets, type Gourmet } from './gourmet';
import type { Lang } from '../i18n';

/**
 * 全国のグルメ一覧（src/data/catalog.json）。
 * 記事がまだない料理も含めた「図鑑の目次」で、記事は meta.json の catalogName で結びつける。
 */
export const categories = ['bgourmet', 'local', 'sweets'] as const;
export type Category = (typeof categories)[number];

type CatalogEntry = { ja: string } & Partial<Record<Lang, string>>;
const data = catalog as Record<string, Record<Category, CatalogEntry[]>>;

export interface CatalogItem {
  /** この言語での料理名 */
  name: string;
  /** この言語の記事があればその記事 */
  gourmet?: Gourmet;
}

export interface CatalogGroup {
  category: Category;
  items: CatalogItem[];
}

/** 都道府県の料理一覧を、ジャンルごとに返す（その言語の名前がある料理だけ） */
export async function getCatalog(lang: Lang, prefectureId: string): Promise<CatalogGroup[]> {
  const gourmets = await getGourmets(lang);
  const pref = data[prefectureId] ?? {};
  return categories
    .map((category) => ({
      category,
      items: (pref[category] ?? []).flatMap((entry) => {
        const name = entry[lang];
        if (!name) return [];
        const gourmet = gourmets.find((g) => g.meta.prefecture === prefectureId && g.meta.catalogName === entry.ja);
        return [{ name: gourmet?.text.data.name ?? name, gourmet }];
      }),
    }))
    .filter((group) => group.items.length > 0);
}

/** 都道府県ごとの掲載数（その言語の名前がある料理の数） */
export function countCatalog(lang: Lang, prefectureId: string): number {
  return categories.reduce((sum, c) => sum + (data[prefectureId]?.[c] ?? []).filter((e) => e[lang]).length, 0);
}

/** 記事の catalogName が一覧に載っているか確かめる（載っていなければビルドを止める） */
export async function assertArticlesInCatalog(): Promise<void> {
  for (const g of await getGourmets('ja')) {
    const found = categories.some((c) => data[g.meta.prefecture]?.[c]?.some((e) => e.ja === g.meta.catalogName));
    if (!found) {
      throw new Error(`記事 ${g.id} の catalogName「${g.meta.catalogName}」が catalog.json の ${g.meta.prefecture} にありません`);
    }
  }
}
