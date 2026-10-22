// 公開前の全文チェック用に、イベント文・称号・10年後の一文・豆知識を1つのMarkdownに書き出す。
// 使い方：npm run export:events → docs/events-review.md

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { GameEvent, When } from '../src/core/types';
import { TITLES } from '../src/data/endings';
import { EVENTS } from '../src/data/events';
import { THEMES } from '../src/data/research';
import { STATS } from '../src/data/stats';
import { TRIVIA } from '../src/data/trivia';

const srcLines = readFileSync(new URL('../src/data/events.ts', import.meta.url), 'utf8').split('\n');
/** イベントの中か、すぐ上に続くコメント行に「要確認」があるか */
const needsCheck = (id: string) => {
  const at = srcLines.findIndex((l) => l.includes(`id: '${id}'`));
  if (at < 0) return false;
  const oneLine = /^\s*\{ id:/.test(srcLines[at]);
  let start = oneLine ? at : at;
  if (!oneLine) while (start > 0 && !/^\s*\{\s*$/.test(srcLines[start])) start--;
  let end = at;
  if (!oneLine) while (end < srcLines.length - 1 && !/^\s*\},?\s*$/.test(srcLines[end])) end++;
  let top = start;
  while (top > 0 && /^\s*\/\//.test(srcLines[top - 1]) && !/^\s*\/\/ ──/.test(srcLines[top - 1])) top--;
  return srcLines.slice(top, end + 1).some((l) => l.includes('要確認'));
};
const whenText = (w: When) =>
  [
    w.sem && `セメ ${w.sem.join(',')}`,
    w.master && `修士${w.master.join(',')}年`,
    w.extra && '5年目',
    w.final && '在学の終わり',
    w.faculty && `学部 ${w.faculty.join(',')}`,
    w.dept && `学科 ${w.dept.join(',')}`,
    w.course && `コース ${w.course.join(',')}`,
    w.entry && `入学方式 ${w.entry.join(',')}`,
  ]
    .filter(Boolean)
    .join(' / ') || 'いつでも';
const q = (t: string) => t.replace(/\n/g, ' ／ ');
const KIND = { fixed: '固定', choice: '選択', random: 'ランダム（日記）' } as const;

const lines: string[] = [
  '# 全文チェック用の一覧',
  '',
  '`npm run export:events` で書き出したもの（手で直さない）。直すときは `src/data/` を直して書き出し直す。',
  '',
  'チェックの観点（REQUIREMENTS.md「コンプライアンス方針」）：特定の人・団体を下げていないか／学部・出身・家計・性別などで優劣をつけていないか／進路を成功・失敗で評価していないか／死・自傷・ハラスメント・犯罪を扱っていないか／飲酒は20歳以上で注意書きつきか／災害を笑いにしていないか／恋愛の相手の性別を決めていないか／事実（要確認）が正しいか',
  '',
  `イベント ${EVENTS.length}本（固定 ${EVENTS.filter((e) => e.kind === 'fixed').length}、選択 ${EVENTS.filter((e) => e.kind === 'choice').length}、ランダム ${EVENTS.filter((e) => e.kind === 'random').length}）`,
  '',
];

for (const kind of ['fixed', 'choice', 'random'] as const) {
  lines.push(`## ${KIND[kind]}`, '');
  for (const ev of EVENTS.filter((e) => e.kind === kind) as GameEvent[]) {
    const marks = [needsCheck(ev.id) && '要確認', (ev.when.faculty || ev.when.dept) && ev.when.sem && '時期要確認',ev.tags?.includes('drinking') && '飲酒', ev.tags?.includes('danger') && '危ない実話', ev.rescue && '立て直し', ev.cond && '条件あり'].filter(Boolean);
    lines.push(`### ${ev.id}${marks.length ? `（${marks.join('・')}）` : ''}`);
    lines.push(`- 時期：${whenText(ev.when)}`);
    if (ev.prob) lines.push(`- 起きる確率：${STATS[ev.prob].label} ${STATS[ev.prob].value}${STATS[ev.prob].provisional ? '（仮置き）' : ''}`);
    if (ev.rare) lines.push(`- レア度に入れる：${ev.rare.label}`);
    lines.push(`- 本文：${q(ev.text)}`);
    if (ev.statLine) lines.push(`- 統計：${ev.statLine.replace(/^統計：/, '')}`);
    if (ev.caution) lines.push(`- 注意書き：${ev.caution}`);
    for (const c of ev.choices ?? []) lines.push(`  - 「${c.label}」→ ${q(c.result)}${c.cond ? '（条件あり）' : ''}`);
    lines.push('');
  }
}

lines.push('## 称号', '');
for (const t of TITLES) lines.push(`- **${t.name}**：${t.desc}`);
lines.push('', '## 研究テーマ（10年後の一文は src/data/endings.ts）', '');
for (const [k, list] of Object.entries(THEMES)) lines.push(`- ${k}：${list.map((t) => `${t.name}（→${t.industry}）`).join('、')}`);
lines.push('', '## 豆知識（すべて要確認）', '');
for (const t of TRIVIA) lines.push(`- ${t.text}${t.source ? '' : '（出典なし：公開前に付ける）'}`);
lines.push('');

mkdirSync('docs', { recursive: true });
writeFileSync('docs/events-review.md', lines.join('\n'));
console.log(`docs/events-review.md に書き出しました（イベント ${EVENTS.length}本）`);
