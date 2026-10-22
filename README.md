# とんぺー1.8万分の１

東北大の入学から在学の終わり（学部卒業・修士修了）までを、3〜6分で生きるブラウザゲーム。最後に「あなたの東北大生活は 約◯◯人に1人」と出ます。

> 本作は東北大学とは関係のない、学生個人による非公式プロジェクトです。東北大学の公認・協力・データ提供を受けたものではありません。
>
> 『80億分の1』にインスパイアされた作品です。

仕様は [REQUIREMENTS.md](REQUIREMENTS.md)、開発のルールは [CLAUDE.md](CLAUDE.md) にあります。

## 開発

Node.js 24.22.1 以上が必要です（[.node-version](.node-version)。2026年10月のNode.jsのセキュリティリリースに対応した版）。

| コマンド | すること |
| --- | --- |
| `npm run dev` | 開発サーバー（http://localhost:5173）。`?seed=123` で同じ入学ガチャを再現できる。`/preview.html` でドット絵の一覧 |
| `npm test` | エンジンのテスト |
| `npm run sim` | おまかせで1万回遊び、留年率・院進率・レア度の分布・属性による差・網羅チェックを出す |
| `npm run lint:content` | イベント文のルールチェック（3行まで、割合を直接書かない、使わない言葉、飲酒の注意書き、学部イベントの時期など） |
| `npm run facts` | `// 要確認` が付いた箇所を、ソースの行へのリンクつきで [docs/fact-check.md](docs/fact-check.md) に書き出す。リンクから開いて直接直し、確かめたら「要確認」を消す |
| `npm run export:events` | イベント文・称号・豆知識の全文を [docs/events-review.md](docs/events-review.md) に書き出す（公開前の全文チェック用） |
| `npm run shots` | 各画面を幅3種×ライト/ダーク×文字100%/200%で撮り、はみ出しを検出する（`BASE` `SEED` `ONLY` で指定できる） |
| `npm run db:local` | ローカルのD1にテーブルを作る（最初に1回） |
| `npm run pages:dev` | ビルドして、本番と同じ構成（静的サイト＋Functions＋D1）をローカルで動かす（http://127.0.0.1:8788） |

## ファイル

- `src/engine.ts` と `src/core/` … ゲームのエンジン（DOMに触らない純関数）
- `src/data/stats.ts` … ゲーム内の数値と出典。ここ以外に統計の数値を書かない
- `src/data/events.ts` … イベント本体。`structure.ts`（学部の木構造）、`research.ts`（研究テーマ・研究の階段）、`endings.ts`（称号・10年後の一文）
- `src/data/balance.ts` … ゲームの調整値（統計ではない）
- `src/ui/` … 画面とドット絵
- `functions/api/` … プレイ数のAPI（Cloudflare Pages Functions）、`schema.sql` … D1のテーブル

## 公開（Cloudflare Pages）

公開URLは https://tonpei-18000.pages.dev です。プロジェクト `tonpei-18000` と D1 `tonpei-18000` は作成済みで、D1 の `database_id` は [wrangler.toml](wrangler.toml) に書いてあります。

更新するときは、次のコマンドでビルドしてアップロードします。Functions（`functions/`）と、wrangler.toml の D1 の設定（`DB`）も一緒に送られます。

```sh
npm run build
npx wrangler pages deploy --branch main
```

- D1 のテーブルを変えたときは `npx wrangler d1 execute tonpei-18000 --remote --file schema.sql`
- 公開URLを変えるときは、`src/config.ts` の `SITE_URL` と `index.html` の `og:image`・`og:url` を合わせる

### プレイ数のAPI

- `POST /api/play` … `{ type: 'start' | 'campus' | 'finish', id, campus? }`。匿名のプレイIDとキャンパスだけを受け取る。IPアドレス・学部・家計は保存しない。同じIDの入学・在学の終わりは1回しか数えない
- `GET /api/stats` … `{ entered, finished, campus }`。「いま学んでいる人」は、在学を終えておらず直近10分に動きがあったプレイ。エッジで15秒キャッシュする
- APIが落ちても、上限に達しても、ゲームは普通に動く（LPのカウンターの欄だけ隠れる）
- 他のサイトから訪問者のブラウザ経由で数を増やされないよう、同じオリジンからの `application/json` で512バイト以下の送信だけを受け付ける。プレイの行は2日たつと消す（数えた結果は `counters` に残る）
- 静的ファイルのセキュリティヘッダー（CSPなど）は [public/_headers](public/_headers)。外部から読み込むのは Google Fonts だけ
- D1の無料枠は1日10万行の書き込み。1プレイで約5〜10行（索引を含む）書くので、1日1〜2万プレイが目安。超えそうなら Workers の有料プラン（月5ドル）にする

## β版について

いまはβ版として公開します。数値の照合と事実確認がまだ終わっていないため、タイトル（ロゴの「β版」の札）、タイトルと結果のフッター、ガチャと結果の出典の行に「データは現在事実確認中のため、間違った値がある場合があります。」と出しています。文言は `src/config.ts` の `BETA` と `DATA_NOTICE` にまとめてあります。

## 正式版の前に確かめること

- `src/data/stats.ts` の数値を出典と照合し、`checked` に日付を入れる。`provisional`（仮置き）の値を確定する
- `npm run facts` で [docs/fact-check.md](docs/fact-check.md) を作り、`// 要確認` を在学生2〜3人に確かめてもらいながら直す
- 終わったら、β版の表示を外す（`src/config.ts`、`index.html` の description、`npm run ogp` でOGP画像を作り直す）

## 出典

ゲーム内の統計の出典は `src/data/stats.ts` の `SOURCES` にあり、画面にも表示しています。
