import { defineConfig } from 'astro/config';

// 公開先の URL（検索エンジン向けの正規 URL や言語切り替えの情報に使う）。
// Cloudflare Pages の環境変数 SITE_URL で設定する（例: https://japanesefoodsinjapan.com ）
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
  trailingSlash: 'always',
});
