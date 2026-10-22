// レア度「約N人に1人」。N = 1 / (p学部 × p住まい × p進路 × Π rare)。
// ゲーム用の概算で、出来事は互いに独立と仮定する。家計は掛けない。

import { optionName, HOUSING } from '../data/gacha';
import { stat } from '../data/stats';
import { faculty } from '../data/structure';
import { pathInfo } from './ending';
import { housingProbability } from './profile';
import type { RareEntry, State } from './types';

export type Tier = 'many' | 'none' | 'legend';

export type Rarity = {
  n: number;
  tier: Tier;
  /** 在学生の中に同じ学生生活の人が何人いる計算か（tier が many のときだけ意味がある） */
  same: number;
  factors: RareEntry[];
  /** あなたを珍しくした出来事（上位3件） */
  top: RareEntry[];
  hasGameProbability: boolean;
};

export const LEGEND_N = 1_000_000;

export function computeRarity(s: State): Rarity {
  const p = s.profile;
  const f = faculty(p.faculty);
  const path = pathInfo(s);
  const base: RareEntry[] = [
    { id: 'faculty', label: f.name, p: stat(f.capacity) / stat('capacity.total'), kind: 'real' },
    { id: 'housing', label: optionName(HOUSING, p.housing), p: housingProbability(p.housing), kind: 'game' },
    { id: 'path', label: path.label, p: path.p, kind: 'real' },
  ];
  const factors = [...base, ...s.rareLog];
  const product = factors.reduce((a, x) => a * Math.max(x.p, 1e-9), 1);
  const n = Math.max(1, Math.round(1 / product));
  const enrolled = stat('enrolled.total');
  const tier: Tier = n <= enrolled ? 'many' : n <= LEGEND_N ? 'none' : 'legend';
  // 学部と住まいは「出来事」ではないので上位3件に入れない
  const top = [base[2], ...s.rareLog].sort((a, b) => a.p - b.p).slice(0, 3);
  return {
    n,
    tier,
    same: Math.max(1, Math.round(enrolled / n)),
    factors,
    top,
    hasGameProbability: factors.some((x) => x.kind === 'game'),
  };
}
