// タイトル（LP）。スケッチ：仙台の地図→タイトル→軽い説明→カウンター→入学する

import { BETA, INSPIRED_BY } from '../../config';
import type { Campus } from '../../core/types';
import { stat } from '../../data/stats';
import { CAMPUS_NAME } from '../../data/structure';
import { fetchStats, type PlayStats } from '../api';
import { credit } from '../components/credit';
import { h } from '../dom';
import { countUp } from '../fx';
import { CAMPUS_POS, MAP_H, MAP_W, mapView } from '../pixel/map';
import { saved } from '../storage';
import { TITLES } from '../../data/endings';

const POLL = 15000;
const fmt = (n: number) => n.toLocaleString('ja-JP');

export function titleScreen(onStart: () => void, onDex: () => void): { el: HTMLElement; dispose(): void } {
  const map = mapView();
  // ラベルが重ならないよう、青葉山と片平は建物の下に出す
  const BELOW: Campus[] = ['aobayama', 'katahira'];
  const labels = (Object.keys(CAMPUS_POS) as Campus[]).map((c) => {
    const count = h('small');
    const below = BELOW.includes(c);
    const top = ((CAMPUS_POS[c].y + (below ? 6 : -6)) / MAP_H) * 100;
    const el = h('span', { class: `map-label${below ? ' below' : ''}`, style: `left:${(CAMPUS_POS[c].x / MAP_W) * 100}%; top:${top}%` }, CAMPUS_NAME[c], count);
    return { c, el, count };
  });

  const enteredN = h('span', { class: 'counter-n' }, '0');
  const finishedN = h('span', { class: 'counter-n' }, '0');
  const note = h('p', { class: 'counter-note' });
  const learning = h('p', { class: 'map-learning' });
  const counters = h(
    'section',
    { class: 'counters', hidden: true, 'aria-label': 'プレイ数' },
    h('div', { class: 'plate counter' }, enteredN, h('span', { class: 'counter-label' }, 'このページを開いてから入学した人')),
    h('div', { class: 'plate counter' }, finishedN, h('span', { class: 'counter-label' }, 'このページを開いてから在学を終えた人')),
  );

  const kana = h('span', { class: 'logo-kana', 'aria-hidden': 'true' }, ...[...'とんぺー'].map((ch, i) => h('span', { style: `animation-delay:${i * 0.12}s` }, ch)));
  const start = h('button', { class: 'btn primary big', type: 'button', onclick: onStart }, h('span', { class: 'cursor', 'aria-hidden': 'true' }), '入学する');
  const { plays, titles } = saved();
  const dexBtn = h('button', { class: 'btn small', type: 'button', onclick: onDex }, `称号図鑑 ${titles.length}/${TITLES.length}`);

  const el = h(
    'main',
    { class: 'screen title' },
    h('section', { class: 'win drop map-win' }, h('div', { class: 'map-wrap' }, map.canvas, ...labels.map((l) => l.el)), learning, h('p', { class: 'map-caption' }, '地図はイメージです')),
    h(
      'h1',
      { class: 'logo' },
      h('span', { class: 'sr-only' }, `とんぺー1.8万分の１（${BETA}）`),
      h('span', { class: 'logo-top' }, kana, h('span', { class: 'beta-tag', 'aria-hidden': 'true' }, BETA)),
      h('span', { class: 'logo-num', 'aria-hidden': 'true' }, h('em', {}, '1.8万'), '分の１'),
    ),
    h('p', { class: 'lead' }, `東北大の在学生は約${fmt(stat('enrolled.total'))}人。`, h('br'), '入学ガチャを引いて、在学の終わりまでを3〜6分で生きてみよう。'),
    counters,
    note,
    h('div', { class: 'title-actions' }, start, dexBtn, h('p', { class: 'title-meta' }, plays ? h('span', {}, `この端末で${plays}回入学`) : null, h('span', {}, INSPIRED_BY))),
    credit('mini'),
  );

  // カウンター：開いた時点からの増え分を出す
  let base: PlayStats | null = null;
  let shown = { entered: 0, finished: 0 };
  let timer = 0;
  const apply = (st: PlayStats | null) => {
    if (!st) return;
    counters.hidden = false;
    base ??= st;
    const d = { entered: st.entered - base.entered, finished: st.finished - base.finished };
    if (d.entered !== shown.entered) countUp(enteredN, d.entered || 0, fmt);
    if (d.finished !== shown.finished) countUp(finishedN, d.finished || 0, fmt);
    shown = d;
    note.textContent = `これまでに入学した人 ${fmt(st.entered)}人${st.mock ? '（開発用のダミー値）' : ''}`;
    const now: string[] = [];
    for (const l of labels) {
      const n = st.campus[l.c];
      l.count.textContent = n ? `${fmt(n)}人` : '';
      if (n) now.push(`${CAMPUS_NAME[l.c]}で${fmt(n)}人`);
    }
    learning.textContent = now.length ? `いま ${now.join('、')}が学んでいます` : '';
    map.setPeople(st.campus);
  };
  const poll = () => fetchStats().then(apply);
  poll();
  timer = window.setInterval(poll, POLL);
  map.start();

  return {
    el,
    dispose() {
      clearInterval(timer);
      map.stop();
    },
  };
}
