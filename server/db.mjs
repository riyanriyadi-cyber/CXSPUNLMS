// Adapter Postgres dengan antarmuka yang sama seperti versi SQLite/D1 sebelumnya
// (prepare → bind → all/first/run, dan batch), sehingga server/core.mjs tidak perlu diubah.
// Placeholder `?` diterjemahkan menjadi $1, $2, ... untuk Postgres.

const toPg = query => {let n = 0; return query.replace(/\?/g, () => `$${++n}`);};

/**
 * @param {{query:(text:string,params:any[])=>Promise<any[]>, transaction:(fn:(query:(text:string,params:any[])=>Promise<any[]>)=>Promise<any>)=>Promise<any>}} executor
 */
export function createDb(executor) {
  const statement = (query, args = []) => ({
    query, args,
    bind: (...values) => statement(query, values),
    async all() {return {results: await executor.query(toPg(query), args), success: true};},
    async first() {return (await executor.query(toPg(query), args))[0] || null;},
    async run() {await executor.query(toPg(query), args); return {results: [], success: true};}
  });
  return {
    prepare: query => statement(query),
    async batch(statements) {
      return executor.transaction(async query => {
        const out = [];
        for (const s of statements) out.push({results: await query(toPg(s.query), s.args), success: true});
        return out;
      });
    }
  };
}

// Produksi: postgres.js lewat Supabase connection pooler (transaction mode, port 6543).
// prepare:false wajib untuk transaction pooler.
let pooled;
export async function productionDb() {
  if (pooled) return pooled;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum diatur.');
  const {default: postgres} = await import('postgres');
  const url = process.env.DATABASE_URL, local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const sql = postgres(url, {prepare: false, max: Number(process.env.DB_POOL_MAX) || 3, idle_timeout: 20, connect_timeout: 10, ssl: local ? false : 'require'});
  pooled = createDb({
    query: (text, params) => sql.unsafe(text, params),
    transaction: fn => sql.begin(tx => fn((text, params) => tx.unsafe(text, params)))
  });
  return pooled;
}
