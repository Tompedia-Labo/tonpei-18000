// プレイヤーのドットキャラ（20×24）。性別を決めないデザインにする。
// 見た目はシードで決まる部分（髪・肌・服の色・眼鏡）と、状態で変わる部分（服装・表情・持ち物・ポーズ）に分ける。

import type { State } from '../../core/types';
import { CLOTH, HAIR, PX, SKIN } from './palette';
import { drawSprite, hashRng, layer, patch, pixelCanvas, type Palette, type Sprite } from './sprite';

export const CHAR_W = 20;
export const CHAR_H = 24;

// 顔の E=目 M=口 B=ほお。表情パッチで置き換える
const HEAD: Sprite = [
  '................',
  '....kkkkkkkk....',
  '...khhhhhhhhk...',
  '..khhhhhhhgghk..',
  '.khhhhhhhhhgghk.',
  '.khhhhhhhhhhhhk.',
  '.khhhshhhhshhhk.',
  '.khsssssssssshk.',
  '.khsEEssssEEshk.',
  '.khsEEssssEEshk.',
  '.ksBsssMMsssBsk.',
  '..kssssssssssk..',
];

const HAIR_LONG: Sprite = [
  ...Array(10).fill('................'),
  'khh..........hhk',
  'khh..........hhk',
  'khh..........hhk',
  'kgh..........hgk',
  '.kk..........kk.',
];
const HAIR_BUN: Sprite = ['.....khhhk......', '....kkhghkkk....'];
const HAIR_AHOGE: Sprite = ['........khk.....'];
// 目（8〜9行目の4〜5列・10〜11列）を囲む細い縁。目にかからないようにする
const GLASSES: Sprite = [
  ...Array(7).fill('................'),
  '...XXXX..XXXX...',
  '...X..XXXX..X...',
  '...X..X..X..X...',
  '...XXXX..XXXX...',
];

type Expr = 'normal' | 'happy' | 'sleepy' | 'proud';
const EXPR: Record<Expr, { r: number; c: number; s: string }[]> = {
  normal: [
    { r: 8, c: 4, s: 'we' }, { r: 8, c: 10, s: 'we' },
    { r: 9, c: 4, s: 'ee' }, { r: 9, c: 10, s: 'ee' },
    { r: 10, c: 3, s: 's' }, { r: 10, c: 12, s: 's' }, { r: 10, c: 7, s: 'mm' },
  ],
  happy: [
    { r: 8, c: 4, s: 'ss' }, { r: 8, c: 10, s: 'ss' },
    { r: 9, c: 4, s: 'ee' }, { r: 9, c: 10, s: 'ee' },
    { r: 10, c: 3, s: 'r' }, { r: 10, c: 12, s: 'r' }, { r: 10, c: 6, s: 'mMMm' },
  ],
  sleepy: [
    { r: 8, c: 4, s: 'ss' }, { r: 8, c: 10, s: 'ss' },
    { r: 9, c: 4, s: 'ee' }, { r: 9, c: 10, s: 'ee' },
    { r: 10, c: 3, s: 's' }, { r: 10, c: 12, s: 's' }, { r: 10, c: 7, s: 'ms' },
  ],
  proud: [
    { r: 8, c: 4, s: 'ee' }, { r: 8, c: 10, s: 'ee' },
    { r: 9, c: 4, s: 'ws' }, { r: 9, c: 10, s: 'ws' },
    { r: 10, c: 3, s: 'r' }, { r: 10, c: 12, s: 'r' }, { r: 10, c: 6, s: 'mMMm' },
  ],
};

