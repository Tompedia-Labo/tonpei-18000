// 作った団体（とんペディア_ラボ）と東北大学祭の案内。結果では大きく、タイトルでは小さく出す。文言は data/credit.ts

import { CREDIT_RESULT, CREDIT_TITLE, FESTA_URL, LABO } from '../../data/credit';
import { h, lines } from '../dom';
import { icon } from '../pixel/icons';

const ext = (href: string, attrs: Record<string, string>, ...label: (Node | string)[]) =>
  h('a', { href, target: '_blank', rel: 'noopener', ...attrs }, ...label, icon('out'), h('span', { class: 'sr-only' }, '（新しいタブで開く）'));

const logo = () => h('a', { class: 'credit-logo', href: LABO.url, target: '_blank', rel: 'noopener' }, h('img', { src: LABO.logo, alt: `${LABO.name}（新しいタブで開く）`, width: 960, height: 108 }));

export function credit(size: 'full' | 'mini'): HTMLElement {
  if (size === 'mini')
    return h(
      'section',
      { class: 'plate credit-mini', 'aria-label': CREDIT_TITLE.label },
      h('small', { class: 'credit-label' }, CREDIT_TITLE.label),
      logo(),
      h('p', { class: 'credit-mini-text' }, h('span', {}, lines(CREDIT_TITLE.body)), ext(FESTA_URL, {}, CREDIT_TITLE.festaLink)),
    );
  return h(
    'section',
    { class: 'win drop credit' },
    h('p', { class: 'section-title' }, icon('star'), ` ${CREDIT_RESULT.heading}`),
    logo(),
    h('p', { class: 'credit-text' }, lines(CREDIT_RESULT.body)),
    h(
      'div',
      { class: 'credit-links' },
      ext(FESTA_URL, { class: 'btn small primary' }, CREDIT_RESULT.festaButton),
      ext(LABO.url, { class: 'btn small' }, CREDIT_RESULT.laboButton),
    ),
  );
}
