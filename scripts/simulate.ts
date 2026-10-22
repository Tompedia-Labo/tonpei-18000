// 自動プレイ（おまかせ）を回して、留年率・院進率・レア度の分布・属性による差を出す。網羅チェックも行う。
// 使い方：npm run sim [-- 回数]

import { matches } from '../src/core/select';
import { planTurns, masterTurns, extraTurn, semLabel } from '../src/core/turns';
import type { Beat, GameEvent, State, Turn } from '../src/core/types';
import { BALANCE } from '../src/data/balance';
import { EVENTS } from '../src/data/events';
import { ENTRY, HOUSING, KOUKI_FACULTIES, PERSONALITY } from '../src/data/gacha';
import { stat } from '../src/data/stats';
import { FACULTIES, type Unit } from '../src/data/structure';
import { advance, autoChoice, choose, createGame, result } from '../src/engine';

const RUNS = Number(process.argv[2] ?? 10000);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const fmt = (n: number) => Math.round(n).toLocaleString('ja-JP');
const problems: string[] = [];

type Run = { s: State; n: number; choices: number; screens: number; banners: number; share: string };

function play(seed: number): Run {
  let s = createGame(seed);
  let choices = 0;
  let screens = 0;
  let banners = 0;
  for (let i = 0; i < 1000; i++) {
    const r = s.pending ? choose(s, autoChoice(s)) : advance(s);
    if (s.pending) choices++;
    s = r.state;
    if (r.beat.type === 'end') break;
    // 学期の幕は自動で流れるので、タップして読む画面とは分けて数える。選択の結果は同じ画面に出る
    if (r.beat.type === 'turnStart') banners++;
    else if (r.beat.type !== 'choiceResult') screens++;
    check(r.beat, s, seed);
  }
  const res = result(s);
  return { s, n: res.rarity.n, choices, screens, banners, share: res.share };
}

const DRINKING = new Set(EVENTS.filter((e) => e.tags?.includes('drinking')).map((e) => e.id));
function check(beat: Beat, s: State, seed: number) {
  if (s.stats.kokoro < BALANCE.kokoroFloor) problems.push(`seed ${seed}: こころが${s.stats.kokoro}`);
  const ids = beat.type === 'event' ? [beat.event.id] : beat.type === 'diary' ? beat.lines.map((l) => l.id) : [];
  for (const id of ids) if (DRINKING.has(id) && s.age < BALANCE.drinkingAge) problems.push(`seed ${seed}: ${s.age}歳で飲酒イベント ${id}`);
}

const runs: Run[] = [];
const t0 = Date.now();
for (let seed = 1; seed <= RUNS; seed++) runs.push(play(seed));
console.log(`# ${fmt(RUNS)}回の自動プレイ（${((Date.now() - t0) / 1000).toFixed(1)}秒）\n`);

// ── 全体
const ryunen = (r: Run) => !!r.s.flags.ryunen;
const master = (r: Run) => r.s.turns.some((t) => t.kind === 'master');
const ns = runs.map((r) => r.n).sort((a, b) => a - b);
const q = (k: number) => ns[Math.min(ns.length - 1, Math.floor(ns.length * k))];
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log('## 全体');
console.log(`留年率 ${pct(runs.filter(ryunen).length / RUNS)}（目標 10〜15%）`);
console.log(`N の中央値 ${fmt(q(0.5))}（目標 1万〜5万） / 上位5% ${fmt(q(0.95))}（目標 100万超） / 1.8万以下 ${pct(ns.filter((n) => n <= stat('enrolled.total')).length / RUNS)}`);
console.log(`選択の回数 平均${avg(runs.map((r) => r.choices)).toFixed(1)}（目標 6〜8） / 最小${Math.min(...runs.map((r) => r.choices))} 最大${Math.max(...runs.map((r) => r.choices))}`);
// タイトル・ガチャ・振り返り3画面・結果の6画面を足して、1周の画面数にする
console.log(`画面の数 平均${(avg(runs.map((r) => r.screens)) + 6).toFixed(1)}（目標 25〜30。ほかに自動で流れる学期の幕が${avg(runs.map((r) => r.banners)).toFixed(1)}枚）`);
console.log(`こころの最小 ${Math.min(...runs.flatMap((r) => [...r.s.history.map((h) => h.stats.kokoro), r.s.stats.kokoro]))}（10以上）`);
const paths = new Map<string, number>();
for (const r of runs) paths.set(String(r.s.path), (paths.get(String(r.s.path)) ?? 0) + 1);
console.log(`進路 ${[...paths].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v / RUNS)}`).join(' / ')}`);
const titles = new Map<string, number>();
for (const r of runs) titles.set(result(r.s).title, (titles.get(result(r.s).title) ?? 0) + 1);
console.log(`称号 ${titles.size}種 ${[...titles].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v / RUNS)}`).join(' / ')}`);
console.log(`研究の階段 ${['lab', 'domestic', 'intl', 'paper', 'world'].map((_, i) => `${i}段目以上 ${pct(runs.filter((r) => r.s.ladder >= i).length / RUNS)}`).join(' / ')}`);

