// 称号図鑑。手に入れた称号は名前と説明、まだのものは「？？？」

import { TITLES } from '../../data/endings';
import { h } from '../dom';
import { icon } from '../pixel/icons';
import { saved } from '../storage';

export function dexScreen(onBack: () => void): HTMLElement {
  const got = new Set(saved().titles);
  const count = TITLES.filter((t) => got.has(t.id)).length;
  return h(
    'main',
    { class: 'screen dex' },
    h('h2', { class: 'ribbon' }, '称号図鑑'),
    h('p', { class: 'dex-count pixel' }, `${count} / ${TITLES.length}`, h('span', { class: 'meter', 'aria-hidden': 'true' }, h('i', { style: `width:${(count / TITLES.length) * 100}%` }))),
    h(
      'ol',
      { class: 'dex-list' },
      ...TITLES.map((t, i) =>
        got.has(t.id)
          ? h('li', { class: 'plate dex-item got' }, h('span', { class: 'dex-no pixel' }, String(i + 1).padStart(2, '0')), icon('star'), h('span', { class: 'dex-body' }, h('b', {}, t.name), h('span', {}, t.desc)))
          : h('li', { class: 'plate dex-item' }, h('span', { class: 'dex-no pixel' }, String(i + 1).padStart(2, '0')), icon('lock'), h('span', { class: 'dex-body' }, h('b', {}, '？？？'), h('span', {}, 'まだ出会っていない称号'))),
      ),
    ),
    h('button', { class: 'btn primary big', type: 'button', onclick: onBack }, h('span', { class: 'cursor', 'aria-hidden': 'true' }), 'もどる'),
  );
}
