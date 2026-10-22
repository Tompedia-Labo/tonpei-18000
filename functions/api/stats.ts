// GET /api/stats → { entered, finished, campus: { kawauchi, aobayama, ... } }
// 「いま学んでいる人」は、在学を終えておらず直近10分に動きがあったプレイ。エッジで15秒キャッシュする

import { ACTIVE_MS, type Campus, CAMPUSES, type Env, json, KEEP_MS } from './_shared';

const TTL = 15;

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const cache = caches.default;
  const key = new Request(new URL('/api/stats', request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  const [counters, active] = await env.DB.batch([
    env.DB.prepare('SELECT key, n FROM counters'),
    env.DB.prepare('SELECT campus, COUNT(*) AS n FROM plays WHERE finished = 0 AND updated_at > ?1 AND campus IS NOT NULL GROUP BY campus').bind(Date.now() - ACTIVE_MS),
  ]);
  const c = Object.fromEntries((counters.results as { key: string; n: number }[]).map((r) => [r.key, r.n]));
  const campus: Partial<Record<Campus, number>> = {};
  for (const r of active.results as { campus: string; n: number }[]) if ((CAMPUSES as readonly string[]).includes(r.campus)) campus[r.campus as Campus] = r.n;

  const res = json({ entered: c.entered ?? 0, finished: c.finished ?? 0, campus }, { headers: { 'cache-control': `public, max-age=${TTL}` } });
  waitUntil(cache.put(key, res.clone()));
  // 古いプレイの行を消して、表が際限なく大きくならないようにする（数えた結果は counters に残る）。キャッシュが切れたときだけ動く
  waitUntil(env.DB.prepare('DELETE FROM plays WHERE updated_at < ?1').bind(Date.now() - KEEP_MS).run().catch(() => {}));
  return res;
};
