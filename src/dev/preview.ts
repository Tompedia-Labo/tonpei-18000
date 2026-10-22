// 開発用：キャラとシーンを一覧で描く（npm run dev のあと /preview.html）

import { baseLook, characterCanvas, type Look } from '../ui/pixel/character';
import { SCENE_KEYS, SceneView, type Season } from '../ui/pixel/scenes';

const out = document.getElementById('out')!;
const row = (title: string) => {
  const h = document.createElement('h3');
  h.textContent = title;
  const r = document.createElement('div');
  r.className = 'row';
  out.append(h, r);
  return r;
};
const fig = (el: HTMLElement, label: string) => {
  const f = document.createElement('figure');
  const c = document.createElement('figcaption');
  c.textContent = label;
  f.append(el, c);
  return f;
};

const looks = row('キャラ（シードごと）');
for (let seed = 1; seed <= 8; seed++) looks.append(fig(characterCanvas(baseLook(seed), 4), `seed ${seed}`));

const poses = row('服装・表情・持ち物');
const variants: [string, Partial<Look>][] = [
  ['normal', {}],
  ['happy', { expr: 'happy' }],
  ['sleepy', { expr: 'sleepy' }],
  ['labcoat', { outfit: 'labcoat' }],
  ['suit+case', { outfit: 'suit', prop: 'briefcase', expr: 'proud' }],
  ['doctor', { outfit: 'labcoat', cheer: true, expr: 'proud' }],
  ['kokushi', { outfit: 'labcoat', stethoscope: true, cheer: true, expr: 'proud' }],
  ['startup', { prop: 'laptop', cheer: true, expr: 'proud' }],
  ['ryugaku', { prop: 'suitcase' }],
  ['dropout', { prop: 'backpack', cheer: true, expr: 'proud' }],
];
for (const [label, v] of variants) poses.append(fig(characterCanvas({ ...baseLook(3), ...v }, 4), label));

for (const season of ['spring', 'summer', 'autumn', 'winter'] as Season[]) {
  const r = row(`シーン（${season}）`);
  for (const key of SCENE_KEYS) {
    const v = new SceneView(key, { season, seed: 5, look: baseLook(5) });
    v.canvas.style.width = '288px';
    r.append(fig(v.canvas, key));
  }
}
