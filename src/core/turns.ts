import { faculty, unit } from '../data/structure';
import type { Campus, Profile, State, Turn } from './types';

export const yearsOf = (p: Profile): 4 | 6 => unit(p.unit).years ?? 4;

/** 学部8ターン。6年制は9〜10セメと11〜12セメを1ターンずつに圧縮 */
export function planTurns(p: Profile): Turn[] {
  const turns: Turn[] = [];
  for (let sem = 1; sem <= 8; sem++) turns.push({ kind: 'sem', sems: [sem] });
  if (yearsOf(p) === 6) {
    turns.push({ kind: 'sem', sems: [9, 10] });
    turns.push({ kind: 'sem', sems: [11, 12] });
  }
  return turns;
}

export const masterTurns = (): Turn[] => [
  { kind: 'master', year: 1 },
  { kind: 'master', year: 2 },
];

export const extraTurn = (): Turn => ({ kind: 'sem', sems: [9, 10], extra: true });

export function semLabel(t: Turn): string {
  if (t.kind === 'master') return `修士${t.year}年`;
  if (t.extra) return '5年目';
  return t.sems.length > 1 ? `${t.sems[0]}〜${t.sems[t.sems.length - 1]}セメ` : `${t.sems[0]}セメ`;
}

/** 「工学部1年 1セメ」 */
export function turnLabel(t: Turn, p: Profile): string {
  if (t.kind === 'master') return `修士${t.year}年`;
  const f = faculty(p.faculty);
  if (t.extra) return `${f.name}5年目`;
  const year = Math.ceil(t.sems[0] / 2);
  return `${f.name}${year}年 ${semLabel(t)}`;
}

/** 学年の始まりのターンか（年齢を1つ足す） */
export const startsYear = (t: Turn): boolean => t.kind === 'master' || t.sems[0] % 2 === 1;

export function campusAt(s: State, t: Turn): Campus {
  const f = faculty(s.profile.faculty);
  // 修士は学部の最後のキャンパスで研究を続ける（要確認）
  const sem = t.kind === 'master' ? 99 : t.sems[0];
  let c = f.campus[0].campus;
  for (const x of f.campus) if (sem >= x.from) c = x.campus;
  return c;
}

export const currentTurn = (s: State): Turn | null => s.turns[s.turnIndex] ?? null;
