import ja from './ja.json';
import en from './en.json';

/**
 * 対応言語の一覧。言語を追加するときは、ここに1行足して
 * 同じ名前の JSON（例: zh-tw.json）を作り、prefectures.json に名前を足す。
 */
export const languages = {
  ja: { label: '日本語', ogLocale: 'ja_JP' },
  en: { label: 'English', ogLocale: 'en_US' },
} as const;

export type Lang = keyof typeof languages;
export const langs = Object.keys(languages) as Lang[];

export type Localized = Record<Lang, string>;
export type UiKey = keyof typeof ja;

const dictionaries: Record<Lang, Record<string, string>> = { ja, en };

// どれかの言語で文言が抜けていたらビルドを止める
for (const lang of langs) {
  const missing = Object.keys(ja).filter((key) => !(key in dictionaries[lang]));
  if (missing.length) throw new Error(`src/i18n/${lang}.json に文言がありません: ${missing.join(', ')}`);
}

export function t(lang: Lang, key: UiKey, vars: Record<string, string | number> = {}): string {
  let text = dictionaries[lang][key];
  for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
  return text;
}

/** 言語付きのパスを返す（例: localizePath('en', '/shizuoka/') → /en/shizuoka/） */
export function localizePath(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `/${lang}${clean}`;
}

export function getLangStaticPaths() {
  return langs.map((lang) => ({ params: { lang } }));
}
