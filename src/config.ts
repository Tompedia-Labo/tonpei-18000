// 公開URL（Cloudflare Pages のプロジェクト tonpei-18000）。index.html の og:image・og:url と合わせる
export const SITE_URL = 'https://tonpei-18000.pages.dev';

export const DISCLAIMER =
  '本作は東北大学とは関係のない、学生個人による非公式プロジェクトです。東北大学の公認・協力・データ提供を受けたものではありません。';
export const DISCLAIMER_SHORT = '東北大学とは関係のない、学生個人による非公式プロジェクト';
export const INSPIRED_BY = '『80億分の1』にインスパイアされた作品です。';
// 気づいたこと・間違いの報告フォーム（Googleフォーム）。送るのは画面・イベントID・時期だけで、学部や家計は送らない
const FEEDBACK_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSd4y2BWG7shAMBJF3PgdhuEqlXTV-nuM_d5zaaaXsvrkqpS3Q/viewform';
const FEEDBACK_ENTRY = { screen: 'entry.681539145', eventId: 'entry.1630610655', when: 'entry.942080845' } as const;
/** フォームの「どの画面のことですか？」の選択肢と同じ文字列にする */
export type FeedbackScreen = 'タイトル' | '入学ガチャ' | 'ゲーム中のイベント・選択肢' | '振り返り' | '結果';
export function feedbackUrl(pre: { screen?: FeedbackScreen; eventId?: string; when?: string } = {}): string {
  const q = new URLSearchParams({ usp: 'pp_url' });
  for (const k of ['screen', 'eventId', 'when'] as const) if (pre[k]) q.set(FEEDBACK_ENTRY[k], pre[k]);
  return `${FEEDBACK_FORM}?${q}`;
}

// β版のあいだの表示。stats.ts の照合と docs/fact-check.md の事実確認が終わったら外す
export const BETA = 'β版';
export const DATA_NOTICE = 'データは現在事実確認中のため、間違った値がある場合があります。';
