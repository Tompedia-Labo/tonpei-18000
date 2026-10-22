// シェア画像（1080×1350、Instagramの縦長）。家計は入れない

import { DISCLAIMER_SHORT, SITE_URL } from '../../config';
import { HASHTAG } from '../../core/share';
import { drawCharacter, type Look } from '../pixel/character';

export type CardInput = { n: number; title: string; path: string; attributes: string[]; research: string | null; look: Look };

const W = 1080;
const H = 1350;
const U = 6; // 枠の1ドット

function frame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, shade: string) {
  ctx.fillStyle = '#2a1660';
  ctx.fillRect(x + 2 * U, y, w - 4 * U, h);
  ctx.fillRect(x, y + 2 * U, w, h - 4 * U);
  ctx.fillRect(x + U, y + U, w - 2 * U, h - 2 * U);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 2 * U, y + U, w - 4 * U, h - 2 * U);
  ctx.fillRect(x + U, y + 2 * U, w - 2 * U, h - 4 * U);
  ctx.fillStyle = shade;
  ctx.fillRect(x + 2 * U, y + h - 2 * U, w - 4 * U, U);
  ctx.fillRect(x + w - 2 * U, y + 2 * U, U, h - 4 * U);
}

export async function renderShareCard(i: CardInput): Promise<Blob> {
  try {
    await Promise.all([document.fonts.load('80px DotGothic16'), document.fonts.load('700 40px "Zen Kaku Gothic New"')]);
  } catch {
    // フォントが読めなくても描く
  }
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const pixel = (size: number) => `${size}px DotGothic16, sans-serif`;
  const body = (size: number) => `700 ${size}px "Zen Kaku Gothic New", sans-serif`;

  // 空ときらめき
  ctx.fillStyle = '#e9e1ff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  for (let y = 30; y < H; y += 96) for (let x = (y / 3) % 96; x < W; x += 96) {
    ctx.fillRect(x, y - 6, 6, 18);
    ctx.fillRect(x - 6, y, 18, 6);
  }

  frame(ctx, 60, 60, W - 120, H - 230, '#fff6e6', '#ecd9b6');
  ctx.fillStyle = '#5a2fd6';
  ctx.font = pixel(52);
  ctx.textBaseline = 'top';
  ctx.fillText('あなたのとんぺー生活は', 120, 130);

  // 分数
  ctx.fillStyle = '#7c4dff';
  ctx.font = pixel(170);
  ctx.fillText('1', 170, 210);
  ctx.save();
  ctx.translate(120, 420);
  ctx.rotate(-0.1);
  ctx.fillStyle = '#ff4f8b';
  ctx.fillRect(0, 18, 560, 22);
  ctx.fillStyle = '#2a1660';
  ctx.fillRect(0, 0, 560, 22);
  ctx.restore();
  const n = i.n.toLocaleString('ja-JP');
  let size = 150;
  ctx.font = pixel(size);
  while (ctx.measureText(`${n}人`).width > 560 && size > 60) ctx.font = pixel((size -= 6));
  ctx.fillStyle = '#24163d';
  ctx.fillText(`${n}人`, 120, 470);

  drawCharacter(ctx, i.look, 700, 220, 14);

  // 称号のリボン
  frame(ctx, 120, 700, W - 240, 150, '#ff4f8b', '#c22f63');
  ctx.fillStyle = '#ffffff';
  ctx.font = pixel(34);
  ctx.textAlign = 'center';
  ctx.fillText('称号', W / 2, 722);
  let ts = 64;
  ctx.font = pixel(ts);
  while (ctx.measureText(i.title).width > W - 320 && ts > 30) ctx.font = pixel((ts -= 4));
  ctx.fillText(i.title, W / 2, 768);

  ctx.fillStyle = '#24163d';
  ctx.font = body(40);
  const line = (text: string, y: number, max = W - 260) => {
    let s = 40;
    ctx.font = body(s);
    while (ctx.measureText(text).width > max && s > 24) ctx.font = body((s -= 2));
    ctx.fillText(text, W / 2, y);
  };
  line(i.attributes.join('／'), 900);
  ctx.fillStyle = '#5a2fd6';
  line(i.path, 958);
  if (i.research) {
    ctx.fillStyle = '#5b4a7d';
    line(`研究：${i.research}`, 1014);
  }
  ctx.fillStyle = '#24163d';
  ctx.font = pixel(40);
  ctx.fillText(HASHTAG, W / 2, 1076);

  // 下の帯
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7c4dff';
  ctx.font = pixel(54);
  ctx.fillText('とんぺー1.8万分の１', 70, 1190);
  ctx.fillStyle = '#5b4a7d';
  ctx.font = body(26);
  ctx.fillText(SITE_URL.replace(/^https?:\/\//, ''), 72, 1258);
  ctx.font = body(22);
  ctx.fillText(DISCLAIMER_SHORT, 72, 1296);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}
