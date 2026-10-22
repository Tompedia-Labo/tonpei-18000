// 結果。スケッチ：「あなたのとんぺー生活は」→大きな分数とキャラ→称号→説明→シェア。レア度で演出を変える

import { DATA_NOTICE } from '../../config';
import { LADDER } from '../../data/research';
import { SOURCES, stat } from '../../data/stats';
import { ladderCanvas } from '../pixel/ladder';
import { result, type State } from '../../engine';
import { h } from '../dom';
import { credit } from '../components/credit';
import { TITLES } from '../../data/endings';
import { confetti, countUp, flash, typewriter } from '../fx';
import { addTitle, saved } from '../storage';
import { characterCanvas, resultLook } from '../pixel/character';
import { icon } from '../pixel/icons';
import { copyText, prepareCard, saveImage, shareInstagram, shareX } from '../share/shareActions';

const fmt = (n: number) => n.toLocaleString('ja-JP');
const pct = (p: number) => `約${p >= 0.1 ? Math.round(p * 100) : p >= 0.01 ? (p * 100).toFixed(1) : (p * 100).toFixed(2)}%`;

export function resultScreen(s: State, onRetry: () => void, onDex: () => void): { el: HTMLElement; dispose(): void } {
  const r = result(s);
  const look = resultLook(s);
  const enrolled = stat('enrolled.total');
  const man = (enrolled / 1e4).toFixed(1);
  const note =
    r.rarity.tier === 'many'
      ? `在学生${man}万人の中に、同じ学生生活の人が約${fmt(r.rarity.same)}人いる計算`
      : r.rarity.tier === 'none'
        ? `在学生${man}万人の中に、あなたと同じ学生生活の人はいない計算`
        : '東北大の長い歴史でもほとんど見かけない学生生活';

  const card = { n: r.rarity.n, title: r.title, path: r.path, attributes: r.attributes, research: r.research, look };
  prepareCard(card);

  const num = h('span', {}, '1');
  const hero = h(
    'div',
    { class: 'result-hero' },
    h(
      'p',
      { class: 'fraction', 'aria-label': `約${fmt(r.rarity.n)}人に1人` },
      h('span', { class: 'fraction-top', 'aria-hidden': 'true' }, '1'),
      h('span', { class: 'fraction-bar', 'aria-hidden': 'true' }),
      h('span', { class: 'fraction-bottom', 'aria-hidden': 'true' }, num, h('small', {}, '人')),
    ),
    characterCanvas(look, 6),
  );

  // 桁が多いと幅に入らないので、桁数（＋「人」）で文字の大きさの上限を決める（style.css）
  hero.style.setProperty('--chars', String(fmt(r.rarity.n).length + 1));

  const isNew = addTitle(r.titleId);
  const got = saved().titles.length;

  const resultCard = h(
    'section',
    { class: 'win result-card drop' },
    h('p', { class: 'result-lead' }, 'あなたのとんぺー生活は'),
    hero,
    h('p', { class: 'result-note' }, note),
    h(
      'div',
      { class: 'title-plate' },
      h('small', {}, '称号', isNew ? h('span', { class: 'new-badge' }, 'NEW!') : null),
      h('p', { class: 'title-name' }, r.title),
    ),
    h('p', { class: 'result-desc' }, r.titleDesc),
    h('span', { class: 'result-path' }, r.path),
  );

  const future = h('p', { class: 'future-text' });
  const tenYears = h(
    'section',
    { class: 'win drop future' },
    h('p', { class: 'section-title' }, icon('star'), ' 10年後のあなた'),
    future,
    h('p', { class: 'note' }, '※10年後の一文はフィクションです。'),
  );

  const share = h(
    'section',
    { class: 'share', 'aria-label': 'シェア' },
    h('button', { class: 'btn primary', type: 'button', onclick: () => saveImage(card) }, '画像を保存'),
    h('button', { class: 'btn', type: 'button', onclick: () => shareX(r.share) }, 'Xで共有'),
    h('button', { class: 'btn', type: 'button', onclick: () => shareInstagram(card, r.share) }, 'Instagram'),
    h('button', { class: 'btn', type: 'button', onclick: () => copyText(r.share) }, '文章をコピー'),
  );

  const rare = h(
    'section',
    { class: 'win drop' },
    h('p', { class: 'section-title' }, icon('star'), ' あなたを珍しくした出来事'),
    h(
      'ol',
      { class: 'rare-list' },
      ...r.rarity.top.map((x, i) =>
        h(
          'li',
          {},
          h('span', { class: 'rare-rank' }, String(i + 1)),
          h('span', { class: 'rare-label' }, x.label, x.kind === 'game' ? h('span', { class: 'note' }, '（ゲーム内確率）') : null),
          h('span', { class: 'rare-p' }, pct(x.p)),
          h('span', { class: 'meter', 'aria-hidden': 'true' }, h('i', { style: `width:${Math.max(2, x.p * 100)}%` })),
        ),
      ),
    ),
    h('p', { class: 'note', style: 'margin-top:10px' }, 'ゲーム用の概算です。出来事は互いに独立と仮定し、学部・住まい・進路・珍しい出来事の確率を掛け合わせています。「ゲーム内確率」は実データではありません。'),
    h(
      'p',
      { class: 'note' },
      '出典：',
      ...(['keinetCareer', 'yokoku2027', 'life2025'] as const).flatMap((k, i) => [i ? '、' : '', h('a', { href: SOURCES[k].url, target: '_blank', rel: 'noopener' }, SOURCES[k].title)]),
      `。${DATA_NOTICE}`,
    ),
  );

  // 研究の階段：届かなかった段も否定しない
  const top = s.ladder >= LADDER.length - 1;
  const research = r.research
    ? h(
        'section',
        { class: 'win drop moment-static' },
        h('p', { class: 'section-title' }, icon('tankyu'), ' 研究の階段'),
        h('p', { class: 'research-theme' }, `テーマ：${r.research.split('／')[0]}`),
        ladderCanvas(s.ladder, look),
        h('ol', { class: 'ladder-steps' }, ...LADDER.map((x, i) => h('li', { class: i < s.ladder ? 'done' : i === s.ladder ? 'now' : '' }, x.name))),
        h('p', { class: 'moment-text' }, top ? 'あなたのデータは、きっと誰かの次の一歩になる。' : 'この研究は、次の誰かが引き継ぐ。'),
      )
    : null;

  const el = h(
    'main',
    { class: `screen result tier-${r.rarity.tier}` },
    resultCard,
    share,
    tenYears,
    rare,
    research,
    credit('full'),
    h(
      'div',
      { class: 'choices' },
      h('button', { class: 'btn primary big', type: 'button', onclick: onRetry }, h('span', { class: 'cursor', 'aria-hidden': 'true' }), 'もう一度入学する'),
      h('button', { class: 'btn', type: 'button', onclick: onDex }, `称号図鑑 ${got}/${TITLES.length}`),
    ),
  );

  // 数え上げてから、レア度に合わせた演出
  let alive = true;
  requestAnimationFrame(() =>
    countUp(num, r.rarity.n, fmt, () => {
      if (!alive) return;
      typewriter(future, r.tenYears, { speed: 45 });
      if (r.rarity.tier === 'legend') {
        flash();
        el.classList.add('shake');
        confetti(resultCard, { count: 140, stars: true, duration: 4200 });
      } else if (r.rarity.tier === 'none') confetti(resultCard, { count: 80, duration: 3200 });
      else confetti(resultCard, { count: 26, stars: true, duration: 2200 });
    }),
  );

  return { el, dispose: () => (alive = false) };
}
