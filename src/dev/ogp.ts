// 開発用：OGP画像（1200×630）を描く。npm run ogp で public/ogp.png に書き出す

import { BETA, DISCLAIMER_SHORT } from '../config';
import { baseLook, drawCharacter, type Look } from '../ui/pixel/character';

const W = 1200;
const H = 630;
const U = 6;

async function draw() {
  await Promise.all([document.fonts.load('120px DotGothic16'), document.fonts.load('700 36px "Zen Kaku Gothic New"')]);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  c.id = 'ogp';
  document.body.append(c);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const pixel = (s: number) => `${s}px DotGothic16, sans-serif`;
  const body = (s: number) => `700 ${s}px "Zen Kaku Gothic New", sans-serif`;

  // 空ときらめき
  ctx.fillStyle = '#e9e1ff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  for (let y = 36; y < H; y += 90)
    for (let x = (y * 7) % 90; x < W; x += 90) {
      ctx.fillRect(x, y - 6, 6, 18);
      ctx.fillRect(x - 6, y, 18, 6);
    }

  // ドット絵の枠（クリームの窓）
  const frame = (x: number, y: number, w: number, h: number, fill: string, shade: string) => {
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
  };
  frame(40, 40, W - 80, H - 150, '#fff6e6', '#ecd9b6');

  // タイトル
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#24163d';
  ctx.font = pixel(52);
  ctx.fillText('と ん ぺ ー', 100, 90);
  // β版の札（画面のロゴと同じ、黄色に紫の縁）
  const tagX = 100 + ctx.measureText('と ん ぺ ー').width + 28;
  ctx.font = pixel(34);
  const tagW = ctx.measureText(BETA).width + 28;
  ctx.fillStyle = '#ff4f8b';
  ctx.fillRect(tagX + 10, 96, tagW, 50);
  ctx.fillStyle = '#2a1660';
  ctx.fillRect(tagX - 4, 82, tagW + 8, 58);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(tagX, 86, tagW, 50);
  ctx.fillStyle = '#24163d';
  ctx.fillText(BETA, tagX + 14, 94);
  const title = (text: string, x: number, y: number, color: string) => {
    ctx.font = pixel(132);
    ctx.fillStyle = '#ff4f8b';
    ctx.fillText(text, x + 8, y + 9);
    ctx.fillStyle = '#2a1660';
    for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4]]) ctx.fillText(text, x + dx, y + dy);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    return ctx.measureText(text).width;
  };
  const w1 = title('1.8万', 92, 160, '#ffd23f');
  title('分の１', 92 + w1 + 4, 160, '#7c4dff');

  ctx.fillStyle = '#24163d';
  ctx.font = body(34);
  ctx.fillText('あなたの東北大生活は、約何人に1人？', 100, 330);
  ctx.fillStyle = '#5b4a7d';
  ctx.font = body(26);
  ctx.fillText('入学ガチャを引いて、在学の終わりまでを3〜6分で生きる。', 100, 384);

  // キャラ（進路の違う3人）
  const looks: Look[] = [
    { ...baseLook(11), expr: 'happy' },
    { ...baseLook(5), outfit: 'labcoat', prop: 'flask', expr: 'proud' },
    { ...baseLook(23), outfit: 'suit', prop: 'briefcase', cheer: true, expr: 'proud' },
  ];
  // タイトル（右端は約780px）と説明文に重ならないよう、右側に寄せる
  looks.forEach((look, i) => drawCharacter(ctx, look, 830 + i * 96, 240 + (i % 2) * 22, 6));

  // 下の帯：非公式の表示
  ctx.fillStyle = '#7c4dff';
  ctx.fillRect(0, H - 76, W, 76);
  ctx.fillStyle = '#2a1660';
  ctx.fillRect(0, H - 76, W, 6);
  ctx.fillStyle = '#ffffff';
  ctx.font = body(26);
  ctx.textAlign = 'center';
  ctx.fillText(`${DISCLAIMER_SHORT}です`, W / 2, H - 52);
  document.body.dataset.ready = '1';
}

draw();
