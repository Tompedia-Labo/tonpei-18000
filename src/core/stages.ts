// 在学の節目：分属、研究室配属（研究テーマと探究の解放）、研究の階段、学期末の判定（セメスターバリア含む）。
// DOMに触らない純関数（State を書き換えるのは engine が複製したもの）。

import { BALANCE } from '../data/balance';
import { LADDER, THEMES, themeById } from '../data/research';
import { stat } from '../data/stats';
import { CROSS_COURSES, faculty, labOf, unit, type Assign } from '../data/structure';import type { Rng } from '../rng';
import { applyEffect } from './effects';
import { extraTurn } from './turns';
import type { Beat, Pending, State, SynthChoice, Turn } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const isRegularSem = (t: Turn): t is Extract<Turn, { kind: 'sem' }> => t.kind === 'sem' && !t.extra;

// ── 分属

export function assignFor(s: State, t: Turn): Assign | null {
  if (!isRegularSem(t)) return null;
  return unit(s.profile.unit).assigns?.find((a) => t.sems.includes(a.sem) && !s.flags[`assign:${a.sem}`]) ?? null;
}

export function assignPending(a: Assign): Pending {
  return {
    eventId: `assign:${a.sem}`,
    variant: 'assign',
    options: a.options.map((o, i) => ({ label: o.name, result: '', action: { type: 'assign', index: i } })),
  };
}

export const assignText = (a: Assign) => `${a.label}の希望を出す時期が来た。\nどこを第一希望にする？`;

/** 第一希望が通るかは単位ゲージと乱数で決める。通らなくても、その先の面白さを描く */
export function resolveAssign(s: State, a: Assign, index: number, rng: Rng): { text: string; tone: 'good' | 'twist' } {
  s.flags[`assign:${a.sem}`] = true;
  const b = BALANCE.assign;
  const p = clamp(b.base + (s.stats.tani - 50) * b.perTani, b.min, b.max);
  const others = a.options.filter((_, i) => i !== index);
  const ok = !others.length || rng.chance(p);
  const got = ok ? a.options[index] : rng.pick(others);
  if (got.dept) s.profile.dept = got.dept;
  if (got.course) s.profile.course = got.course;
  if (ok) return { text: `第一希望の${got.name}に決まった！\n新しい名札が、ちょっと誇らしい。`, tone: 'good' };
  return { text: `第一希望には届かなかった。\n${got.name}で、思ってもみなかった面白さに出会う。`, tone: 'twist' };
}

/** 建築・社会環境工学科の土木系3コースは、クロス情報プログラムに申し込める（任意） */
export const canCross = (s: State) => !!s.profile.course && CROSS_COURSES.includes(s.profile.course) && s.flags.cross === undefined;

export const crossPending = (): Pending => ({
  eventId: 'cross',
  variant: 'normal',
  options: [
    { label: '申し込む', result: '情報の授業が増えた。\n時間割は、ぎっしり。', effects: { stats: { tani: -2, tsunagari: 4 } }, action: { type: 'cross', join: true } },
    { label: '申し込まない', result: 'いまのコースの勉強に集中する。\n空きコマで、少し息ができる。', effects: { stats: { kokoro: 3 } }, action: { type: 'cross', join: false } },
  ],
});
export const crossText = 'クロス情報プログラムの募集が出た。\n申し込むのは自由。どうする？';

// ── 研究室配属：研究テーマカード3枚から1枚

export function labDue(s: State, t: Turn): boolean {
  if (s.tankyuUnlocked || t.kind !== 'sem') return false;
  return t.sems.includes(labOf(s.profile).sem);
}

export function labPending(s: State, rng: Rng): Pending {
  const pool = [...THEMES[faculty(s.profile.faculty).themes]];
  const picks: typeof pool = [];
  // 偏愛と合うテーマがあれば1枚は入れる
  const match = pool.filter((x) => x.passions.includes(s.profile.passion));
  if (match.length) picks.push(rng.pick(match));
  while (picks.length < Math.min(3, pool.length)) {
    const rest = pool.filter((x) => !picks.includes(x));
    picks.push(rng.pick(rest));
  }
  rng.next(); // カードの並びを入れ替える分
  const options: SynthChoice[] = picks
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((x) => ({
      label: x.name,
      sub: x.industry,
      badge: x.passions.includes(s.profile.passion) ? '偏愛にぴったり' : undefined,
      result: `${x.name}の研究が始まる。`,
      action: { type: 'theme', theme: x.id },
    }));
  return { eventId: 'lab', variant: 'theme', options };
}

