// 「あなたのとんぺー生活は…」の間。各セメのシーンが記憶のように明滅する。タップで飛ばせる

import type { State } from '../../engine';
import { h } from '../dom';
import { reducedMotion, typewriter } from '../fx';
import { lookFor } from '../pixel/character';
import { makeScene } from '../sceneFor';

export function interlude(s: State, onDone: () => void): { el: HTMLElement; dispose(): void } {
  const look = lookFor(s);
  const memories = s.history.slice(-9).map((x, i) => {
    const c = makeScene(s, x.scene, { turn: x.turn, look }).canvas;
    c.style.animationDelay = `${(i * 2200) / 9}ms`;
    return c;
  });
  const text = h('p', { class: 'interlude-text' });
  const el = h('div', { class: 'interlude', role: 'dialog', 'aria-label': '集計中' }, h('div', { class: 'memories', 'aria-hidden': 'true' }, ...memories), text);
  typewriter(text, 'あなたのとんぺー生活は…', { speed: 90 });
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    onDone();
  };
  const timer = window.setTimeout(done, reducedMotion() ? 900 : 2900);
  el.addEventListener('click', done);
  return { el, dispose: () => clearTimeout(timer) };
}
