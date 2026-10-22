// Pages Functions の共通部分。ファイル名が _ で始まるのでルートにはならない

export type Env = { DB: D1Database };

export const CAMPUSES = ['kawauchi', 'aobayama', 'katahira', 'seiryo'] as const;
export type Campus = (typeof CAMPUSES)[number];

/** 「いま学んでいる人」に数える、最後の動きからの時間 */
export const ACTIVE_MS = 10 * 60 * 1000;

/** plays の行を残す期間。重複を数えない判定に使うだけなので、1プレイ（3〜6分）より十分長ければよい */
export const KEEP_MS = 2 * 24 * 60 * 60 * 1000;

export const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', ...init.headers } });
