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
