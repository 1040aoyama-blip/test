import data from './prefectures.json';
import type { Localized } from '../i18n';

export interface Region {
  id: string;
  name: Localized;
}

export interface Prefecture {
  id: string; // URL に使うスラッグ
  name: Localized;
  region: string;
}

export const regions: Region[] = data.regions;
export const prefectures: Prefecture[] = data.prefectures;

export function getPrefecture(id: string): Prefecture {
  const pref = prefectures.find((p) => p.id === id);
  if (!pref) throw new Error(`Unknown prefecture: ${id}`);
  return pref;
}

// 都道府県の概要説明（src/data/intros/<言語>.json。キーは都道府県の id）
const introFiles = import.meta.glob<Record<string, string>>('./intros/*.json', { eager: true, import: 'default' });

/** 都道府県の概要説明（その言語の説明がなければ undefined） */
export function getIntro(lang: string, prefectureId: string): string | undefined {
  return introFiles[`./intros/${lang}.json`]?.[prefectureId];
}