// 体（12〜23行目）。c=服 C=服の影 t=中の服 x=ネクタイ p=ズボン b=靴
const BODY: Record<'hoodie' | 'labcoat' | 'suit', Sprite> = {
  hoodie: [
    '....kkddddkk....',
    '...kcccttccck...',
    '..kcccCttCccck..',
    '.kcckcccccckcck.',
    '.kcckCccccCkcck.',
    '.ksskcccccckssk.',
    '..kkkCCCCCCkkk..',
    '....kppppppk....',
    '....kppkkppk....',
    '....kppkkppk....',
    '...kbbbkkbbbk...',
    '...kkkkkkkkkk...',
  ],
  labcoat: [
    '....kkddddkk....',
    '...kwwwttwwwk...',
    '..kwwwWttWwwwk..',
    '.kwwkwwttwwkwwk.',
    '.kwwkwwttwwkwwk.',
    '.ksskwwttwwkssk.',
    '..kkkwWttWwkkk..',
    '...kwppppppwk...',
    '....kppkkppk....',
    '....kppkkppk....',
    '...kbbbkkbbbk...',
    '...kkkkkkkkkk...',
  ],
  suit: [
    '....kkddddkk....',
    '...kcccwwccck...',
    '..kcccCxxCccck..',
    '.kcckcCxxCckcck.',
    '.kcckccxxcckcck.',
    '.ksskcccccckssk.',
    '..kkkCCCCCCkkk..',
    '....kppppppk....',
    '....kppkkppk....',
    '....kppkkppk....',
    '...kbbbkkbbbk...',
    '...kkkkkkkkkk...',
  ],
};

/** 右腕（画面の右）を上げたポーズ。体の右腕を消して、腕を上に描く */
const CHEER_BODY_PATCH = [
  { r: 3, c: 11, s: 'k...' },
  { r: 4, c: 11, s: 'k...' },
  { r: 5, c: 11, s: 'k...' },
  { r: 6, c: 11, s: 'k...' },
];
const CHEER_ARM: Sprite = ['kkkk', 'kssk', 'kssk', 'kcck', 'kcck', 'kcck', 'kcck'];
/** 上げた腕と肩をつなぐ */
const CHEER_SHOULDER: Sprite = ['..kcck', 'kcccck', 'kcck..'];

const PROPS: Record<string, { s: Sprite; x: number; y: number }> = {
  flask: { s: ['.kkk.', '.kwk.', '.kwk.', 'kwwwk', 'kVVVk', 'kVVVk', '.kkk.'], x: 15, y: 15 },
  briefcase: { s: ['..kk..', '.k..k.', 'kyyyyk', 'kyYyyk', 'kyyyyk', 'kkkkkk'], x: 14, y: 17 },
  laptop: { s: ['kkkkkk.', 'kLLLLk.', 'kLlLLk.', 'kLLLLk.', 'kkkkkkk', '.kkkkkk'], x: 0, y: 15 },
  suitcase: { s: ['..kk..', '.k..k.', 'kRRRRk', 'kRwYRk', 'kRRRRk', 'kRRRRk', 'kkkkkk'], x: 14, y: 16 },
  book: { s: ['kkkkk', 'kBwBk', 'kBwBk', 'kBwBk', 'kkkkk'], x: 15, y: 17 },
  backpack: { s: ['.kkk.', 'kOOOk', 'kOyOk', 'kOOOk', '.kkk.'], x: 0, y: 14 },
};
const STETHOSCOPE: Sprite = ['....', '....', '....', '.G..G', '.G..G', '..GG.', '...Q.'];

export type Look = {
  hair: 'short' | 'long' | 'bun' | 'ahoge';
  hairColor: number;
  skin: number;
  cloth: number;
  glasses: boolean;
  outfit: keyof typeof BODY;
  expr: Expr;
  prop: keyof typeof PROPS | null;
  cheer: boolean;
  stethoscope: boolean;
};

/** シードで決まる見た目 */
export function baseLook(seed: number): Look {
  const r = hashRng(seed);
  const hairs: Look['hair'][] = ['short', 'long', 'bun', 'ahoge'];
  return {
    hair: hairs[Math.floor(r() * hairs.length)],
    hairColor: Math.floor(r() * HAIR.length),
    skin: Math.floor(r() * SKIN.length),
    cloth: Math.floor(r() * CLOTH.length),
    glasses: r() < 0.3,
    outfit: 'hoodie',
    expr: 'normal',
    prop: null,
    cheer: false,
    stethoscope: false,
  };
}

/** 在学中の見た目。研究室に入ったら白衣、就職を決めたらスーツ、こころが低いと眠そう */
export function lookFor(s: State): Look {
  const look = baseLook(s.seed);
  const t = s.turns[s.turnIndex];
  if (s.tankyuUnlocked || t?.kind === 'master') look.outfit = 'labcoat';
  if (s.path === 'job') look.outfit = 'suit';
  if (s.flags.ryugaku) look.prop = 'suitcase';
  look.expr = s.stats.kokoro >= 70 ? 'happy' : s.stats.kokoro < 30 ? 'sleepy' : 'normal';
  return look;
}

