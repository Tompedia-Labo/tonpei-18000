// とんペディア_ラボと東北大学祭の案内に出す文言。ここの文字列を書き換えれば、そのまま画面に出る。
// ・「\n」を入れたところで改行する（入れなくても、画面の幅に合わせて自動で折り返す）
// ・押すと飛ぶ先はすべて新しいタブで開く。文字のリンクには後ろにドット絵の矢印（↗）が付く

/** 団体名・公式サイト・ロゴ画像（public/labo-logo.png） */
export const LABO = { name: 'とんペディア_ラボ', url: 'https://labo.tompedia.jp/', logo: '/labo-logo.png' };
/** 東北大学祭 特設ウェブアプリ */
export const FESTA_URL = 'https://festa.tohoku.app/2026/';
/** 学祭アプリのバナー画像（public/festa-banner.webp）。alt は画像が見えない人向けに読み上げる説明 */
export const FESTA_BANNER = {
  src: '/festa-banner.webp',
  alt: '東北大学祭2026 公式特設ウェブアプリ。企画検索・3Dマップ・混雑状況。タップして企画をチェック',
};

/**
 * とんペディア_ラボが参加している Giving Campaign の案内。大学への寄付と取り違えられないよう、主語は団体名にする。
 * クレジット枠の中にだけ出す（ゲームの途中・シェア文・OGPには出さない）。
 * endsAt を過ぎると画面から自動で消える。消えたあとは、落ち着いたときに GIVING ごとコードから消す
 */
export const GIVING = {
  url: 'https://tohoku.2026.giving-campaign.jp/groups?id=dc7af851-20c9-4215-8694-e453695e5d2f',
  /** キャンペーンの終わり（日本時間 2026年10月25日 21:00） */
  endsAt: '2026-10-25T21:00:00+09:00',
  timerLabel: '締め切りまで',
  body: 'とんペディア_ラボは今、Giving Campaignに参加しています。\n活動を応援してもらえたらうれしいです！',
  button: '応援する',
};

// ─ リザルト画面：「研究の階段」の下、「もう一度入学する」ボタンの上。紙色のドット枠
//
//   ★ このゲームを作ったのは                ← heading
//
//        [ とんペディア_ラボのロゴ ]         ← 押すと LABO.url
//
//     とんペディア_ラボが、東北大学祭に向けて作りました。   ← body（中央寄せ）
//     学祭の特設ウェブアプリも作っています。
//
//   [ 東北大学祭2026 ウェブアプリのバナー ]   ← 押すと FESTA_URL
//   - - - - - - - - - - - - - - - - - - - -
//        [ ◷ 締め切りまで 2日 05:12:33 ]     ← GIVING.timerLabel ＋ 残り時間（1秒ごとに減る）
//     とんペディア_ラボは今、Giving Campaignに〜   ← GIVING.body
//
//   [ ♥ 応援する ↗ ]  [ ラボのサイト ↗ ]       ← GIVING.button → GIVING.url ／ laboButton（白いボタン）
export const CREDIT_RESULT = {
  heading: 'このゲームを作ったのは',
  body: 'とんペディア_ラボが、東北大学祭に向けて作りました。\n学祭の特設ウェブアプリも作っています。',
  laboButton: 'ラボのサイト',
};

// ─ タイトル画面：「入学する」「称号図鑑」ボタンと「『80億分の1』に〜」の下。白いドット枠、全体が中央寄せ
//
//                 制作                       ← label（小さいドット文字）
//        [ とんペディア_ラボのロゴ ]         ← 押すと LABO.url
//       東北大学祭に向けて作りました。       ← body
//   [ 東北大学祭2026 ウェブアプリのバナー ]   ← 押すと FESTA_URL
//        [ ◷ 締め切りまで 2日 05:12:33 ]     ← GIVING.timerLabel ＋ 残り時間
//     とんペディア_ラボは今、Giving Campaignに〜   ← GIVING.body（小さめ）
//            [ ♥ 応援する ↗ ]                ← GIVING.button → GIVING.url
export const CREDIT_TITLE = {
  label: '制作',
  body: '東北大学祭に向けて作りました。',
};

// ─ 全画面のフッター：「東北大学とは関係のない〜」の定型文のすぐ下の行
//
//   制作：とんペディア_ラボ                  ← label ＋ LABO.name（下線リンク → LABO.url）
export const CREDIT_FOOTER = {
  label: '制作：',
};
