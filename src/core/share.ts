// シェア文。入力に家計を含めない（型で渡せないようにしている）。

import { formatApprox } from './template';

export type ShareInput = {
  n: number;
  attributes: string[]; // 学部／住まい／サークル／留年 など
  path: string;
  research: string | null;
  title: string;
  url: string;
};

export const HASHTAG = '#とんぺー分の1';

/** Xの文字数の数え方：全角は2、URLは23 */
export function xLength(text: string): number {
  let len = 0;
  for (const part of text.split(/(https?:\/\/\S+)/)) {
    if (/^https?:\/\//.test(part)) {
      len += 23;
      continue;
    }
    for (const ch of part) len += /[\u0000-ჿ -‍‐-‟′-‷]/.test(ch) ? 1 : 2;
  }
  return len;
}

export const X_LIMIT = 280;

export function shareText(i: ShareInput): string {
  const lines = (withResearch: boolean) =>
    [
      `私の東北大生活は約${formatApprox(i.n)}人に1人でした。`,
      `${i.attributes.join('／')}→${i.path}`,
      withResearch && i.research ? `研究：${i.research}` : null,
      `称号：${i.title}`,
      `遊んでみる → ${i.url}`,
      HASHTAG,
    ]
      .filter((x): x is string => x !== null)
      .join('\n');
  const full = lines(true);
  // 溢れるときは研究の行から省く
  return xLength(full) <= X_LIMIT ? full : lines(false);
}
