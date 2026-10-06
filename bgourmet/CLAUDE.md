# ご当地グルメ図鑑（英語：JAPANESE FOODS IN JAPAN） — プロジェクトメモ

使い方やファイル構成は README.md を参照。ここには運営者と決めた方針と、保留中の事項を残す。
公開前に運営者が確認する事実関係（会社名・由来・値段など）は CHECKLIST.md にまとめる。地方の説明を書き終えるたびに追記する。

## 決まっている方針

- 対象: 日本人観光客と訪日観光客。言語は日本語と英語で開始し、あとで zh-cn / zh-tw / ko などを追加する
- URL は最初から `/ja/` `/en/` 形式（言語を増やしても既存 URL を変えない）
- 集客は検索より SNS（Instagram と X）が中心。投稿で料理紹介とコラムを出し、プロフィールの URL からサイトへ誘導する
- サイトは全国のグルメを網羅する図鑑。一覧は運営者が用意した `src/data/catalog.json`（47都道府県・621品）
  - ジャンルは B級グルメ（bgourmet）・郷土料理（local）・スイーツ（sweets）の3つ
- **料理ごとの個別ページは作らない**。県ページに全料理を直接並べる
  - 1品の構成: 写真 → 料理名 → 説明（日本語で200文字前後、英語で80〜90語ほど。食べ方のコツも含む）・予算・エリア → おすすめの店（3件まで）→「Googleマップで探す」ボタン（料理名＋県名で検索）
  - 説明とおすすめの店は `src/data/dishes/<言語>/<県>.json`（キーは catalog.json の日本語名）
  - **説明に具体的な年や年代（「2006年」「1950年代」「昭和30年代」など）は書かない**。運営者が確認しきれないため。「江戸時代」「明治時代」のようなざっくりとした時代は書いてよい
  - 説明がまだない料理は、名前と「Googleマップで探す」だけを表示する
  - おすすめの店は「店名・ひとこと・場所の目安・Googleマップで開く・地図を表示」のカード。地図は「地図を表示」を押したときだけ読み込む（ページを軽く保つため。常時の埋め込みはしない）
  - 地図は Maps Embed API（無料・回数無制限。`PUBLIC_GOOGLE_MAPS_EMBED_KEY`）。キーがない間は「地図を表示」ボタンを出さない
  - トップの「注目」欄は `src/data/featured.json`（県ページの該当料理へページ内リンクで飛ぶ）
  - 県名の下に県の概要説明（食文化を中心に2文程度）。`src/data/intros/<言語>.json`。47都道府県分作成済み
  - 各料理にページ内リンク（例: `/ja/shizuoka/#fujinomiya-yakisoba`）があり、X の投稿から直接飛べる
  - 検索ページ（`/<言語>/search/`）: キーワード（料理名・県名・エリア・説明文）、都道府県（地域ごとも可）、ジャンルで絞り込む。条件は URL に入る。料理名に当たったものを先に出す
  - 英語名は「ローマ字名 (短い英語の説明)」の形（例: Butadon (Grilled Pork Rice Bowl)）。英語ページでは日本語名も併記する
- 必須ページ: 運営者情報（`/<言語>/about/`）・プライバシーポリシー（`/<言語>/privacy/`）・お問い合わせ（`/<言語>/contact/`）。フッターからリンク
  - 運営者名・お問い合わせ先・SNS の URL・ポリシーの日付は `src/data/site.json` で設定する（空欄は「準備中」と表示）
  - お問い合わせはサーバーを持たないため、外部フォーム（Google フォームなど）の URL かメールアドレスを案内する
  - プライバシーポリシーは、アフィリエイト・Google AdSense・アクセス解析（Google アナリティクス）・Google マップ・免責・著作権を含む。広告やアクセス解析を実際に導入するときは内容を見直す
- コラムはサイトにも載せる（未実装）
- 公開先は Cloudflare Pages。独自ドメイン https://japanesefoodsinjapan.com （Cloudflare で取得し、カスタムドメインとして接続済み。https://bgourmet.pages.dev でも見られる）。サイト名は日本語「ご当地グルメ図鑑」、英語「JAPANESE FOODS IN JAPAN」（`src/i18n/<言語>.json` の siteName）。ドメインは英語名にちなむ

- アフィリエイト：Klook（パートナー ID は `src/data/site.json` の klookAid）。英語サイトの県ページの一番下に「Tours & experiences in 〇〇」として、サムネ付きの体験一覧（Klook の Dynamic Widget。`src/components/KlookWidget.astro`。地域は県ごとに `src/data/affiliates.ts` の klookDestIds で指定）と、その県のツアー検索（東京・京都・大阪はフードツアー・料理教室も）と JR パスへのリンクを出す。英語のトップの下には「Plan your trip」として JR パス・新幹線・eSIM・ポケット Wi-Fi・空港アクセスのリンクを出す（`src/data/affiliates.ts`）

## 保留中（あとで決める）

- **料理の画像**: 各料理に画像を入れる。入手方法は未定（AdSense の審査で作りかけに見えないよう、「写真準備中」の枠は消した）
  - 候補: AI 生成のイラスト（「イメージ」と表示）、自治体・観光協会の写真素材、許可を得た写真、Instagram の公式埋め込み、自分で撮影
  - 他人の Instagram の画像を保存して載せるのは不可（著作権・規約違反）
  - 決まったら、画像とクレジット（出典・ライセンス）の欄をデータとページに追加する

## これからやること（予定）

0. 621品の説明は全品作成済み（日本語・英語）。事実関係の確認は CHECKLIST.md で運営者が進める
   - おすすめの店：Web 検索で営業中を確かめながら全品に追加済み（1品最低2店。選び方は CHECKLIST.md）。済み：全国（北海道・東北・関東・中部・近畿・中国・四国・九州・沖縄）
1. シェア用画像（OGP）、コラムのコーナー
2. Cloudflare Pages で公開済み：https://japanesefoodsinjapan.com （プロジェクト名 bgourmet、本番ブランチ claude/session-not-showing-mobile-kg5x7o、ルート bgourmet、SITE_URL = https://japanesefoodsinjapan.com）。Google Search Console にドメインで登録し、サイトマップ（/sitemap-index.xml）を送信済み。このブランチに push すると自動で更新される
   - 公開前に `src/data/site.json` を埋める

（検索・絞り込み、必須ページは作成済み。各言語のトップの一番下に、その言語の SNS へのリンク（ロゴ付き）を置く。`site.json` の URL が空の言語では出さない）
