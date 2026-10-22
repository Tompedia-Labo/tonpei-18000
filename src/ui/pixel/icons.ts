// 8×8 のドットのアイコン

import { PX, UI } from './palette';
import { spriteCanvas, type Sprite } from './sprite';

const PAL = {
  k: UI.outline, w: PX.white, c: UI.cyan, C: '#1f8fc0', R: UI.pink, r: '#ffb3cd', Y: UI.yellow, y: '#d99a12',
  P: UI.pink, G: UI.cyan, s: '#f6d3b3', L: UI.lime, l: '#4fa82c', V: UI.violet, v: UI.violetHi, g: PX.grayLight,
};

export const ICONS: Record<string, Sprite> = {
  tani: ['........', '.kk..kk.', 'kwckkcwk', 'kwckkcwk', 'kwckkcwk', 'kwwkkwwk', 'kkkkkkkk', '........'],
  tsunagari: ['.kk..kk.', 'ksskkssk', '.kk..kk.', 'kPPkkGGk', 'kPPkkGGk', 'kPPkkGGk', '.kk..kk.', '........'],
  saifu: ['..kkkk..', '.kYYYYk.', 'kYwYYYyk', 'kYwYYYyk', 'kYwYYYyk', 'kYYYYYyk', '.kyyyyk.', '..kkkk..'],
  kokoro: ['.kk.kk..', 'kLrkLLk.', 'kLLLLLk.', 'kLLLLlk.', '.kLLlk..', '..kLk...', '...k....', '........'],
  tankyu: ['..kkkk..', '...kk...', '...kk...', '..kwwk..', '.kVVVVk.', 'kVVwVVVk', 'kVVVVVVk', '.kkkkkk.'],
  lock: ['..kkkk..', '.k....k.', '.k....k.', 'kkkkkkkk', 'kggggggk', 'kgggkggk', 'kggggggk', 'kkkkkkkk'],
  star: ['...k....', '..kYk...', 'kkYYYkk.', 'kYYwYYk.', '.kYYYk..', 'kYk.kYk.', 'kk...kk.', '........'],
  chart: ['k.......', 'k.....V.', 'k...V.V.', 'k.V.V.V.', 'k.V.V.V.', 'k.V.V.V.', 'kkkkkkkk', '........'],
  out: ['...kkkkk', '....kkkk', '.....kkk', '....kkkk', '...kk..k', '..kk....', '.kk.....', 'kk......'],
};

export function icon(name: keyof typeof ICONS | string, scale = 2): HTMLCanvasElement {
  return spriteCanvas(ICONS[name] ?? ICONS.star, PAL, scale, 'px icon');
}
