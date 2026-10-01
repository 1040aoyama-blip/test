export const languages = {
  ja: '日本語',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'ja';

export type Localized = Record<Lang, string>;

export const ui = {
  ja: {
    siteName: 'ご当地B級グルメ図鑑',
    siteTagline: '47都道府県の、地元で愛される味を食べに行こう。',
    siteDescription:
      '日本全国47都道府県のご当地B級グルメと、食べられるお店を地図付きで紹介するガイドです。',
    browseByRegion: '地域から探す',
    featured: '注目のB級グルメ',
    gourmetCount: '{n}品',
    comingSoon: '準備中',
    comingSoonBody: 'この都道府県のグルメ情報は準備中です。もうしばらくお待ちください。',
    backToTop: 'トップへ戻る',
    priceRange: '予算の目安',
    whereToEat: 'どこで食べられる？',
    howToEat: '食べ方のコツ',
    openInMaps: 'Google マップで見る',
    mapNote: '地図はGoogle マップの検索結果を表示しています。営業時間などは必ず事前にご確認ください。',
    recommendedShops: 'おすすめのお店',
    otherGourmet: '{pref}の他のB級グルメ',
    prLabel: 'PR',
    adNotice: '当サイトはアフィリエイト広告を利用しています。',
    adPlaceholder: '広告枠（準備中・開発時のみ表示）',
    langSwitch: 'Language',
  },
  en: {
    siteName: 'Japan B-Gourmet Guide',
    siteTagline: 'Eat like a local across all 47 prefectures of Japan.',
    siteDescription:
      'A guide to beloved local comfort food ("B-kyu gourmet") from all 47 prefectures of Japan, with maps to find where to eat.',
    browseByRegion: 'Browse by region',
    featured: 'Featured local eats',
    gourmetCount: '{n} dishes',
    comingSoon: 'Coming soon',
    comingSoonBody: 'We are still preparing the food guide for this prefecture. Please check back soon.',
    backToTop: 'Back to top',
    priceRange: 'Typical price',
    whereToEat: 'Where to eat',
    howToEat: 'Tips for eating',
    openInMaps: 'Open in Google Maps',
    mapNote: 'The map shows Google Maps search results. Please check opening hours before you visit.',
    recommendedShops: 'Recommended shops',
    otherGourmet: 'More local eats in {pref}',
    prLabel: 'AD',
    adNotice: 'This site contains affiliate links.',
    adPlaceholder: 'Ad slot (placeholder, shown in dev only)',
    langSwitch: '言語',
  },
} as const;

export type UiKey = keyof (typeof ui)['ja'];

export function t(lang: Lang, key: UiKey, vars: Record<string, string | number> = {}): string {
  let text: string = ui[lang][key];
  for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
  return text;
}

/** 言語に応じたパスを返す（日本語はルート、英語は /en/ 以下） */
export function localizePath(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return lang === defaultLang ? clean : `/${lang}${clean}`;
}
