import site from './site.json';

/**
 * サイトの運営情報（src/data/site.json）。運営者情報・お問い合わせ・プライバシーポリシーのページで使う。
 * - operatorName: 運営者名（本名でなくハンドル名でもよい）
 * - contactFormUrl: お問い合わせフォームの URL（Google フォームなど）。あればこちらを優先して案内する
 * - contactEmail: お問い合わせ用のメールアドレス（フォームがない場合に表示）
 * - instagramUrl / xUrl: 運営している SNS アカウントの URL。日本語サイト（ja）と英語サイト（en）で別に設定する
 * - privacyPolicyDate: プライバシーポリシーの制定日・最終改定日（YYYY-MM-DD）
 * 空欄の項目は「準備中」と表示する（公開前に埋める）。
 */
export const siteInfo = site;

export function formatDate(lang: string, iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return lang === 'ja'
    ? `${y}年${m}月${d}日`
    : new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