export const labText = (s: State) => `${labOf(s.profile).kind}配属の季節。\n研究テーマカードを1枚選ぼう。`;
export const labTag = (s: State) => `${labOf(s.profile).kind}配属`;

export const passionMatch = (s: State): boolean => {
  const theme = typeof s.flags.theme === 'string' ? themeById(s.flags.theme) : undefined;
  return !!theme?.passions.includes(s.profile.passion);
};

export function unlockTankyu(s: State, themeId: string) {
  s.flags.theme = themeId;
  s.flags.unlockTurn = s.turnIndex;
  s.tankyuUnlocked = true;
  s.stats.tankyu = BALANCE.tankyu.start + (passionMatch(s) ? BALANCE.tankyu.passionBonus : 0);
}

/** ターンの始まりに探究が伸びる（偏愛と合うと伸びやすい） */
export function growTankyu(s: State) {
  if (!s.tankyuUnlocked || s.flags.unlockTurn === s.turnIndex) return {};
  return applyEffect(s, { stats: { tankyu: BALANCE.tankyu.perTurn + (passionMatch(s) ? BALANCE.tankyu.passionPerTurn : 0) } });
}

// ── 研究の階段

const lastUndergrad = (s: State): number => {
  let last = -1;
  s.turns.forEach((t, i) => t.kind === 'sem' && (last = i));
  return last;
};

/** 次の段に1つ登れたら beat を返す。登れなければ null（否定しない。黙って次の機会へ） */
export function climb(s: State, rng: Rng): Beat | null {
  if (!s.tankyuUnlocked) return null;
  const next = s.ladder + 1;
  const step = LADDER[next];
  if (!step) return null;
  const t = s.turns[s.turnIndex];
  if (step.id === 'lab') {
    if (s.turnIndex <= Number(s.flags.unlockTurn)) return null;
  } else {
    const ok =
      step.when === 'undergrad' ? s.turnIndex === lastUndergrad(s) || t.kind === 'master' : step.when === 'master' ? t.kind === 'master' : t.kind === 'master' && t.year === 2;
    if (!ok || s.stats.tankyu < step.need) return null;
    if (step.chance && !rng.chance(stat(step.chance))) return null;
  }
  s.ladder = next;
  if (step.rare && step.chance) s.rareLog.push({ id: `ladder:${step.id}`, label: step.name, p: stat(step.chance), kind: 'game' });
  return { type: 'ladder', step: next, name: step.name, text: step.text };
}

// ── 学期末の判定

/** 留年は1回まで（MVP）。学部の最後のターンのあとに「5年目」を足す */
export function addRyunen(s: State): boolean {
  if (s.flags.ryunen) return false;
  s.flags.ryunen = 1;
  s.turns.splice(lastUndergrad(s) + 1, 0, extraTurn());
  return true;
}

export function judge(s: State): Beat | null {
  const t = s.turns[s.turnIndex];
  const notes: string[] = [];
  let barrier: { sem: number; passed: boolean } | undefined;
  let ryunen = false;

  if (s.stats.tani < BALANCE.failLine) {
    s.fails++;
    notes.push('いくつかの単位が、浮かなかった。');
  }
  const u = unit(s.profile.unit);
  if (isRegularSem(t)) {
    const sem = u.barriers?.find((b) => t.sems.includes(b));
    if (sem !== undefined) {
      // 工学部はセメスターバリアで判定する
      const passed = s.stats.tani >= BALANCE.barrierLine || !!s.flags.ryunen;
      barrier = { sem, passed };
      if (passed) notes.unshift(`${sem}セメスターバリア、突破！\n次のセメへ進める。`);
      else {
        ryunen = addRyunen(s);
        notes.unshift(`${sem}セメスターバリアを越えられなかった。\n研究室に進むのは、1年あとになる。`);
      }
    } else if (!u.barriers && t.sems.includes(8) && s.fails >= BALANCE.ryunenFails && s.stats.tani < BALANCE.ryunenTani) {
      ryunen = addRyunen(s);
      if (ryunen) notes.push('もう1年、とんぺー生をやることになった。\n5年目のキャンパスは、ちょっと違って見える。');
    }
  }
  if (ryunen) s.queue.push({ t: 'roadExtend', labels: ['5年目'], why: 'ryunen' });
  if (!notes.length) return null;
  return { type: 'judge', text: notes.join('\n'), deltas: {}, barrier };
}
