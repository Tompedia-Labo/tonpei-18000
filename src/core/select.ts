import { BALANCE } from '../data/balance';
import { EVENTS } from '../data/events';
import { stat } from '../data/stats';
import type { Rng } from '../rng';
import type { GameEvent, State, Turn } from './types';

export function matches(ev: GameEvent, s: State, t: Turn): boolean {
  const w = ev.when;
  const p = s.profile;
  // 卒業式・修了式は、在学のターンがすべて終わったあとだけ
  if (!!w.final !== !!s.flags.final) return false;
  if (w.sem &&!(t.kind === 'sem' && t.sems.some((x) => w.sem!.includes(x)))) return false;
  if (w.master && !(t.kind === 'master' && w.master.includes(t.year))) return false;
  if (w.extra !== undefined && (t.kind === 'sem' && !!t.extra) !== w.extra) return false;
  if (w.entry && !w.entry.includes(p.entry)) return false;
  if (w.faculty && !w.faculty.includes(p.faculty)) return false;
  // 未分属の期間は学科・コース条件のイベントを出さない
  if (w.dept && !(p.dept && w.dept.includes(p.dept))) return false;
  if (w.course && !(p.course && w.course.includes(p.course))) return false;
  // 飲酒は20歳以上の場面だけ（書き忘れても engine で守る）
  if (ev.tags?.includes('drinking') && s.age < BALANCE.drinkingAge) return false;
  // 固定・選択は既定で1回きり。ランダムは once を書いたときだけ
  if ((ev.once ?? ev.kind !== 'random') && s.seen.includes(ev.id)) return false;
  if (ev.cond && !ev.cond(s)) return false;
  return true;
}

export const specificity = (ev: GameEvent): number => {
  const w = ev.when;
  if (w.course) return BALANCE.specificity.course;
  if (w.dept) return BALANCE.specificity.dept;
  if (w.faculty) return BALANCE.specificity.faculty;
  return 1;
};

const isSpecific = (ev: GameEvent) => specificity(ev) > 1;

export const candidates = (s: State, t: Turn, kind: GameEvent['kind']): GameEvent[] =>
  EVENTS.filter((ev) => ev.kind === kind && matches(ev, s, t));

/** 同じ出来事が続かないよう、直近に見たものは軽くする */
const weightOf = (ev: GameEvent, s: State) => {
  const recent = s.seen.slice(-6).includes(ev.id) ? 0.25 : 1;
  return (ev.weight ?? 1) * specificity(ev) * recent;
};

/** ランダムイベントを n 本引く。固有イベントがあれば少なくとも1本は入れる。確率イベントは発生判定も行う */
export function drawRandom(s: State, t: Turn, n: number, rng: Rng): GameEvent[] {
  let pool = candidates(s, t, 'random');
  const out: GameEvent[] = [];
  const take = (list: GameEvent[]): boolean => {
    while (list.length) {
      const ev = rng.weighted(list, (e) => weightOf(e, s));
      pool = pool.filter((e) => e !== ev);
      list = list.filter((e) => e !== ev);
      if (ev.prob === undefined || rng.chance(stat(ev.prob))) {
        out.push(ev);
        return true;
      }
    }
    return false;
  };
  take(pool.filter(isSpecific));
  while (out.length < n && pool.length) take(pool);
  return out;
}

/** 選択イベントを1本引く。こころが下がっていたら立て直しイベントを優先する */
export function drawChoice(s: State, t: Turn, rng: Rng, opts: { rescue: boolean; priorityOnly: boolean }): GameEvent | null {
  const all = candidates(s, t, 'choice');
  const priority = all.filter((e) => e.priority);
  if (priority.length) return rng.pick(priority);
  const rescue = all.filter((e) => e.rescue);
  if (opts.rescue && rescue.length) return rng.pick(rescue);
  if (opts.priorityOnly) return null;
  // 選択は固有イベントを必ず出すのではなく、重みで寄せるだけにする（新歓や夏休みを取りこぼさないため）
  let list = all.filter((e) => !e.rescue);
  while (list.length) {
    const ev = rng.weighted(list, (e) => weightOf(e, s));
    if (ev.prob === undefined || rng.chance(stat(ev.prob))) return ev;
    list = list.filter((e) => e !== ev);
  }
  return null;
}
