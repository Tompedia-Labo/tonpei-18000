// 作った団体（とんペディア_ラボ）と東北大学祭の案内。結果では大きく、タイトルでは小さく出す。文言は data/credit.ts

import { CREDIT_RESULT, CREDIT_TITLE, FESTA_BANNER, FESTA_URL, LABO } from '../../data/credit';
import { h, lines } from '../dom';
import { icon } from '../pixel/icons';

const NEW_TAB = '（新しいタブで開く）';

const ext = (href: string, attrs: Record<string, string>, ...label: (Node | string)[]) =>
  h('a', { href, target: '_blank', rel: 'noopener', ...attrs }, ...label, icon('out'), h('span', { class: 'sr-only' }, NEW_TAB));

const logo = () => h('a', { class: 'credit-logo', href: LABO.url, target: '_blank', rel: 'noopener' }, h('img', { src: LABO.logo, alt: `${LABO.name}${NEW_TAB}`, width: 960, height: 108 }));

const banner = () =>
  h('a', { class: 'credit-banner', href: FESTA_URL, target: '_blank', rel: 'noopener' }, h('img', { src: FESTA_BANNER.src, alt: `${FESTA_BANNER.alt}${NEW_TAB}`, width: 960, height: 240 }));

export function credit(size: 'full' | 'mini'): HTMLElement {
  if (size === 'mini')
    return h(
      'section',
      { class: 'plate credit-mini', 'aria-label': CREDIT_TITLE.label },
      h('small', { class: 'credit-label' }, CREDIT_TITLE.label),
      logo(),
      h('p', { class: 'credit-mini-text' }, lines(CREDIT_TITLE.body)),
      banner(),
    );
  return h(
    'section',
    { class: 'win drop credit' },
    h('p', { class: 'section-title' }, icon('star'), ` ${CREDIT_RESULT.heading}`),
    logo(),
    h('p', { class: 'credit-text' }, lines(CREDIT_RESULT.body)),
    banner(),
    h('div', { class: 'credit-links' }, ext(LABO.url, { class: 'btn small' }, CREDIT_RESULT.laboButton)),
  );
}
