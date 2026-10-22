// 端末の localStorage。保存するのはプレイ回数と称号図鑑だけ。読み書きに失敗しても動く

const KEY = 'tonpei.v1';

type Saved = { plays: number; titles: string[] };

function read(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { plays: Number(v.plays) || 0, titles: Array.isArray(v.titles) ? v.titles.filter((x: unknown) => typeof x === 'string') : [] };
  } catch {
    return { plays: 0, titles: [] };
  }
}

function write(v: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // 保存できなくても遊べる
  }
}

export const saved = read;

export function countPlay() {
  const v = read();
  write({ ...v, plays: v.plays + 1 });
}

/** 称号を図鑑に入れる。初めて手に入れたら true */
export function addTitle(titleId: string): boolean {
  const v = read();
  if (v.titles.includes(titleId)) return false;
  write({ ...v, titles: [...v.titles, titleId] });
  return true;
}
