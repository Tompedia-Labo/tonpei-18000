import { STATS, type StatId } from '../data/stats';
import { themeById } from '../data/research';
import { courseName, deptName, faculty, unit } from '../data/structure';
import type { State } from './types';

const CIRCLE_NAME: Record<string, string> = { gachi: 'サークル', yuru: 'サークル' };

export function fill(text: string, s: State): string {
  const p = s.profile;
  const circle = typeof s.flags.circle === 'string' ? CIRCLE_NAME[s.flags.circle] ?? s.flags.circle : 'サークル';
  return text
    .replaceAll('{faculty}', faculty(p.faculty).name)
    .replaceAll('{unit}', unit(p.unit).name)
    .replaceAll('{dept}', p.dept ? deptName(p.dept) : '学科')
    .replaceAll('{course}', p.course ? courseName(p.course) : 'コース')
    .replaceAll('{theme}', (typeof s.flags.theme === 'string' && themeById(s.flags.theme)?.name) || '研究')
    .replaceAll('{circle}', circle);
}

/** 割合は「76%」、人数は「1,511人」の形にする */
export function formatStat(id: StatId): string {
  const v = STATS[id].value;
  return v <= 1 ? `${Math.round(v * 100)}%` : `${v.toLocaleString('ja-JP')}人`;
}

export function fillStatLine(line: string, id: StatId | null, s: State): string | undefined {
  if (!id) return undefined;
  return fill(line, s).replaceAll('{value}', formatStat(id));
}

/** 約3.2万 / 約1,234 / 約1.2億 */
export function formatApprox(n: number): string {
  if (n >= 1e8) return `${trim(n / 1e8)}億`;
  if (n >= 1e4) return `${trim(n / 1e4)}万`;
  return Math.round(n).toLocaleString('ja-JP');
}
const trim = (x: number) => (x >= 100 ? Math.round(x).toLocaleString('ja-JP') : x.toFixed(1).replace(/\.0$/, ''));