// ── 学部別
console.log('\n## 学部別（院進率は実データと比べる）');
console.log('| 学部 | 人数 | 留年 | 院進（実データ） | 博士/院進（実データ） |');
console.log('| --- | --- | --- | --- | --- |');
for (const f of FACULTIES) {
  const rs = runs.filter((r) => r.s.profile.faculty === f.id);
  if (!rs.length) continue;
  const m = rs.filter(master);
  const doc = m.filter((r) => r.s.path === 'doctor');
  const real = f.shingaku ? pct(stat(f.shingaku)) : '—';
  const realDoc = f.master ? pct(stat(`master.${f.master}.doctor` as never)) : '—';
  console.log(`| ${f.name} | ${rs.length} | ${pct(rs.filter(ryunen).length / rs.length)} | ${pct(m.length / rs.length)}（${real}） | ${m.length ? pct(doc.length / m.length) : '—'}（${realDoc}） |`);
}

// ── 属性による差（住まい・性格で進路に差が出ないこと）
console.log('\n## 住まい・性格による差（院進率と留年率の最大差。2ポイント以内が目標）');
for (const [label, key, list] of [['住まい', 'housing', HOUSING], ['性格', 'personality', PERSONALITY]] as const) {
  const rows = list.map((o) => {
    const rs = runs.filter((r) => r.s.profile[key] === o.id);
    return { name: o.name, n: rs.length, master: rs.filter(master).length / rs.length, ryunen: rs.filter(ryunen).length / rs.length };
  });
  const span = (k: 'master' | 'ryunen') => Math.max(...rows.map((r) => r[k])) - Math.min(...rows.map((r) => r[k]));
  // 抽選のばらつきの目安：2グループの差の95%の幅
  const noise = (k: 'master' | 'ryunen') => {
    const n = Math.min(...rows.map((r) => r.n));
    const p = avg(rows.map((r) => r[k]));
    return 1.96 * Math.sqrt((2 * p * (1 - p)) / n);
  };
  console.log(`${label}：${rows.map((r) => `${r.name} 院進${pct(r.master)} 留年${pct(r.ryunen)}`).join(' / ')}`);
  console.log(`  → 院進の差 ${(span('master') * 100).toFixed(1)}pt（ばらつきの目安 ±${(noise('master') * 100).toFixed(1)}pt）、留年の差 ${(span('ryunen') * 100).toFixed(1)}pt（±${(noise('ryunen') * 100).toFixed(1)}pt）`);
}

// ── 家計がレア度・シェア文に入っていないこと
for (const r of runs) {
  if (r.s.rareLog.some((x) => x.id.includes('wallet'))) problems.push(`seed ${r.s.seed}: レア度に家計が入っている`);
  if (/仕送り|奨学金|余裕|苦しい/.test(r.share)) problems.push(`seed ${r.s.seed}: シェア文に家計の言葉`);
}

// ── 網羅チェック：すべての組み合わせ×ターンで、出せるランダムイベントが1本以上あるか
console.log('\n## 網羅チェック（ランダムイベントがゼロのマス）');
const leaves = (u: Unit): { dept: string | null; course: string | null; label: string }[] => {
  const base = [{ dept: u.dept ?? null, course: null as string | null, label: '' }];
  return (u.assigns ?? []).reduce(
    (acc, a) => acc.flatMap((x) => a.options.map((o) => ({ dept: o.dept ?? x.dept, course: o.course ?? x.course, label: `${x.label}${o.name} ` }))),
    base,
  );
};
const loose = (ev: GameEvent): GameEvent => ({ ...ev, cond: undefined, once: false });
const randoms = EVENTS.filter((e) => e.kind === 'random').map(loose);
const zero = new Map<string, string[]>();
let cells = 0;
for (const f of FACULTIES)
  for (const u of f.units)
    for (const entry of ENTRY.filter((e) => e.id !== 'kouki' || KOUKI_FACULTIES.includes(f.id)))
      for (const leaf of leaves(u)) {
        const s = createGame(1);
        s.profile = { ...s.profile, faculty: f.id, unit: u.id, entry: entry.id, dept: null, course: null };
        const turns: Turn[] = [...planTurns(s.profile), extraTurn(), ...((u.master !== undefined ? u.master : f.master) ? masterTurns() : [])];
        for (const t of turns) {
          // 分属のセメを過ぎたら学科・コースが決まっている
          const sem = t.kind === 'master' ? 99 : t.sems[0];
          const decided = (u.assigns ?? []).every((a) => sem > a.sem);
          s.profile.dept = decided ? leaf.dept : u.dept ?? null;
          s.profile.course = decided ? leaf.course : null;
          cells++;
          if (!randoms.some((ev) => matches(ev, s, t))) {
            const key = `${f.name} ${u.name} ${leaf.label}`.trim();
            const list = zero.get(key) ?? [];
            if (!list.includes(semLabel(t))) list.push(semLabel(t));
            zero.set(key, list);
          }
        }
      }
if (!zero.size) console.log(`ゼロのマスはありません（${fmt(cells)}マス）`);
else for (const [k, v] of zero) console.log(`- ${k}：${v.join('、')}`);

console.log('\n## 問題');
if (!problems.length) console.log('なし');
else console.log([...new Set(problems)].slice(0, 30).join('\n'));
process.exitCode = problems.length ? 1 : 0;
