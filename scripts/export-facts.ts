// 「要確認」が付いた箇所を、ソースの行へのリンクつきで1つのMarkdownに書き出す。
// 作者がリンクから該当の行を開いて直接直し、確認できたら「要確認」を消す、という使い方をする。
// 使い方：npm run facts → docs/fact-check.md

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Campus } from '../src/core/types';
import { EVENTS } from '../src/data/events';
import { CAMPUS_NAME } from '../src/data/structure';
import { TRIVIA } from '../src/data/trivia';

const ROOT = join(import.meta.dirname, '..');
const GROUPS: [RegExp, string][] = [
  [/src[\\/]data[\\/]events\.ts$/, 'イベント文（src/data/events.ts）'],
  [/src[\\/]data[\\/]structure\.ts$/, '学部・キャンパス・時期（src/data/structure.ts）'],
  [/src[\\/]data[\\/]trivia\.ts$/, '豆知識（src/data/trivia.ts）'],
  [/./, 'その他'],
];
/** 「要確認を付ける」というルールの説明は一覧に入れない */
const RULE = /「要確認」を付ける/;

const files = [join(ROOT, 'index.html'), ...walk(join(ROOT, 'src'))];
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return d.name === 'dev' ? [] : walk(p);
    return /\.(ts|html)$/.test(d.name) ? [p] : [];
  });
}

const isComment = (l: string) => /^\s*(\/\/|\/\*\*?|\*|<!--)/.test(l);
const clip = (t: string, n = 90) => (t.length > n ? `${t.slice(0, n)}…` : t);
const md = (t: string) => t.replace(/\|/g, '\\|').replace(/`/g, "'");

/** structure.ts の値を、どの学部の何の値かが分かる文にする */
function readable(lines: string[], i: number, code: string): string | null {
  let fac = '';
  for (let j = i; j >= 0 && !fac; j--) fac = lines[j].match(/^\s*id: '[a-z]+', name: '([^']+)'/)?.[1] ?? '';
  const unit = code.match(/id: '[a-z]+\.[^']+', name: '([^']+)'/)?.[1];
  const who = [fac, unit].filter(Boolean).join(' ');
  const lab = code.match(/lab: \{ sem: (\d+), kind: '([^']+)' \}/);
  const parts = [
    lab && `${lab[2]}が決まる時期：${lab[1]}セメ`,
    code.match(/barriers: \[([^\]]+)\]/)?.[1].replace(/,\s*/g, '・').replace(/$/, 'セメ末にバリアの判定'),
    ...[...code.matchAll(/\{ from: (\d+), campus: '(\w+)' \}/g)].map((m) => `${m[1]}セメから${CAMPUS_NAME[m[2] as Campus]}に通う`),
  ].filter(Boolean);
  return parts.length && who ? `${who}：${parts.join('、')}` : null;
}

/** コメントが何について書かれているか（すぐ下のイベント・豆知識・コード） */
function target(lines: string[], i: number): string {
  const line = lines[i];
  const code = line.split(/\/\/|<!--/)[0].trim();
  if (code && !isComment(line)) return readable(lines, i, code) ?? `\`${md(clip(code))}\``;
  for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
    const id = lines[j].match(/id: '([^']+)'/)?.[1];
    const ev = id && EVENTS.find((e) => e.id === id);
    if (ev) return `イベント \`${ev.id}\`：「${md(ev.text.replace(/\n/g, ' ／ '))}」`;
    const tv = lines[j].match(/text: '([^']+)'/)?.[1];
    const tr = tv && TRIVIA.find((t) => t.text === tv);
    if (tr) return `「${md(tr.text)}」`;
    if (/^import /.test(lines[j])) return '（ファイル全体の方針）';
    if (!isComment(lines[j]) && lines[j].trim()) return `\`${md(clip(lines[j].trim()))}\``;
  }
  return '';
}

type Item = { group: string; link: string; note: string; what: string };
const items: Item[] = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  lines.forEach((l, i) => {
    if (!l.includes('要確認') || RULE.test(l)) return;
    const comment = l.slice(l.search(/\/\/|\/\*\*?|<!--|\*/)).replace(/^(\/\/|\/\*\*?|<!--|\*)\s*/, '').replace(/\s*(\*\/|-->)\s*$/, '');
    const note = comment.replace(/^要確認[：:]?\s*/, '').replace(/（要確認）/, '').trim();
    items.push({
      group: GROUPS.find(([re]) => re.test(file))![1],
      link: `[${rel.split('/').pop()}:${i + 1}](../${rel}#L${i + 1})`,
      note: md(note),
      what: target(lines, i),
    });
  });
}

const out: string[] = [
  '# 事実確認リスト',
  '',
  '`npm run facts` で書き出したもの（このファイルは手で直さない）。',
  '',
  `残り **${items.length}件**`,
  '',
  '## 直し方',
  '',
  '1. 左のリンクを開くと、ソースの該当の行に飛ぶ（VS Code ならリンクを Ctrl＋クリック）',
  '2. 間違っていたら、その場で文を直す。イベント文は `\'…\'` の中だけを直す。`\\n` は改行で、1画面3行まで',
  '3. 確かめ終わったら、その行のコメントから「要確認」を消す（`// 要確認` だけの行なら行ごと消す。メモを残したいなら `// 確認済み：確かめた日と方法` のように書きかえる）',
  '4. `npm run facts` でこの一覧を作り直す。消した分だけ減る',
  '5. 最後に `npm run lint:content` と `npm run typecheck` が通るか確かめる',
  '',
  '`npm run dev` を動かしたままにしておくと、保存した文がすぐ画面に反映される。',
  '',
];
for (const [, group] of GROUPS) {
  const list = items.filter((x) => x.group === group);
  if (!list.length) continue;
  out.push(`## ${group}（${list.length}件）`, '', '| 場所 | 確かめること | 対象 |', '| --- | --- | --- |');
  for (const x of list) out.push(`| ${x.link} | ${x.note || (x.group.startsWith('イベント') ? '本文の事実' : '内容が合っているか')} | ${x.what} |`);
  out.push('');
}

mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs/fact-check.md'), out.join('\n'));
console.log(`docs/fact-check.md に書き出しました（要確認 ${items.length}件）`);
