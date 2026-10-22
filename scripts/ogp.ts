// OGP画像を public/ogp.png に書き出す。npm run dev を立ててから npm run ogp

import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:5173';

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.addInitScript('window.__name = (f) => f;');
await page.goto(`${BASE}/ogp.html`);
await page.waitForSelector('body[data-ready="1"]', { timeout: 15000 });
await page.locator('#ogp').screenshot({ path: 'public/ogp.png' });
await browser.close();
console.log('public/ogp.png に書き出しました');
