// ドット絵の色。紫を基調にする（虹色のグラデーションは使わない）。絵は自分の背景を持つので、ライト/ダークで変えない

export const PX = {
  ink: '#241a3a',
  inkSoft: '#4a3d66',
  white: '#fbf8ff',
  paper: '#efe8fa',
  violet: '#6e3cbc',
  violetDeep: '#4b2591',
  violetLight: '#a07ae6',
  lilac: '#d9c8f5',
  red: '#e0457b',
  orange: '#f28c38',
  yellow: '#f5c842',
  green: '#3dbe8b',
  greenDeep: '#23845f',
  blue: '#3a8dde',
  indigo: '#4b4fc9',
  sky: '#8ec5f2',
  skyPale: '#cfe6fb',
  night: '#1b1236',
  nightBlue: '#2a2a6e',
  gray: '#8b86a0',
  grayLight: '#c9c4d8',
  grayDark: '#5b5672',
  brick: '#b5523b',
  brickDark: '#7e3427',
  wood: '#9a6a43',
  woodDark: '#6b4529',
  beige: '#e8d9b8',
  beigeDark: '#c9b48d',
  sakura: '#f6b7d0',
  sakuraDeep: '#e98bb0',
  leafAutumn: '#e0782f',
  leafYellow: '#f0b733',
  snow: '#ffffff',
  water: '#4f9be0',
  waterLight: '#9fd0f5',
  fire: '#ff7a2e',
} as const;

export const SKIN = [
  { s: '#f6d3b3', d: '#e2b08a' },
  { s: '#eabf94', d: '#cf9a6c' },
  { s: '#c98e62', d: '#a66e45' },
];

export const HAIR = [
  { h: '#2b2238', g: '#4e4266' },
  { h: '#5a3a26', g: '#80573a' },
  { h: '#3b2a52', g: '#6a50a0' },
  { h: '#7a4f2e', g: '#a87447' },
];

/** 服の色。ゲームらしく鮮やかに */
export const CLOTH = [
  { c: '#8c5cff', C: '#5d35c4' },
  { c: '#ff4f8b', C: '#c22f63' },
  { c: '#2fc6f0', C: '#1b8fb8' },
  { c: '#ffc93c', C: '#d99a12' },
  { c: '#7ad94a', C: '#4fa82c' },
  { c: '#ff8a3d', C: '#cf5f1c' },
];

/** UIの色（style.css のトークンと揃える） */
export const UI = {
  base: '#e9e1ff',
  panel: '#7c4dff',
  panelHi: '#a07cff',
  outline: '#2a1660',
  violet: '#7c4dff',
  violetHi: '#cbb8ff',
  pink: '#ff4f8b',
  cyan: '#3fd0ff',
  yellow: '#ffd23f',
  lime: '#a6e84a',
  orange: '#ff8a3d',
  paper: '#fff6e6',
  paperInk: '#24163d',
  text: '#f4eeff',
};
