// POST /api/play  { type: 'start' | 'campus' | 'finish', id, campus? }
// 匿名のプレイIDだけで数える。同じIDの start・finish は1回しか数えない。失敗してもゲームは動く（クライアントは結果を見ない）

import { CAMPUSES, type Env, json } from './_shared';

type Body = { type?: unknown; id?: unknown; campus?: unknown };

const ID = /^[0-9a-z-]{8,64}$/;
const MAX_BYTES = 512;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // 他のサイトから訪問者のブラウザ経由で数を増やされないよう、同じオリジンからの JSON だけを受け付ける。
  // application/json は他のサイトからだと事前確認（CORS）が要り、ここでは許可していないので届かない
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'bad origin' }, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'bad type' }, { status: 415 });
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return json({ error: 'too large' }, { status: 413 });
  let body: Body;
  try {
    body = JSON.parse(raw) as Body;
  } catch {
    return json({ error: 'bad json' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') return json({ error: 'bad json' }, { status: 400 });
  const { type, id, campus } = body;
  if (typeof id !== 'string' || !ID.test(id)) return json({ error: 'bad id' }, { status: 400 });
  if (campus !== undefined && !(CAMPUSES as readonly unknown[]).includes(campus)) return json({ error: 'bad campus' }, { status: 400 });
  const now = Date.now();
  const db = env.DB;

  if (type === 'start') {
    const r = await db.prepare('INSERT INTO plays (id, campus, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(id) DO NOTHING').bind(id, campus ?? null, now).run();
    if (r.meta.changes === 1) await db.prepare("UPDATE counters SET n = n + 1 WHERE key = 'entered'").run();
  } else if (type === 'campus') {
    if (!campus) return json({ error: 'no campus' }, { status: 400 });
    await db.prepare('UPDATE plays SET campus = ?1, updated_at = ?2 WHERE id = ?3 AND finished = 0').bind(campus, now, id).run();
  } else if (type === 'finish') {
    const r = await db.prepare('UPDATE plays SET finished = 1, updated_at = ?1 WHERE id = ?2 AND finished = 0').bind(now, id).run();
    if (r.meta.changes === 1) await db.prepare("UPDATE counters SET n = n + 1 WHERE key = 'finished'").run();
  } else {
    return json({ error: 'bad type' }, { status: 400 });
  }
  return new Response(null, { status: 204 });
};
