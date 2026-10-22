// おまかせで1周を最後まで回す（テストとシミュレーション用）

import { advance, autoChoice, choose, createGame } from '../engine';
import type { Beat, State } from './types';

export function autoplay(seed: number, maxBeats = 500): { state: State; beats: Beat[] } {
  let state = createGame(seed);
  const beats: Beat[] = [];
  for (let i = 0; i < maxBeats; i++) {
    const r = state.pending ? choose(state, autoChoice(state)) : advance(state);
    state = r.state;
    beats.push(r.beat);
    if (r.beat.type === 'end') return { state, beats };
  }
  throw new Error(`seed ${seed}: game did not finish in ${maxBeats} beats`);
}
