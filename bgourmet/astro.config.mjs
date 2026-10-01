import { defineConfig } from 'astro/config';

// TODO: 独自ドメインを取得したら差し替える
export default defineConfig({
  site: 'https://example.com',
  trailingSlash: 'always',
});
