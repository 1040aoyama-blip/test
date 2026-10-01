import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** 言語に関係ない情報（src/content/gourmet/<id>/meta.json） */
const gourmetMeta = defineCollection({
  loader: glob({
    pattern: '*/meta.json',
    base: './src/content/gourmet',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    prefecture: z.string(),
    emoji: z.string(),
    romaji: z.string(),
    /** 店舗データがないときに Google マップで検索するキーワード */
    mapQuery: z.string(),
    /** トップページでの並び順 */
    order: z.number(),
  }),
});

/** 言語ごとの記事（src/content/gourmet/<id>/<lang>.md） */
const gourmetText = defineCollection({
  loader: glob({
    pattern: '*/*.md',
    base: './src/content/gourmet',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    name: z.string(),
    summary: z.string(),
    priceRange: z.string(),
    howToEat: z.array(z.string()),
    shops: z
      .array(
        z.object({
          name: z.string(),
          /** Google マップの place_id */
          placeId: z.string(),
          /** 自分で書いた紹介文（Google の口コミは転載しない） */
          comment: z.string(),
        }),
      )
      .default([]),
    affiliate: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  }),
});

export const collections = { gourmetMeta, gourmetText };
