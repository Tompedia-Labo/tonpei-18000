// 研究の階段のドット絵。届いた段は紫、まだの段は薄く。届いた段の上に自分のキャラが立つ

import { LADDER } from '../../data/research';
import { drawCharacter, type Look } from './character';
import { PX } from './palette';
import { pixelCanvas } from './sprite';

const W = 100;
const H = 60;
const STEP_W = 18;
const STEP_H = 8;

export function ladderCanvas(reached: number, look: Look | null): HTMLCanvasElement {
  const [c, ctx] = pixelCanvas(W, H, 'px ladder');
  ctx.fillStyle = '#efe7ff';
  ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 4) {
    ctx.fillStyle = '#e1d6fb';
    ctx.fillRect(x, 4 + (x % 8 === 0 ? 0 : 2), 1, 1);
  }
  LADDER.forEach((_, i) => {
    const x = 4 + i * STEP_W;
    const top = H - 4 - (i + 1) * STEP_H;
    const on = i <= reached;
    ctx.fillStyle = '#2a1660';
    ctx.fillRect(x - 1, top - 1, STEP_W + 1, H - top);
    ctx.fillStyle = on ? '#7c4dff' : '#d9ccf5';
    ctx.fillRect(x, top, STEP_W - 1, H - top - 4);
    ctx.fillStyle = on ? '#a888ff' : '#efe8fb';
    ctx.fillRect(x, top, STEP_W - 1, 2);
    if (i === LADDER.length - 1) {
      // 頂上の旗
      ctx.fillStyle = '#2a1660';
      ctx.fillRect(x + 12, top - 12, 1, 12);
      ctx.fillStyle = on ? PX.yellow : '#c9bfe0';
      ctx.fillRect(x + 13, top - 12, 5, 4);
    }
  });
  ctx.fillStyle = '#2a1660';
  ctx.fillRect(0, H - 4, W, 4);
  if (look && reached >= 0) {
    const i = Math.min(reached, LADDER.length - 1);
    drawCharacter(ctx, look, 4 + i * STEP_W - 1, H - 4 - (i + 1) * STEP_H - 24);
  }
  return c;
}
