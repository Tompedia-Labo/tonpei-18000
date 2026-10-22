// 作った団体（とんペディア_ラボ）と東北大学祭・Giving Campaign の案内。結果では大きく、タイトルでは小さく出す。文言は data/credit.ts

import { CREDIT_RESULT, CREDIT_TITLE, FESTA_BANNER, FESTA_URL, GIVING, LABO } from '../../data/credit';
import { h, lines } from '../dom';
import { icon } from '../pixel/icons';

const NEW_TAB = '（新しいタブで開く）';
const GIVING_ENDS = Date.parse(GIVING.endsAt);

const ext = (href: string, attrs: Record<string, string>, ...label: (Node | string)[]) =>
  h('a', { href, target: '_blank', rel: 'noopener', ...attrs }, ...label, icon('out'), h('span', { class: 'sr-only' }, NEW_TAB));

const logo = () => h('a', { class: 'credit-logo', href: LABO.url, target: '_blank', rel: 'noopener' }, h('img', { src: LABO.logo, alt: `${LABO.name}${NEW_TAB}`, width: 960, height: 108 }));

const banner = () =>
  h('a', { class: 'credit-banner', href: FESTA_URL, target: '_blank', rel: 'noopener' }, h('img', { src: FESTA_BANNER.src, alt: `${FESTA_BANNER.alt}${NEW_TAB}`, width: 960, height: 240 }));

/** 残り時間を「2日 05:12:33」の形にする。1日を切ったら「05:12:33」 */
const timeLeft = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  const d = Math.floor(s / 86400);
  const hms = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':');
  return d ? `${d}日 ${hms}` : hms;
};

/** Giving Campaign の案内（残り時間・文言・ボタン）。終わっていたら null。表示中に終わったら、その場で消える */
function giving() {
  if (Date.now() >= GIVING_ENDS) return null;
  const clock = h('time', { class: 'giving-left', datetime: GIVING.endsAt });
  const text = h(
    'div',
    { class: 'credit-giving' },
    h('p', { class: 'giving-timer' }, icon('clock'), h('span', {}, GIVING.timerLabel), clock),
    h('p', {}, lines(GIVING.body)),
  );
  const button = ext(GIVING.url, { class: 'btn small giving-btn' }, icon('heart'), GIVING.button);
  let shown = false;
  const tick = () => {
    const ms = GIVING_ENDS - Date.now();
    if (ms <= 0) {
      clearInterval(timer);
      text.remove();
      button.remove();
      return;
    }
    // 画面が切り替わって外されたら止める
    if (text.isConnected) shown = true;
    else if (shown) return clearInterval(timer);
    clock.textContent = timeLeft(ms);
  };
  const timer = window.setInterval(tick, 1000);
  tick();
  return { text, button };
}

export function credit(size: 'full' | 'mini'): HTMLElement {
  const g = giving();
  if (size === 'mini')
    return h(
      'section',
      { class: 'plate credit-mini', 'aria-label': CREDIT_TITLE.label },
      h('small', { class: 'credit-label' }, CREDIT_TITLE.label),
      logo(),
      h('p', { class: 'credit-mini-text' }, lines(CREDIT_TITLE.body)),
      banner(),
      g?.text,
      g?.button,
    );
  return h(
    'section',
    { class: 'win drop credit' },
    h('p', { class: 'section-title' }, icon('star'), ` ${CREDIT_RESULT.heading}`),
    logo(),
    h('p', { class: 'credit-text' }, lines(CREDIT_RESULT.body)),
    banner(),
    g?.text,
    h('div', { class: 'credit-links' }, g?.button, ext(LABO.url, { class: 'btn small' }, CREDIT_RESULT.laboButton)),
  );
}
