// イベント文のルールチェック（CLAUDE.md・REQUIREMENTS.md）。人が全文を読む前の機械チェック。
// 使い方：npm run lint:content

import { readFileSync } from 'node:fs';
import type { GameEvent } from '../src/core/types';
import { EVENTS } from '../src/data/events';
import { STATS } from '../src/data/stats';
import { SCENE_KEYS } from '../src/ui/pixel/scenes';

const errors: string[] = [];
const warns: string[] = [];
const err = (ev: GameEvent, msg: string) => errors.push(`${ev.id}: ${msg}`);

// 評価語・優劣をつける言葉・学期の「前期・後期」
const BANNED = [/前期|後期/, /ハズレ|はずれ組|勝ち組|負け組/, /ブラック|ゆるい研究室|ゆるいサークル/, /落ちこぼれ|底辺|情けない/];
const texts = (ev: GameEvent) => [
  { where: '本文', text: ev.text },
  ...(ev.choices ?? []).flatMap((c, i) => [
    { where: `選択肢${i + 1}`, text: c.label },
    { where: `結果${i + 1}`, text: c.result },
  ]),
];

const ids = new Set<string>();
for (const ev of EVENTS) {
  if (ids.has(ev.id)) err(ev, 'id が重複している');
  ids.add(ev.id);

  for (const { where, text } of texts(ev)) {
    const lines = text.split('\n').length;
    if (lines > 3) err(ev, `${where}が${lines}行（3行まで）`);
    if (/\d+(\.\d+)?\s*[%％]/.test(text)) err(ev, `${where}に割合が直接書かれている（statLine と stats.ts を使う）`);
    for (const re of BANNED) if (re.test(text)) err(ev, `${where}に使わない言葉：${text.match(re)![0]}`);
    if (text.length > 0 && lines === 1 && text.length > 60) warns.push(`${ev.id}: ${where}が長い（${text.length}字）`);
  }
  if (ev.kind === 'random' && ev.text.includes('\n')) err(ev, 'ランダムイベントは日記に並ぶので1行にする');
  // 1〜2セメは全学教育が中心。学部・学科のイベントは、いつ起きるかを必ず書く
  if ((ev.when.faculty || ev.when.dept || ev.when.course) && !ev.when.sem && !ev.when.master && !ev.when.extra && !ev.cond)
    err(ev, '学部・学科のイベントに時期（sem / master）がない。1年の全学教育の時期にも出てしまう');
  if (ev.kind === 'choice' && !ev.choices?.length) err(ev, '選択肢がない');
  if (ev.statLine) {
    if (!ev.source) err(ev, 'statLine に source がない');
    if (!ev.statLine.includes('{value}')) err(ev, 'statLine に {value} がない（数値は stats.ts から差し込む）');
    if (typeof ev.source === 'string' && !(ev.source in STATS)) err(ev, `source「${ev.source}」が stats.ts にない`);
  }
  if (ev.tags?.includes('drinking') && !ev.caution) err(ev, '飲酒のイベントに caution がない');
  if (ev.tags?.includes('danger') && !ev.caution) err(ev, '危ない実話のイベントに caution がない');
  if (ev.scene && !(SCENE_KEYS as string[]).includes(ev.scene)) err(ev, `scene「${ev.scene}」が無い`);
  if (/お酒|飲み会|ビール|乾杯/.test(ev.text) && !ev.tags?.includes('drinking')) warns.push(`${ev.id}: 飲酒らしい言葉があるが tags に drinking がない`);
}

// 東北大の事実に関わる文に「要確認」が付いているか（固有名詞を含むイベントの近くにコメントがあるか）
const src = readFileSync(new URL('../src/data/events.ts', import.meta.url), 'utf8');
const PROPER = /研一|川内|青葉山|片平|星陵|じかそう|芋煮|広瀬川|西公園|松島|NanoTerasu|学生歌|生協|学食|スタミナ/;
for (const ev of EVENTS) {
  if (!PROPER.test(ev.text)) continue;
  const at = src.indexOf(`id: '${ev.id}'`);
  const block = src.slice(at, src.indexOf('\n  },', at));
  if (!block.includes('要確認')) warns.push(`${ev.id}: 東北大の固有名詞があるが「要確認」コメントがない`);
}

console.log(`イベント ${EVENTS.length}本をチェックしました`);
for (const e of errors) console.log(`✗ ${e}`);
for (const w of warns) console.log(`△ ${w}`);
if (!errors.length && !warns.length) console.log('問題は見つかりませんでした');
process.exitCode = errors.length ? 1 : 0;
