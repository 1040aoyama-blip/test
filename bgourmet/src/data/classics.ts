import classics from './classics.json';
import { getCatalog } from './catalog';
import { getPrefecture } from './prefectures';
import type { Lang } from '../i18n';

/**
 * 「定番の日本食」（英語サイトのみ。src/data/classics.json）。
 * 寿司・ラーメンなど全国どこでも食べられる料理と、そのご当地版（県ページの料理）へのリンク。
 */
interface ClassicEntry {
  id: string;
  name: string;
  ja: string;
  tagline: string;
  summary: string;
  price: string;
  /** ご当地版。catalog.json にある料理（県 ID と日本語名） */
  regional: { pref: string; ja: string }[];
}

export interface Classic extends Omit<ClassicEntry, 'regional'> {
  regional: { prefId: string; prefName: string; name: string; anchor: string }[];
}

/** 定番の日本食の一覧。ご当地版が catalog.json に見つからなければビルドを止める */
export function getClassics(lang: Lang): Classic[] {
  return (classics as ClassicEntry[]).map((c) => ({
    ...c,
    regional: c.regional.map(({ pref, ja }) => {
      const item = getCatalog(lang, pref)
        .flatMap((g) => g.items)
        .find((i) => i.ja === ja);
      if (!item) throw new Error(`src/data/classics.json の「${c.id}」のご当地版「${pref} / ${ja}」が catalog.json にありません`);
      return { prefId: pref, prefName: getPrefecture(pref).name[lang], name: item.name, anchor: item.anchor };
    }),
  }));
}
