// ゲーム画面の頭：ドットキャラ＋「工学部1年 1セメ」＋ドットの道

import { semLabel } from '../../core/turns';
import type { Profile, State, Turn } from '../../core/types';
import { faculty } from '../../data/structure';
import { h } from '../dom';
import { characterCanvas, lookFor } from '../pixel/character';

export function phaseParts(t: Turn, p: Profile): { main: string; badge: string } {
  if (t.kind === 'master') return { main: '大学院', badge: semLabel(t) };
  const f = faculty(p.faculty);
  if (t.extra) return { main: f.name, badge: '5年目' };
  return { main: `${f.name}${Math.ceil(t.sems[0] / 2)}年`, badge: semLabel(t) };
}

export function hud() {
  const charaSlot = h('div');
  const main = h('span');
  const badge = h('span', { class: 'phase-sem' });
  const road = h('ol', { class: 'road', 'aria-label': '在学の道のり' });
  const el = h(
    'header',
    { class: 'hud drop' },
    h('div', { class: 'hud-row' }, charaSlot, h('div', { class: 'hud-text' }, h('p', { class: 'phase-faculty' }, main, badge), road)),
  );
  let lookKey = '';
  let roadCount = 0;
  return {
    el,
    update(s: State) {
      const look = lookFor(s);
      const key = JSON.stringify(look);
      if (key !== lookKey) {
        lookKey = key;
        charaSlot.replaceChildren(characterCanvas(look, 2));
      }
      const t = s.turns[s.turnIndex];
      if (t) {
        const p = phaseParts(t, s.profile);
        main.textContent = p.main;
        badge.textContent = p.badge;
      }
      road.replaceChildren(
        ...s.turns.map((turn, i) =>
          h('li', {
            class: [i < s.turnIndex ? 'past' : i === s.turnIndex ? 'now' : '', turn.kind === 'master' ? 'master' : '', roadCount && i >= roadCount ? 'new' : ''].filter(Boolean).join(' '),
            title: semLabel(turn),
            'aria-label': `${semLabel(turn)}${i === s.turnIndex ? '（いま）' : ''}`,
          }),
        ),
      );
      roadCount = s.turns.length;
    },
  };
}
