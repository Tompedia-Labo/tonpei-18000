// ゲーム画面。スケッチの配置：HUD（キャラ・学年・道）→ステータスバー→イベント欄（本文＋絵）→選択肢

import { feedbackUrl } from '../../config';
import { campusAt, semLabel } from '../../core/turns';
import type { Campus, ShownChoice, ShownEvent } from '../../core/types';
import { LADDER } from '../../data/research';
import { STATS, SOURCES, type StatId } from '../../data/stats';
import { CAMPUS_NAME } from '../../data/structure';
import { advance, autoChoice, choose, type Beat, type State } from '../../engine';
import { deltaChips, statusBar } from '../components/gauges';
import { hud } from '../components/hud';
import { h } from '../dom';
import { confetti, typewriter, type Typing } from '../fx';
import { lookFor } from '../pixel/character';
import { icon } from '../pixel/icons';
import { ladderCanvas } from '../pixel/ladder';
import type { SceneView } from '../pixel/scenes';
import { makeScene, seasonLabel } from '../sceneFor';

export type PlayHooks = { onCampus?: (c: Campus) => void };

type WindowContent = Pick<ShownEvent, 'text' | 'statLine' | 'source' | 'caution' | 'scene' | 'image' | 'season'> & { id?: string };

export function playScreen(initial: State, onEnd: (s: State) => void, hooks: PlayHooks = {}): { el: HTMLElement; dispose(): void } {
  let s = initial;
  let fast = false;
  let timer = 0;
  let scene: SceneView | null = null;
  let typing: Typing | null = null;
  let primary: (() => void) | null = null;
  let campus: Campus | null = null;
  let chosenEl: HTMLElement | null = null;

  const top = hud();
  const status = statusBar();
  const stage = h('div', { class: 'stage' });
  const actions = h('div', { class: 'choices' });
  const fastBtn = h('button', { class: 'btn small', type: 'button', 'aria-pressed': 'false' }, '早送り ▶▶');
  fastBtn.addEventListener('click', () => {
    fast = !fast;
    fastBtn.setAttribute('aria-pressed', String(fast));
    if (fast) {
      typing?.finish();
      primary?.();
    }
  });
  // パソコンでは HUD とステータスを左の列、イベントと選択肢を右の列に置く
  const el = h('main', { class: 'screen play' }, h('div', { class: 'play-side' }, top.el, status.el), h('div', { class: 'play-main' }, stage, actions, h('div', { class: 'tools' }, fastBtn)));

  const setScene = (v: SceneView | null) => {
    scene?.stop();
    scene = v;
    v?.start();
  };

  const sceneBox = (key: string | undefined, image?: string, late = false, season?: ShownEvent['season']) => {
    const view = makeScene(s, key, { late, season });
    const box = h('div', { class: 'scene-box' });
    if (image) {
      const img = h('img', { src: image, alt: '' });
      img.addEventListener('error', () => {
        img.replaceWith(view.canvas);
        setScene(view);
      });
      box.append(img);
      setScene(null);
    } else {
      box.append(view.canvas);
      setScene(view);
    }
    return box;
  };

  const sourceLink = (id?: StatId) => {
    if (!id) return null;
    const src = SOURCES[STATS[id].source];
    return src.url ? h('a', { href: src.url, target: '_blank', rel: 'noopener' }, `出典：${src.title}`) : h('span', {}, src.title);
  };

  const statLine = (line?: string, source?: StatId) =>
    line ? h('p', { class: 'stat-line' }, h('span', { class: 'tag' }, '統計'), h('span', {}, line.replace(/^統計：/, ''), ' ', sourceLink(source))) : null;

  const tagChip = (tag?: string, kind = '') => (tag ? h('p', { class: `event-tag ${kind}` }, tag) : null);

  /** この場面の報告リンク。フォームにはイベントIDと時期だけを入れて開く */
  const reportLink = (eventId?: string) => {
    if (!eventId) return null;
    const t = s.turns[s.turnIndex];
    const when = t ? semLabel(t) : '在学の終わり';
    return h('a', { class: 'report-link', href: feedbackUrl({ screen: 'ゲーム中のイベント・選択肢', eventId, when }), target: '_blank', rel: 'noopener' }, 'この場面の間違いを報告');
  };

  /** 本文＋絵のウィンドウ。文字送りが終わると onReady */
  function eventWindow(e: WindowContent, onReady?: () => void, opts: { late?: boolean; tag?: string; tagKind?: string; cls?: string } = {}) {
    const text = h('p', { class: 'event-text' });
    const win = h(
      'section',
      { class: `win event drop typing ${opts.cls ?? ''}`, 'aria-live': 'polite' },
      tagChip(opts.tag, opts.tagKind),
      h('div', { class: 'event-main' }, text, sceneBox(e.scene, e.image, opts.late, e.season)),
      statLine(e.statLine, e.source),
      e.caution ? h('p', { class: 'caution' }, e.caution) : null,
      h('span', { class: 'next-mark', 'aria-hidden': 'true' }),
      // 選択の結果は next-mark の前に差し込まれるので、リンクはその後ろ（いちばん下）に置く
      reportLink(e.id),
    );
    typing = typewriter(text, e.text, { instant: fast });
    typing.done.then(() => {
      win.classList.remove('typing');
      onReady?.();
    });
    win.addEventListener('click', (ev) => {
      if ((ev.target as HTMLElement).closest('a')) return;
      if (typing?.typing()) typing.finish();
      else primary?.();
    });
    stage.replaceChildren(win);
    return win;
  }

  /** 絵のない、真ん中寄せの演出用ウィンドウ（解放・階段・道） */
  function stageWindow(cls: string, ...children: (Node | string | null)[]) {
    setScene(null);
    typing = null;
    const win = h('section', { class: `win drop moment ${cls}`, 'aria-live': 'polite' }, ...children, h('span', { class: 'next-mark', 'aria-hidden': 'true' }));
    win.addEventListener('click', (ev) => {
      if (!(ev.target as HTMLElement).closest('a')) primary?.();
    });
    stage.replaceChildren(win);
    return win;
  }

  function nextButton(label = '次へ', delay = 520) {
    const b = h('button', { class: 'btn primary', type: 'button' }, label, h('span', { class: 'cursor', 'aria-hidden': 'true' }));
    b.addEventListener('click', () => primary?.());
    actions.replaceChildren(b);
    primary = next;
    if (fast) timer = window.setTimeout(next, delay);
  }

  const choiceButton = (c: ShownChoice, i: number) =>
    h(
      'button',
      { class: 'btn choice', type: 'button', 'data-choice': i, onclick: () => pick(i) },
      h('span', { class: 'key', 'aria-hidden': 'true' }, String(i + 1)),
      h('span', { class: 'label' }, c.label),
      h('span', { class: 'cursor', 'aria-hidden': 'true' }),
    );

  /** 研究テーマカード。1枚ずつ表に返る */
  const themeCard = (c: ShownChoice, i: number) =>
    h(
      'button',
      { class: 'theme-card', type: 'button', 'data-choice': i, style: `animation-delay:${fast ? 0 : i * 160}ms`, onclick: () => pick(i) },
      h('span', { class: 'key', 'aria-hidden': 'true' }, String(i + 1)),
      h('span', { class: 'theme-body' }, h('span', { class: 'theme-name' }, c.label), c.sub ? h('span', { class: 'theme-sub' }, `進む先の例：${c.sub}`) : null),
      c.badge ? h('span', { class: 'theme-badge' }, icon('star'), c.badge) : null,
    );

  function show(beat: Beat) {
    clearTimeout(timer);
    primary = null;
    actions.replaceChildren();
    const deltas = beat.type === 'event' ? beat.event.deltas : beat.type === 'diary' ? sumDeltas(beat.lines) : 'deltas' in beat ? beat.deltas : {};
    top.update(s);
    status.update(s.stats, s.tankyuUnlocked, deltas);

    switch (beat.type) {
      case 'turnStart': {
        const now = campusAt(s, beat.turn);
        if (now !== campus) {
          campus = now;
          hooks.onCampus?.(now);
        }
        setScene(null);
        const sub = [seasonLabel(beat.turn), `${CAMPUS_NAME[now]}キャンパス`].filter(Boolean).join(' ・ ');
        const banner = h('section', { class: 'hud banner drop' }, h('div', {}, h('p', { class: 'banner-sem' }, top.el.querySelector('.phase-sem')!.textContent), h('p', { class: 'banner-sub' }, sub)));
        banner.addEventListener('click', () => primary?.());
        stage.replaceChildren(banner);
        primary = next;
        timer = window.setTimeout(next, fast ? 380 : 1400);
        return;
      }
      case 'event':
        eventWindow(beat.event, () => nextButton());
        return;
      case 'diary': {
        const win = stageWindow(
          'diary-win',
          h('p', { class: 'diary-head' }, icon('tani'), '日記'),
          h(
            'ul',
            { class: 'diary' },
            ...beat.lines.map((l, i) => h('li', { style: `animation-delay:${fast ? 0 : i * 280}ms` }, h('div', {}, h('p', { class: 'line-text' }, l.text), statLine(l.statLine, l.source), l.caution ? h('p', { class: 'caution' }, l.caution) : null, deltaChips(l.deltas)))),
          ),
          reportLink(beat.lines.map((l) => l.id).join(', ')),
        );
        win.classList.remove('moment');
        nextButton();
        return;
      }
      case 'choice': {
        const tagKind = beat.variant === 'rescue' ? 'calm' : beat.variant === 'theme' ? 'theme' : '';
        const tag = beat.tag ?? (beat.variant === 'rescue' ? 'ひと休み' : undefined);
        eventWindow(
          beat,
          () => {
            const omakase = h('button', { class: 'btn small', type: 'button', onclick: () => pick(autoChoice(s)) }, 'おまかせ');
            const items = beat.variant === 'theme' ? [h('div', { class: 'theme-cards' }, ...beat.choices.map(themeCard))] : beat.choices.map(choiceButton);
            actions.replaceChildren(...items, h('div', { class: 'tools' }, omakase));
            primary = null;
            if (fast) timer = window.setTimeout(() => pick(autoChoice(s)), 650);
          },
          { tag, tagKind, late: beat.variant === 'rescue', cls: beat.variant === 'rescue' ? 'calm' : '' },
        );
        return;
      }
      case 'choiceResult': {
        const box = h('div', { class: `result-text ${beat.tone ?? ''}` }, beat.tone === 'good' ? h('span', { class: 'result-star' }, icon('star')) : null, h('p', {}, ...brLines(beat.text)), deltaChips(beat.deltas));
        stage.querySelector('.event .next-mark')?.before(box);
        if (beat.tone === 'good') confetti(stage.querySelector('.event') as HTMLElement, { count: 30, stars: true, duration: 1600 });
        nextButton();
        if (chosenEl) actions.prepend(chosenEl);
        chosenEl = null;
        return;
      }
      case 'unlock': {
        // 鍵が揺れて外れ、探究ゲージが現れる
        const lock = icon('lock', 6);
        const flask = icon('tankyu', 6);
        flask.classList.add('unlock-flask');
        const win = stageWindow(
          'unlock',
          h('p', { class: 'event-tag theme' }, '探究ゲージ'),
          h('div', { class: 'unlock-icon', 'aria-hidden': 'true' }, lock, flask),
          h('p', { class: 'moment-title' }, ...brLines(beat.text)),
          h('p', { class: 'moment-value pixel' }, `探究 ${beat.value}`),
        );
        status.el.querySelector('.stat:last-child')?.classList.add('unlocking');
        setTimeout(() => confetti(win, { count: 60, stars: true, duration: 2600 }), fast ? 0 : 700);
        nextButton('研究を始める', 900);
        return;
      }
      case 'ladder': {
        const win = stageWindow(
          'ladder-win',
          h('p', { class: 'event-tag theme' }, '研究の階段'),
          ladderCanvas(beat.step, lookFor(s)),
          h('ol', { class: 'ladder-steps' }, ...LADDER.map((x, i) => h('li', { class: i < beat.step ? 'done' : i === beat.step ? 'now' : '' }, x.name))),
          h('p', { class: 'moment-text' }, ...brLines(beat.text)),
        );
        if (beat.step > 0) confetti(win, { count: 20 + beat.step * 20, stars: beat.step >= 3, duration: 2200 });
        nextButton();
        return;
      }
      case 'roadExtend': {
        const msg = beat.why === 'master' ? '修士の2年間が、道に加わった。' : '5年目が、道に加わった。\nゆっくり行こう。';
        stageWindow(
          'road-win',
          h('p', { class: 'moment-title pixel' }, '道が伸びた！'),
          h('ul', { class: 'road-new' }, ...beat.labels.map((l, i) => h('li', { style: `animation-delay:${i * 200}ms` }, l))),
          h('p', { class: 'moment-text' }, ...brLines(msg)),
        );
        nextButton();
        return;
      }
      case 'judge': {
        const b = beat.barrier;
        const win = eventWindow({ id: b ? `barrier-${b.sem}` : 'judge', text: beat.text, scene: 'room' }, () => nextButton(), {
          late: true,
          tag: b ? `${b.sem}セメスターバリア` : '学期末',
          tagKind: b?.passed ? 'theme' : '',
          cls: b?.passed ? 'barrier-pass' : '',
        });
        win.querySelector('.event-text')?.classList.add('judge-text');
        if (b?.passed) typing?.done.then(() => confetti(win, { count: 36, duration: 1800 }));
        return;
      }
      case 'end':
        setScene(null);
        onEnd(s);
        return;
    }
  }

  function next() {
    clearTimeout(timer);
    if (s.pending) return;
    const r = advance(s);
    s = r.state;
    show(r.beat);
  }

  function pick(i: number) {
    clearTimeout(timer);
    if (!s.pending) return;
    // 選んだ選択肢だけを残して、結果の下に「次へ」を出す
    chosenEl = actions.querySelector<HTMLElement>(`[data-choice="${i}"]`);
    chosenEl?.classList.add('chosen');
    chosenEl?.setAttribute('disabled', '');
    const r = choose(s, i);
    s = r.state;
    show(r.beat);
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    if (/^[1-9]$/.test(e.key) && s.pending) {
      const i = Number(e.key) - 1;
      if (actions.querySelector(`[data-choice="${i}"]:not([disabled])`)) pick(i);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (typing?.typing()) typing.finish();
      else primary?.();
    }
  };
  window.addEventListener('keydown', onKey);
  queueMicrotask(next);
  return {
    el,
    dispose() {
      clearTimeout(timer);
      setScene(null);
      window.removeEventListener('keydown', onKey);
    },
  };
}

const brLines = (text: string) => text.split('\n').flatMap((t, i) => (i ? [h('br'), t] : [t]));

function sumDeltas(list: ShownEvent[]) {
  const out: Record<string, number> = {};
  for (const l of list) for (const [k, v] of Object.entries(l.deltas)) out[k] = (out[k] ?? 0) + (v ?? 0);
  return out;
}
