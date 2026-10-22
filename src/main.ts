// 画面遷移：タイトル→ガチャ→ターン→振り返り→間→結果

import './style.css';
import { createGame, type State } from './engine';
import { newPlayId, sendPlay } from './ui/api';
import { footer } from './ui/components/footer';
import { dexScreen } from './ui/screens/dex';
import { gachaScreen } from './ui/screens/gacha';
import { interlude } from './ui/screens/interlude';
import { playScreen } from './ui/screens/play';
import { resultScreen } from './ui/screens/result';
import { reviewScreen } from './ui/screens/review';
import { titleScreen } from './ui/screens/title';
import { countPlay } from './ui/storage';

const app = document.getElementById('app')!;
let dispose: (() => void) | null = null;

type Screen = HTMLElement | { el: HTMLElement; dispose(): void };

function render(screen: Screen, opts: Parameters<typeof footer>[0] = {}) {
  dispose?.();
  const el = screen instanceof HTMLElement ? screen : screen.el;
  dispose = screen instanceof HTMLElement ? null : screen.dispose;
  app.replaceChildren(el, footer(opts));
  window.scrollTo(0, 0);
}

/** ?seed=123 で同じ入学ガチャを再現できる（開発用） */
const seedFromUrl = () => {
  const v = new URLSearchParams(location.search).get('seed');
  return v && /^\d+$/.test(v) ? Number(v) : null;
};

function title() {
  render(titleScreen(start, () => dex(title)), { full: true, screen: 'タイトル' });
}

function dex(back: () => void) {
  render(dexScreen(back));
}

function start() {
  const state = createGame(seedFromUrl() ?? (Math.random() * 2 ** 32) >>> 0);
  const playId = newPlayId();
  countPlay();
  render(gachaScreen(state, () => play(state, playId)));
}

function play(state: State, playId: string) {
  let started = false;
  render(
    playScreen(state, (end) => finish(end, playId), {
      onCampus: (c) => {
        sendPlay(started ? 'campus' : 'start', playId, c);
        started = true;
      },
    }),
  );
}

function finish(state: State, playId: string) {
  sendPlay('finish', playId);
  render(
    reviewScreen(state, () => {
      const showResult = () => render(resultScreen(state, title, () => dex(showResult)), { full: true, help: true, screen: '結果' });
      const pause = interlude(state, () => {
        pause.el.remove();
        showResult();
      });
      document.body.append(pause.el);
    }),
  );
}

title();
