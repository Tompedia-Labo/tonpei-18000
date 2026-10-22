// 東北大の豆知識。ガチャの合間に1行ずつ出す。人名は出さない。
// 公開前に、出典が空のものへ出典を付ける（REQUIREMENTS.md「東北大の豆知識」）。

import type { SourceKey } from './stats';

export type Trivia = { text: string; source: SourceKey | null };

export const TRIVIA: Trivia[] = [
  // 要確認
  { text: '東北大は、国際卓越研究大学の第1号に認定された。', source: 'mextTakuetsu' },
  // 要確認
  { text: '青葉山には、世界最高水準の放射光施設NanoTerasuがある。', source: 'mextNanoterasu' },
  // 要確認：出典を付ける
  { text: '災害科学を研究する拠点がある。', source: null },
  // 要確認：出典を付ける
  { text: 'テレビアンテナの原型になった技術は、この大学で生まれた。', source: null },
  // 要確認：出典を付ける
  { text: '強力な磁石鋼も、この大学で生まれた。', source: null },
];
