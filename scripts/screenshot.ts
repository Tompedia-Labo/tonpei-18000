// 各画面を幅・ライト/ダーク・文字200%の組み合わせで撮り、はみ出しと重なりを検出する。
// 使い方：npm run build && npx vite preview --port 4173 を別に立ててから npm run shots
// 色合い・余白・動きの気持ちよさは人が見る。ここで見るのは崩れだけ。

import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:4173';
const SEED = process.env.SEED ?? '7';
/** 例：WIDTHS=1280 で撮る幅を絞る。1280 はパソコンの2カラム表示を見る */
const WIDTHS = process.env.WIDTHS?.split(',').map(Number) ?? [360, 390, 768, 1280];
const SCHEMES = ['light', 'dark'] as const;
const SCALES = [1, 2];
/** 例：ONLY=w390-light-x1,w360-light-x2 で撮る組み合わせを絞る */
const ONLY = process.env.ONLY?.split(',');

type Issue = { config: string; screen: string; what: string };
const issues: Issue[] = [];

async function check(page: Page, config: string, screen: string) {
  const found = await page.evaluate(() => {
    const out: string[] = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1) out.push(`横スクロールが出ている（${document.documentElement.scrollWidth}px > ${vw}px）`);
    const describe = (el: Element) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}「${(el.textContent ?? '').trim().slice(0, 20)}」`;
    for (const el of document.querySelectorAll('#app *')) {
      if (el.closest('.sr-only')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 1 || r.left < -1) out.push(`画面外にはみ出し：${describe(el)}`);
      const he = el as HTMLElement;
      const cs = getComputedStyle(he);
      if (cs.overflow !== 'visible' && (he.scrollWidth > he.clientWidth + 1 || he.scrollHeight > he.clientHeight + 1) && cs.overflow !== 'auto' && cs.overflow !== 'scroll')
        out.push(`中身が切れている：${describe(el)}`);
    }
    // ボタン同士の重なり
    const btns = [...document.querySelectorAll('#app .btn')].map((b) => [b, b.getBoundingClientRect()] as const);
    for (let i = 0; i < btns.length; i++)
      for (let j = i + 1; j < btns.length; j++) {
        const [a, ra] = btns[i];
        const [b, rb] = btns[j];
        if (ra.left < rb.right - 1 && rb.left < ra.right - 1 && ra.top < rb.bottom - 1 && rb.top < ra.bottom - 1) out.push(`ボタンが重なっている：${describe(a)} と ${describe(b)}`);
      }
    return [...new Set(out)];
  });
  for (const what of found) issues.push({ config, screen, what });
}

async function run() {
  const browser = await chromium.launch({ channel: 'msedge' });
  for (const width of WIDTHS)
    for (const scheme of SCHEMES)
      for (const scale of SCALES) {
        const config = `w${width}-${scheme}-x${scale}`;
        if (ONLY && !ONLY.includes(config)) continue;
        const dir = `shots/${config}`;
        mkdirSync(dir, { recursive: true });
        const page = await browser.newPage({ viewport: { width, height: 800 }, colorScheme: scheme });
        // tsx（esbuild）が evaluate の関数に付ける __name をブラウザ側に用意する
        await page.addInitScript('window.__name = (f) => f;');
        // スクリプトのエラーと、CSP（public/_headers）に弾かれた読み込みも崩れとして数える
        page.on('pageerror', (e) => issues.push({ config, screen: 'console', what: `スクリプトのエラー：${e.message}` }));
        page.on('console', (m) => {
          if (m.type() === 'error' && !/\/api\//.test(m.location().url + m.text())) issues.push({ config, screen: 'console', what: m.text().slice(0, 160) });
        });
        if (scale !== 1) await page.addInitScript((s) => document.addEventListener('DOMContentLoaded', () => (document.documentElement.style.fontSize = `${s * 100}%`)), scale);
        await page.goto(`${BASE}/?seed=${SEED}`);
        const seen = new Set<string>();
        let n = 0;
        const snap = async (screen: string, once = true) => {
          if (once && seen.has(screen)) return;
          seen.add(screen);
          await page.waitForTimeout(150);
          await page.screenshot({ path: `${dir}/${String(++n).padStart(2, '0')}-${screen}.png`, fullPage: true });
          await check(page, config, screen);
        };
        await page.waitForTimeout(600);
        await snap('title');
        await page.click('text=入学する');
        await snap('gacha-closed');
        for (let i = 0; i < 4; i++) await page.click('.gacha .btn.primary');
        await page.waitForTimeout(600);
        await snap('gacha-half');
        for (let i = 0; i < 4; i++) await page.click('.gacha .btn.primary');
        await page.waitForSelector('.birth');
        await page.waitForTimeout(700);
        await snap('gacha-born');
        await page.click('text=1セメへ');
        // ボタンが作り直される瞬間に当たると「止まるまで」待ち続けるので、短く試して状態を読み直す
        let misses = 0;
        const tryClick = async (sel: string) => {
          try {
            await page.click(sel, { timeout: 2500 });
            misses = 0;
          } catch (e) {
            if (++misses > 8) throw e;
          }
        };
        for (let i = 0; i < 600; i++) {
          if (await page.$('.review')) break;
          const kind = await page.evaluate(() => {
            const q = (sel: string) => document.querySelector(sel);
            if (q('.banner')) return 'turn';
            if (q('.theme-card:not([disabled])')) return 'theme';
            if (q('.choice:not([disabled])')) return q('.event-tag') ? 'choice-tagged' : 'choice';
            if (!q('.choices .btn.primary')) return 'typing';
            if (q('.unlock')) return 'unlock';
            if (q('.ladder-win')) return 'ladder';
            if (q('.road-win')) return 'road';
            if (q('.result-text')) return 'choice-result';
            if (q('.diary')) return 'diary';
            if (q('.judge-text')) return 'judge';
            return 'event';
          });
          if (kind === 'typing') {
            await page.waitForTimeout(150);
            continue;
          }
          if (kind === 'turn') {
            if (!seen.has('turn')) await page.waitForTimeout(600); // 幕が入りきってから撮る
            await snap('turn');
            await page.waitForTimeout(1200);
            continue;
          }
          await snap(kind);
          if (kind === 'theme') await tryClick('.theme-card >> nth=0');
          else if (kind === 'choice' || kind === 'choice-tagged') await tryClick('.choice:not([disabled]) >> nth=0');
          else await tryClick('.choices .btn.primary');
        }
        await snap('review');
        await page.click('text=結果を見る');
        await page.waitForTimeout(1500);
        await snap('interlude');
        await page.waitForSelector('.result', { timeout: 8000 });
        await page.waitForTimeout(5500);
        await snap('result');
        await page.click('text=称号図鑑');
        await snap('dex');
        await page.close();
      }
  await browser.close();
  if (!issues.length) console.log('崩れは見つかりませんでした');
  for (const i of issues) console.log(`[${i.config}] ${i.screen}: ${i.what}`);
  process.exitCode = issues.length ? 1 : 0;
}

run();
