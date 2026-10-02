import type { APIRoute } from 'astro';
import { getLangStaticPaths, type Lang } from '../../../i18n';
import { getAllDishes } from '../../../data/catalog';
import { normalizeForSearch } from '../../../lib/normalize';

export const getStaticPaths = getLangStaticPaths;

/**
 * 検索ページが後から読み込む、料理の説明文（検索用にそろえた文字）。
 * 検索ページの一覧と同じ順番に並べる。ページを軽くするため HTML には入れていない。
 */
export const GET: APIRoute = ({ params }) => {
  const texts = getAllDishes(params.lang as Lang).map((dish) => normalizeForSearch(dish.info?.summary ?? ''));
  return new Response(JSON.stringify(texts), { headers: { 'Content-Type': 'application/json' } });
};
