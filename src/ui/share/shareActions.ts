// シェアボタン：画像を保存／Xで共有／Instagram／文章をコピー

import { toast } from '../fx';
import { renderShareCard, type CardInput } from './shareCard';

const FILE_NAME = 'tonpei-result.png';

let cache: { key: string; blob: Promise<Blob> } | null = null;
const cardBlob = (i: CardInput) => {
  const key = JSON.stringify(i);
  if (cache?.key !== key) cache = { key, blob: renderShareCard(i) };
  return cache.blob;
};

/** 結果画面を開いた時点で作っておく（共有シートはタップの直後でないと開けない端末があるため） */
export const prepareCard = (i: CardInput) => void cardBlob(i).catch(() => {});

function download(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = FILE_NAME;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function saveImage(i: CardInput) {
  try {
    download(await cardBlob(i));
    toast('画像を保存しました');
  } catch {
    toast('画像を作れませんでした');
  }
}

/** Instagramにはウェブから直接投稿できないので、共有シートが使えればそこから、なければ保存して案内する */
export async function shareInstagram(i: CardInput, text: string) {
  try {
    const file = new File([await cardBlob(i)], FILE_NAME, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return;
    }
    download(file);
    toast('画像を保存しました。Instagramの投稿やストーリーズで使ってね');
  } catch (e) {
    if ((e as Error).name !== 'AbortError') toast('共有できませんでした');
  }
}

export function shareX(text: string) {
  window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast('文章をコピーしました');
  } catch {
    toast('コピーできませんでした');
  }
}
