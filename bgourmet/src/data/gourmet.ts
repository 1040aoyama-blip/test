import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n';

export interface Gourmet {
  id: string;
  meta: CollectionEntry<'gourmetMeta'>['data'];
  text: CollectionEntry<'gourmetText'>;
}

/** 指定した言語に翻訳がある B級グルメだけを返す */
export async function getGourmets(lang: Lang): Promise<Gourmet[]> {
  const metas = await getCollection('gourmetMeta');
  const texts = await getCollection('gourmetText');
  return metas
    .flatMap((meta) => {
      const text = texts.find((t) => t.id === `${meta.id}/${lang}`);
      return text ? [{ id: meta.id, meta: meta.data, text }] : [];
    })
    .sort((a, b) => a.meta.order - b.meta.order);
}

/** その B級グルメの翻訳がある言語の一覧 */
export async function getAvailableLangs(id: string): Promise<Lang[]> {
  const texts = await getCollection('gourmetText');
  return texts.filter((t) => t.id.startsWith(`${id}/`)).map((t) => t.id.split('/')[1] as Lang);
}
