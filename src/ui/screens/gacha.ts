// 入学ガチャ。カードを1枚ずつめくり、合間に豆知識を出す。最後に自分のキャラが生まれる

import { DATA_NOTICE } from '../../config';
import { SOURCES, STATS } from '../../data/stats';
import { TRIVIA } from '../../data/trivia';
import { gachaCards, type State } from '../../engine';
import { h } from '../dom';
import { confetti } from '../fx';
import { baseLook, characterCanvas } from '../pixel/character';
import { icon } from '../pixel/icons';

const pct = (p: number) => (p >= 0.995 ? '100%' : `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`);
const RARE = 0.1;

export function gachaScreen(state: State, onDone: () => void): { el: HTMLElement; dispose(): void } {
  const cards = gachaCards(state.profile);
  let opened = 0;
  let triviaIdx = state.seed % TRIVIA.length;

  const cardEls = cards.map((c, i) => {
    const rare = c.p !== null && c.p < RARE;
    return h(
      'div',
      { class: `gcard${i === 0 ? ' next' : ''}`, role: 'listitem', 'aria-label': `${c.label}：まだめくっていない` },
      h('div', { class: 'gcard-face gcard-back', 'aria-hidden': 'true' }, '？', h('small', {}, c.label)),
      h(
        'div',
        { class: `gcard-face gcard-front${rare ? ' rare' : ''}` },
        h('span', { class: 'gcard-label' }, c.label),
        h('span', { class: 'gcard-value' }, c.value),
        c.p !== null
          ? h('span', { class: 'gcard-p' }, h('span', { class: 'meter', 'aria-hidden': 'true' }, h('i', { style: `width:${Math.max(3, c.p * 100)}%` })), `${c.basis ?? pct(c.p)}${c.basis ? `（${pct(c.p)}）` : ''}${c.provisional ? ' 仮置き' : ''}`)
          : h('span', { class: 'gcard-p' }, 'ゲーム用'),
      ),
    );
  });
  const grid = h('div', { class: 'gacha-grid', role: 'list' }, ...cardEls);

  // 統計は画面に出典を示す。仮置きは実データではないと書く
  const srcKeys = [...new Set(cards.flatMap((c) => (c.source ? [STATS[c.source].source] : [])))];
  const sources = h(
    'p',
    { class: 'note gacha-sources' },
    '出典：',
    ...srcKeys.flatMap((k, i) => [i ? '、' : '', h('a', { href: SOURCES[k].url, target: '_blank', rel: 'noopener' }, SOURCES[k].title)]),
    `。「仮置き」は実データが見つかるまでの仮の値です。${DATA_NOTICE}`,
  );

  const triviaText = h('p', { class: 'trivia-text' });
  const trivia = h('section', { class: 'win trivia', 'aria-live': 'polite' }, h('span', { class: 'trivia-tag' }, '豆知識'), triviaText);
  const showTrivia = () => {
    const t = TRIVIA[triviaIdx++ % TRIVIA.length];
    const src = t.source ? SOURCES[t.source] : null;
    triviaText.replaceChildren(t.text, src?.url ? h('a', { href: src.url, target: '_blank', rel: 'noopener', class: 'note' }, ` 出典：${src.title}`) : '');
  };
  showTrivia();

  const flipBtn = h('button', { class: 'btn primary big', type: 'button' }, h('span', { class: 'cursor', 'aria-hidden': 'true' }), 'めくる');
  const allBtn = h('button', { class: 'btn small', type: 'button' }, 'ぜんぶめくる');
  const actions = h('div', { class: 'choices' }, flipBtn, h('div', { class: 'tools' }, allBtn));
  const el = h('main', { class: 'screen gacha' }, h('h2', { class: 'ribbon' }, '入学ガチャ'), grid, sources, trivia, actions);

  const flip = () => {
    if (opened >= cards.length) return;
    const card = cardEls[opened];
    const c = cards[opened];
    card.classList.remove('next');
    card.classList.add('open');
    card.setAttribute('aria-label', `${c.label}：${c.value}`);
    if (c.p !== null && c.p < RARE) setTimeout(() => confetti(card, { count: 24, stars: true, duration: 1400 }), 380);
    opened++;
    cardEls[opened]?.classList.add('next');
    if (opened % 2 === 0) showTrivia();
    if (opened >= cards.length) setTimeout(born, 450);
  };

  const born = () => {
    const chara = characterCanvas({ ...baseLook(state.seed), expr: 'happy' }, 6);
    const go = h('button', { class: 'btn primary big', type: 'button', onclick: onDone }, h('span', { class: 'cursor', 'aria-hidden': 'true' }), '1セメへ');
    const birth = h('section', { class: 'win birth drop' }, h('p', { class: 'section-title' }, icon('star'), ' あなたの東北大生活が始まる'), chara);
    trivia.replaceWith(birth);
    confetti(birth, { count: 40, duration: 2200 });
    actions.replaceChildren(go);
    go.focus({ preventScroll: true });
  };

  flipBtn.addEventListener('click', flip);
  allBtn.addEventListener('click', () => {
    const tick = () => {
      if (opened >= cards.length) return;
      flip();
      setTimeout(tick, 140);
    };
    tick();
  });
  const onKey = (e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      if (opened < cards.length) flip();
      else onDone();
    }
  };
  window.addEventListener('keydown', onKey);
  grid.addEventListener('click', flip);
  return { el, dispose: () => window.removeEventListener('keydown', onKey) };
}
