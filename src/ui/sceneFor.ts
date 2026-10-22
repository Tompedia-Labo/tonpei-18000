// イベントに合わせてシーンを選ぶ。scene が無ければ、いま通っているキャンパス

import { campusAt } from '../core/turns';
import type { State, Turn } from '../core/types';
import { lookFor, type Look } from './pixel/character';
import { SCENE_KEYS, SceneView, type SceneKey, type Season } from './pixel/scenes';

export function seasonFor(t: Turn | undefined, late = false): Season {
  if (!t || t.kind === 'master') return late ? 'autumn' : 'spring';
  const odd = t.sems[0] % 2 === 1;
  return odd ? (late ? 'summer' : 'spring') : late ? 'winter' : 'autumn';
}

export function seasonLabel(t: Turn): string {
  if (t.kind === 'master' || t.extra || t.sems.length > 1) return '';
  return t.sems[0] % 2 === 1 ? '春〜夏' : '秋〜冬';
}

export function sceneKeyFor(s: State, key: string | undefined | null, t = s.turns[s.turnIndex]): SceneKey {
  if (key && (SCENE_KEYS as string[]).includes(key)) return key as SceneKey;
  return t ? campusAt(s, t) : 'kawauchi';
}

export function makeScene(s: State, key: string | undefined | null, opts: { late?: boolean; look?: Look | null; turn?: Turn; season?: Season } = {}): SceneView {
  const t = opts.turn ?? s.turns[s.turnIndex];
  return new SceneView(sceneKeyFor(s, key, t), {
    season: opts.season ?? seasonFor(t, opts.late),
    seed: s.seed + s.turnIndex,
    look: opts.look === undefined ? lookFor(s) : opts.look,
  });
}
