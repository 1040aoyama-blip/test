# ご当地B級グルメ図鑑 / Japan B-Gourmet Guide

47都道府県のご当地B級グルメを紹介するサイト。日本人観光客（日本語）と訪日観光客（英語）に向けて作っています。
[Astro](https://astro.build/) で静的サイトとして生成します。

## 使い方

```bash
npm install
npm run dev      # 開発サーバー（http://localhost:4321）
npm run build    # dist/ に本番用ファイルを生成
```

## URL 構成

すべてのページに言語の接頭辞が付きます。言語を増やしても既存の URL は変わりません。

| ページ | URL |
|---|---|
| 言語を選ぶ入口 | `/` |
| トップ | `/ja/`, `/en/` |
| 都道府県 | `/ja/shizuoka/`, `/en/shizuoka/` |
| グルメ詳細 | `/ja/shizuoka/fujinomiya-yakisoba/` |

## ファイル構成

```
src/
├─ i18n/
│   ├ index.ts        対応言語の一覧と翻訳の関数
│   ├ ja.json         画面の文言（ボタン・見出し・フッターなど）
│   └ en.json
├─ data/
│   ├ prefectures.json  地域名・都道府県名（言語ごと）
│   └ catalog.json      全国のグルメ一覧（都道府県 × ジャンル。記事がない料理も含む）
├─ content/gourmet/<グルメのID>/
│   ├ meta.json       言語に関係ない情報（都道府県・絵文字・地図の検索語・並び順）
│   ├ ja.md           日本語の記事
│   └ en.md           英語の記事
├─ pages/[lang]/      ページの型（言語の数だけ自動で生成）
├─ views/             トップ・都道府県・グルメ詳細の見た目
└─ components/        地図・広告枠・カード
```

## グルメ一覧（catalog.json）

都道府県ページに出る料理の一覧です。ジャンルは `bgourmet`（B級グルメ）・`local`（郷土料理）・`sweets`（スイーツ）。
各料理は `{"ja": "富士宮やきそば"}` のように言語ごとの名前を持ちます。その言語の名前がない料理は、その言語のページには出ません。

## 記事を追加する

1. `src/content/gourmet/<ID>/` フォルダを作る（ID は URL になるので半角英小文字とハイフン）
2. `meta.json` と、`ja.md` などの言語ごとの記事を置く（既存のフォルダをコピーすると楽です）
3. `meta.json` の `catalogName` に、catalog.json に載っている日本語の料理名を書く（一致しないとビルドが止まります）

翻訳がない言語ではそのグルメのページを作らず、一覧にも表示しません。

- **おすすめ店**: 記事の `shops` に `name`・`placeId`（Google マップの place_id）・`comment`（自分で書いた紹介文）を追加します。
  空の間は、`meta.json` の `mapQuery` で検索した地図を表示します。Google マップの口コミや写真は規約上転載できません。
- **アフィリエイト**: 記事の `affiliate` に `label` と `url` を追加すると、「PR」表記つきで表示されます。
  言語ごとに別のリンクを設定できます（日本語は国内の ASP、英語は海外向けのサービスなど）。

## 言語を追加する

1. `src/i18n/index.ts` の `languages` に1行足す（例: `'zh-tw': { label: '繁體中文', ogLocale: 'zh_TW' }`）
2. `src/i18n/ja.json` をコピーして `zh-tw.json` を作り、翻訳する（足りない文言があるとビルドが止まります）
3. `src/data/prefectures.json` の各地域・都道府県の `name` に `zh-tw` を足す
4. 翻訳した記事から順に `zh-tw.md` を追加する

## Google マップ

`.env.example` を `.env` にコピーし、`PUBLIC_GOOGLE_MAPS_EMBED_KEY` に Maps Embed API のキーを設定すると地図が埋め込まれます。
未設定の場合は「Google マップで見る」リンクだけを表示します。
