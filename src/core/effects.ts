import { BALANCE } from '../data/balance';
import type { Deltas, Effect, State, StatKey } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** 効果を適用し、実際に動いた量を返す。こころは下限より下げない */
export function applyEffect(s: State, e: Effect | undefined): Deltas {
  const deltas: Deltas = {};
  if (!e) return deltas;
  for (const [k, d] of Object.entries(e.stats ?? {}) as [StatKey, number][]) {
    if (k === 'tankyu' && !s.tankyuUnlocked) continue;
    const lo = k === 'kokoro' ? BALANCE.kokoroFloor : 0;
    const before = s.stats[k];
    s.stats[k] = clamp(before + d, lo, 100);
    if (s.stats[k] !== before) deltas[k] = s.stats[k] - before;
  }
  for (const [k, v] of Object.entries(e.flags ?? {})) s.flags[k] = v;
  return deltas;
}
