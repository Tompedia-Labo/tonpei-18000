// ステータスバー。単位・つながり・サイフ・こころ・探究（配属まで鍵つき）

import type { Deltas, StatKey, Stats } from '../../core/types';
import { h } from '../dom';
import { icon } from '../pixel/icons';

export const GAUGES: { key: StatKey; name: string }[] = [
  { key: 'tani', name: '単位' },
  { key: 'tsunagari', name: 'つながり' },
  { key: 'saifu', name: 'サイフ' },
  { key: 'kokoro', name: 'こころ' },
  { key: 'tankyu', name: '探究' },
];

export const gaugeName = (k: StatKey) => GAUGES.find((g) => g.key === k)!.name;

export type StatusBar = { el: HTMLElement; update(stats: Stats, unlocked: boolean, deltas?: Deltas): void };

export function statusBar(): StatusBar {
  const cells = GAUGES.map((g) => {
    const num = h('span', { class: 'stat-num' });
    const name = h('span', { class: 'stat-name' }, g.name);
    const ic = icon(g.key);
    const blocks = Array.from({ length: 10 }, () => h('i'));
    const cell = h('div', { class: 'stat', style: `--c: var(--c-${g.key})`, role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100 }, ic, num, name, h('span', { class: 'stat-bar' }, ...blocks));
    return { g, cell, num, name, ic, blocks };
  });
  const el = h('section', { class: 'plate status drop', 'aria-label': 'ステータス' }, ...cells.map((c) => c.cell));
  let first = true;
  return {
    el,
    update(stats, unlocked, deltas = {}) {
      for (const c of cells) {
        const locked = c.g.key === 'tankyu' && !unlocked;
        c.cell.classList.toggle('locked', locked);
        c.name.textContent = locked ? '？？？' : c.g.name;
        c.cell.setAttribute('aria-label', locked ? 'まだ解放されていないゲージ' : c.g.name);
        if (locked) {
          c.ic.replaceWith((c.ic = icon('lock')));
          c.num.textContent = '－';
          continue;
        }
        if (c.g.key === 'tankyu' && c.ic.dataset.k !== 'tankyu') {
          const ic = icon('tankyu');
          ic.dataset.k = 'tankyu';
          c.ic.replaceWith((c.ic = ic));
        }
        const v = stats[c.g.key];
        c.num.textContent = String(v);
        c.cell.setAttribute('aria-valuenow', String(v));
        const on = Math.round(v / 10);
        c.blocks.forEach((b, i) => b.classList.toggle('on', i < on));
        const d = first ? 0 : deltas[c.g.key];
        if (d) {
          const pop = h('span', { class: `stat-pop ${d > 0 ? 'up' : 'down'}`, 'aria-hidden': 'true' }, d > 0 ? `+${d}` : String(d));
          c.cell.append(pop);
          setTimeout(() => pop.remove(), 1200);
          if (d < 0) {
            c.cell.classList.remove('hit');
            void c.cell.offsetWidth;
            c.cell.classList.add('hit');
          }
        }
      }
      first = false;
    },
  };
}

/** 選択の結果などに添える「単位 +6」の小さな札 */
export function deltaChips(deltas: Deltas): HTMLElement | null {
  const entries = (Object.entries(deltas) as [StatKey, number][]).filter(([, v]) => v);
  if (!entries.length) return null;
  return h(
    'div',
    { class: 'chips' },
    ...entries.map(([k, v]) => h('span', { class: `chip ${v > 0 ? 'up' : 'down'}` }, icon(k), gaugeName(k), h('b', {}, v > 0 ? `+${v}` : String(v)))),
  );
}
