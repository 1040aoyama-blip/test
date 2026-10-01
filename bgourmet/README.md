# ご当地B級グルメ図鑑 / Japan B-Gourmet Guide

47都道府県のご当地B級グルメを紹介するサイト。訪日観光客（英語）と日本人観光客（日本語）の両方に向けて作っています。
[Astro](https://astro.build/) で静的サイトとして生成します。

## 使い方

```bash
npm install
npm run dev      # 開発サーバー（http://localhost:4321）
npm run build    # dist/ に本番用ファイルを生成
```

## URL 構成

| ページ | 日本語 | 英語 |
|---|---|---|
| トップ | `/` | `/en/` |
| 都道府県 | `/shizuoka/` | `/en/shizuoka/` |
| グルメ詳細 | `/shizuoka/fujinomiya-yakisoba/` | `/en/shizuoka/fujinomiya-yakisoba/` |

## データの追加

- **グルメ**: `src/data/gourmet.ts` の `gourmets` に1件追加すると、日英両方のページが自動で生成されます。
- **おすすめ店**: 各グルメの `shops` に店名・Google マップの place_id・自分で書いたコメントを追加します。
  `shops` が空の間は、`mapQuery` で検索した Google マップを表示します。
  - Google マップの口コミや写真は規約上転載できないため、紹介文は自分で書いてください。
- **アフィリエイト**: 各グルメの `affiliate` にリンクを追加すると、「PR」表記つきで表示されます（`rel="sponsored"` 付き）。
- **画面の文言**: `src/i18n/ui.ts`

## Google マップ

`.env.example` を `.env` にコピーし、`PUBLIC_GOOGLE_MAPS_EMBED_KEY` に Maps Embed API のキーを設定すると地図が埋め込まれます。
未設定の場合は「Google マップで見る」リンクだけを表示します。
