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
| 料理（県ページ内） | `/ja/shizuoka/#fujinomiya-yakisoba` |

## ファイル構成

```
src/
├─ i18n/
│   ├ index.ts        対応言語の一覧と翻訳の関数
│   ├ ja.json         画面の文言（ボタン・見出し・フッターなど）
│   └ en.json
├─ data/
│   ├ prefectures.json  地域名・都道府県名（言語ごと）
│   ├ catalog.json      全国のグルメ一覧（都道府県 × ジャンル × 料理名）
│   ├ dishes/<言語>/<県>.json  県ページに出す料理ごとの説明・おすすめの店
│   ├ featured.json            トップの「注目」欄に出す料理
│   └ intros/<言語>.json       県ページの見出しの下に出す、県の概要説明（シェア時の説明文にも使う）
├─ pages/[lang]/      ページの型（言語の数だけ自動で生成）
├─ views/             トップ・都道府県ページの見た目
└─ components/        料理・おすすめの店・広告枠
```

## グルメ一覧（catalog.json）

都道府県ページに出る料理の一覧です。ジャンルは `bgourmet`（B級グルメ）・`local`（郷土料理）・`sweets`（スイーツ）。
各料理は `{"ja": "富士宮やきそば", "en": "Fujinomiya Yakisoba"}` のように言語ごとの名前を持ちます。その言語の名前がない料理は、その言語のページには出ません。
英語名の括弧より前の部分から、ページ内リンクの ID（`#fujinomiya-yakisoba`）が自動で作られます。

## 料理の説明（dishes/<言語>/<県>.json）

県ページに表示する説明とおすすめの店です。キーは catalog.json の日本語名です（一致しないとビルドが止まります）。

```json
{
  "串カツ": {
    "summary": "説明（日本語で200文字前後。食べ方のコツなども含める）",
    "price": "1本100〜300円",
    "area": "新世界（通天閣周辺）",
    "shops": [
      {
        "name": "串かつだるま 新世界総本店",
        "query": "串かつだるま 新世界総本店",
        "comment": "自分で書いたおすすめ理由",
        "access": "新世界・通天閣の近く"
      }
    ],
    "affiliate": [{ "label": "リンクの文言", "url": "https://..." }]
  }
}
```

- **shops**（任意・3件まで表示）: `query` は Google マップで店を特定できる検索語。place_id が分かれば `placeId` を使うと確実です。Google の口コミや写真は規約上転載できないので、`comment` は自分で書きます。`access` は最寄り駅や目印などの場所の目安です。
- **affiliate**（任意）: 「PR」表記つきで表示されます。言語ごとに別のリンクを設定できます。

## 言語を追加する

1. `src/i18n/index.ts` の `languages` に1行足す（例: `'zh-tw': { label: '繁體中文', ogLocale: 'zh_TW' }`）
2. `src/i18n/ja.json` をコピーして `zh-tw.json` を作り、翻訳する（足りない文言があるとビルドが止まります）
3. `src/data/prefectures.json` の各地域・都道府県の `name` に `zh-tw` を足す
4. `src/data/intros/zh-tw.json` と `src/data/dishes/zh-tw/` を追加する（説明がない料理は名前だけ表示されます）
5. `src/data/catalog.json` の各料理に `"zh-tw": "料理名"` を追加する

## Google マップ

`.env.example` を `.env` にコピーし、`PUBLIC_GOOGLE_MAPS_EMBED_KEY` に Maps Embed API のキー（無料・回数無制限）を設定すると、
おすすめの店に「地図を表示」ボタンが出ます。地図は押したときだけ読み込みます。未設定の場合は「Googleマップで開く」リンクだけを表示します。
API キーは「Maps Embed API のみ」「自分のサイトのドメインのみ」に制限してください。
