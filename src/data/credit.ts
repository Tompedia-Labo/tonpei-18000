// とんペディア_ラボと東北大学祭の案内に出す文言。ここの文字列を書き換えれば、そのまま画面に出る。
// ・「\n」を入れたところで改行する（入れなくても、画面の幅に合わせて自動で折り返す）
// ・押すと飛ぶ先はすべて新しいタブで開き、リンクの文字の後ろにドット絵の矢印（↗）が付く

/** 団体名・公式サイト・ロゴ画像（public/labo-logo.png） */
export const LABO = { name: 'とんペディア_ラボ', url: 'https://labo.tompedia.jp/', logo: '/labo-logo.png' };
/** 東北大学祭 特設ウェブアプリ */
export const FESTA_URL = 'https://festa.tohoku.app/2026/';

// ─ リザルト画面：「研究の階段」の下、「もう一度入学する」ボタンの上。紙色のドット枠
//
//   ★ このゲームを作ったのは                ← heading
//
//        [ とんペディア_ラボのロゴ ]         ← 押すと LABO.url
//
//     とんペディア_ラボが、東北大学祭に向けて作りました。   ← body（中央寄せ）
//     学祭の特設ウェブアプリも作っています。
//
//   [ 学祭アプリを見る ↗ ]  [ ラボのサイト ↗ ]    ← festaButton（黄色）・laboButton（白）
//                                                 スマホの幅では上下に並ぶ
export const CREDIT_RESULT = {
  heading: 'このゲームを作ったのは',
  body: 'とんペディア_ラボが、東北大学祭に向けて作りました。\n学祭の特設ウェブアプリも作っています。',
  festaButton: '学祭アプリを見る',
  laboButton: 'ラボのサイト',
};

// ─ タイトル画面：「入学する」「称号図鑑」ボタンと「『80億分の1』に〜」の下。白いドット枠、全体が中央寄せ
//
//                 制作                       ← label（小さいドット文字）
//        [ とんペディア_ラボのロゴ ]         ← 押すと LABO.url
//   東北大学祭に向けて作りました。 学祭アプリも見る ↗   ← body ＋ festaLink（太字の下線リンク → FESTA_URL）
//                                                    スマホの幅では festaLink が次の行に回る
export const CREDIT_TITLE = {
  label: '制作',
  body: '東北大学祭に向けて作りました。',
  festaLink: '学祭アプリも見る',
};

// ─ 全画面のフッター：「東北大学とは関係のない〜」の定型文のすぐ下の行
//
//   制作：とんペディア_ラボ                  ← label ＋ LABO.name（下線リンク → LABO.url）
export const CREDIT_FOOTER = {
  label: '制作：',
};