/** 結果画面の見た目。進路ごとにポーズと持ち物を変える */
export function resultLook(s: State): Look {
  const look = baseLook(s.seed);
  look.expr = 'proud';
  switch (s.path) {
    case 'job':
    case 'masterJob':
      return { ...look, outfit: 'suit', prop: 'briefcase' };
    case 'doctor':
      return { ...look, outfit: 'labcoat', prop: null, cheer: true };
    case 'kokushi':
      return s.flags.kokushiPass ? { ...look, outfit: 'labcoat', stethoscope: true, cheer: true } : { ...look, outfit: 'labcoat', prop: 'book', expr: 'normal' };
    case 'startup':
    case 'masterOther':
      return { ...look, outfit: 'hoodie', prop: 'laptop', cheer: true };
    case 'dropout':
      return { ...look, outfit: 'hoodie', prop: 'backpack', cheer: true };
    default:
      return { ...look, cheer: true };
  }
}

function palette(look: Look): Palette {
  const skin = SKIN[look.skin];
  const hair = HAIR[look.hairColor];
  const cloth = CLOTH[look.cloth];
  const suit = look.outfit === 'suit';
  return {
    k: PX.ink, s: skin.s, d: skin.d, h: hair.h, g: hair.g,
    e: PX.ink, w: PX.white, m: '#b8475f', M: '#e86f8a', r: '#f3a0b4',
    c: suit ? '#2b3158' : cloth.c, C: suit ? '#1d2140' : cloth.C,
    t: suit ? PX.white : cloth.c, x: PX.violet,
    W: PX.grayLight, p: suit ? '#2b3158' : '#3d3556', b: PX.inkSoft,
    y: PX.wood, Y: PX.yellow, L: PX.sky, l: PX.white, R: PX.red, B: PX.blue, O: PX.orange,
    G: PX.grayDark, Q: PX.gray, V: PX.green, X: '#5d35c4',
  };
}

function compose(look: Look): Sprite {
  let head = patch(HEAD, EXPR[look.expr]);
  head = head.map((row) => row.replace(/[EMB]/g, 's'));
  let body = BODY[look.outfit];
  if (look.cheer) body = patch(body, CHEER_BODY_PATCH);
  const parts: Sprite[] = [];
  if (look.hair === 'long') parts.push(pad(HAIR_LONG, 0));
  parts.push(pad([...Array(12).fill('................'), ...body], 0));
  if (look.stethoscope) parts.push(pad([...Array(12).fill('................'), ...STETHOSCOPE.map((r) => `.....${r}`.padEnd(16, '.'))], 0));
  parts.push(pad(head, 0));
  if (look.hair === 'long') parts.push(pad(HAIR_LONG.map((r, i) => (i >= 10 ? r : '................')), 0));
  if (look.hair === 'bun') parts.push(pad(HAIR_BUN, 0));
  if (look.hair === 'ahoge') parts.push(pad(HAIR_AHOGE, 0));
  if (look.glasses) parts.push(pad(GLASSES, 0));
  return layer(...parts);
}

/** 16幅のスプライトを20幅に広げる（左右2マスずつ） */
const pad = (s: Sprite, top: number): Sprite => {
  const rows = [...Array(top).fill('................'), ...s];
  while (rows.length < CHAR_H) rows.push('................');
  return rows.map((r) => `..${r.padEnd(16, '.')}..`);
};

export function drawCharacter(ctx: CanvasRenderingContext2D, look: Look, x: number, y: number, scale = 1, flip = false) {
  const pal = palette(look);
  drawSprite(ctx, compose(look), pal, x, y, scale, flip);
  if (look.cheer) {
    drawSprite(ctx, CHEER_ARM, pal, x + (flip ? 0 : 16) * scale, y + 7 * scale, scale);
    drawSprite(ctx, CHEER_SHOULDER, pal, x + (flip ? 0 : 14) * scale, y + 13 * scale, scale, flip);
  }
  if (look.prop) {
    const p = PROPS[look.prop];
    drawSprite(ctx, p.s, pal, x + p.x * scale, y + p.y * scale, scale);
  }
}

export function characterCanvas(look: Look, scale = 1, className = 'px chara'): HTMLCanvasElement {
  const [c, ctx] = pixelCanvas(CHAR_W * scale, CHAR_H * scale, className);
  drawCharacter(ctx, look, 0, 0, scale);
  return c;
}
