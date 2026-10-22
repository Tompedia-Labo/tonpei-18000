// 振り返り：ゲージの推移、在学期間の年表、統計との比較

import { comparison } from '../../core/ending';
import { semLabel } from '../../core/turns';
import type { StatKey } from '../../core/types';
import { SOURCES, STATS } from '../../data/stats';
import type { State } from '../../engine';
import { GAUGES } from '../components/gauges';
import { h } from '../dom';
import { pixelCanvas } from '../pixel/sprite';

const COLORS: Record<StatKey, string> = { tani: '#22b7ea', tsunagari: '#ff4f8b', saifu: '#ffbf1f', kokoro: '#6fcf3a', tankyu: '#7c4dff' };

/** ドットの折れ線（ゲージの推移） */
function sparkline(s: State): HTMLCanvasElement {
  const pts = [...s.history.map((x) => x.stats), s.stats];
  const W = 120;
  const H = 44;
  const [c, ctx] = pixelCanvas(W, H, 'px spark');
  ctx.fillStyle = '#fff6e6';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ecd9b6';
  for (let y = 4; y < H; y += 10) for (let x = 0; x < W; x += 2) ctx.fillRect(x, y, 1, 1);
  const keys = GAUGES.map((g) => g.key).filter((k) => k !== 'tankyu' || s.tankyuUnlocked);
  for (const k of keys) {
    ctx.fillStyle = COLORS[k];
    for (let i = 0; i < pts.length - 1; i++) {
      const x0 = 2 + (i / (pts.length - 1)) * (W - 4);
      const x1 = 2 + ((i + 1) / (pts.length - 1)) * (W - 4);
      const y0 = H - 3 - (pts[i][k] / 100) * (H - 6);
      const y1 = H - 3 - (pts[i + 1][k] / 100) * (H - 6);
      const n = Math.max(1, Math.round(x1 - x0));
      for (let j = 0; j <= n; j++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * j) / n), Math.round(y0 + ((y1 - y0) * j) / n), 1, 1);
    }
  }
  return c;
}

export function reviewScreen(s: State, onNext: () => void): HTMLElement {
  const cmp = comparison(s);
  const src = cmp ? SOURCES[STATS[cmp.source].source] : null;
  const keys = GAUGES.filter((g) => g.key !== 'tankyu' || s.tankyuUnlocked);
  return h(
    'main',
    { class: 'screen review' },
    h('h2', { class: 'ribbon' }, 'ふりかえり'),
    h(
      'section',
      { class: 'win drop review-graph' },
      h('p', { class: 'section-title' }, 'ゲージの推移'),
      sparkline(s),
      h('p', { class: 'legend' }, ...keys.map((g) => h('span', { style: `--c:${COLORS[g.key]}` }, g.name))),
    ),
    h(
      'section',
      { class: 'win drop review-timeline' },
      h('p', { class: 'section-title' }, '在学期間の年表'),
      h(
        'ol',
        { class: 'timeline' },
        ...s.history.map((x, i) =>
          h('li', { style: `animation-delay:${i * 70}ms` }, h('span', { class: 'tl-sem' }, semLabel(x.turn)), h('span', { class: 'tl-dot', 'aria-hidden': 'true' }), h('span', { class: 'tl-text' }, x.highlight ?? 'いつもの毎日')),
        ),
      ),
    ),
    cmp
      ? h(
          'section',
          { class: 'win drop compare' },
          h('p', { class: 'section-title' }, '統計とくらべる'),
          h('p', { class: 'compare-fact' }, cmp.fact),
          h(
            'div',
            { class: 'compare-bar' },
            h('span', { class: 'meter', 'aria-hidden': 'true' }, h('i', { style: `width:${cmp.p * 100}%` })),
            h('span', { class: 'note' }, `${cmp.label}：${(cmp.p * 100).toFixed(1)}%`),
          ),
          h('p', { class: 'compare-you' }, cmp.you),
          src?.url ? h('a', { class: 'note', href: src.url, target: '_blank', rel: 'noopener' }, `出典：${src.title}`) : null,
        )
      : null,
    h('button', { class: 'btn primary big', type: 'button', onclick: onNext }, h('span', { class: 'cursor', 'aria-hidden': 'true' }), '結果を見る'),
  );
}
