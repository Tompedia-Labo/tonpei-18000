type Attrs = Record<string, string | number | boolean | EventListener | undefined>;
type Child = Node | string | null | undefined | false;

/** 小さな DOM ヘルパー。on〜 はイベント、それ以外は属性 */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

/** 改行（\n）を <br> にして入れる */
export function lines(text: string): DocumentFragment {
  const f = document.createDocumentFragment();
  text.split('\n').forEach((line, i) => {
    if (i) f.append(document.createElement('br'));
    f.append(line);
  });
  return f;
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
