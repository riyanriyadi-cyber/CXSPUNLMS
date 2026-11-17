// Utilitas HTTP bersama.
export class HttpError extends Error {constructor(status, message) {super(message); this.status = status;}}
export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {status, headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra}});
export const fail = (status, message) => {throw new HttpError(status, message);};
export const sql = (db, query, ...args) => db.prepare(query).bind(...args);

export function protectMutation(request, origin = new URL(request.url).origin) {
  if (['GET', 'HEAD'].includes(request.method)) return;
  if (request.headers.get('origin') !== origin || request.headers.get('x-learning-hub') !== '1') fail(403, 'Permintaan tidak diizinkan. Muat ulang halaman.');
  if (!request.headers.get('content-type')?.startsWith('application/json')) fail(415, 'Gunakan Content-Type application/json.');
}

export async function bodyJSON(request, limit = 16384) {
  const tooBig = () => fail(413, 'Permintaan terlalu besar.');
  if (Number(request.headers.get('content-length') || 0) > limit) tooBig();
  const reader = request.body?.getReader(); if (!reader) fail(400, 'Body JSON diperlukan.');
  const chunks = []; let size = 0;
  while (true) {
    const {value, done} = await reader.read(); if (done) break;
    size += value.byteLength; if (size > limit) {await reader.cancel(); tooBig();}
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0; for (const part of chunks) {bytes.set(part, offset); offset += part.length;}
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail(400, 'Body harus berupa objek JSON.');
    return parsed;
  } catch (e) {if (e instanceof HttpError) throw e; fail(400, 'JSON tidak valid.');}
}
