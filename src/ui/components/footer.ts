import { BETA, DATA_NOTICE, DISCLAIMER, DISCLAIMER_SHORT, feedbackUrl, type FeedbackScreen } from '../../config';
import { CREDIT_FOOTER, LABO } from '../../data/credit';
import { h } from '../dom';

/** 全画面のフッター。タイトル・結果では定型文の全文とβ版の注記と報告フォーム、結果では相談窓口も出す */
export function footer(opts: { full?: boolean; help?: boolean; screen?: FeedbackScreen } = {}): HTMLElement {
  return h(
    'footer',
    { class: 'footer' },
    h('p', {}, opts.full ? DISCLAIMER : `${DISCLAIMER_SHORT}です。`),
    h('p', {}, CREDIT_FOOTER.label, h('a', { href: LABO.url, target: '_blank', rel: 'noopener' }, LABO.name)),
    opts.full
      ? h(
          'p',
          {},
          `いまは${BETA}です。${DATA_NOTICE}`,
          h('a', { href: feedbackUrl({ screen: opts.screen }), target: '_blank', rel: 'noopener' }, '気づいたこと・間違いを送る'),
        )
      : null,
    opts.full ? h('p', {}, 'プレイ数とアクセス数は匿名で数えています（Cookieは使いません）。名前などの個人情報は集めません。') : null,
    opts.help
      ? h(
          'p',
          {},
          'しんどいときは、話せる場所があります：',
          h('a', { href: 'https://www.ccds.ihe.tohoku.ac.jp/', target: '_blank', rel: 'noopener' }, '学生相談・特別支援センター'),
        )
      : null,
  );
}
