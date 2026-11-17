import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export function openDatabase(filename){
 if(filename!==':memory:')mkdirSync(dirname(resolve(filename)),{recursive:true});
 const raw=new DatabaseSync(filename);raw.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
 if(filename!==':memory:')raw.exec('PRAGMA journal_mode=WAL;');
 raw.exec('CREATE TABLE IF NOT EXISTS _local_migrations(name TEXT PRIMARY KEY, applied_at TEXT NOT NULL);');
 const migrations=fileURLToPath(new URL('../drizzle/',import.meta.url));
 for(const file of readdirSync(migrations).filter(f=>f.endsWith('.sql')).sort()){
  if(raw.prepare('SELECT name FROM _local_migrations WHERE name=?').get(file))continue;
  raw.exec('BEGIN IMMEDIATE');try{raw.exec(readFileSync(resolve(migrations,file),'utf8'));raw.prepare('INSERT INTO _local_migrations VALUES(?,?)').run(file,new Date().toISOString());raw.exec('COMMIT');}catch(e){raw.exec('ROLLBACK');throw e;}
 }
 const execute=(query,args)=>{const stmt=raw.prepare(query);if(stmt.columns().length)return{results:stmt.all(...args),success:true};const r=stmt.run(...args);return{results:[],success:true,meta:{changes:Number(r.changes)}};};
 const wrapper=(query,args=[])=>({query,args,bind(...values){return wrapper(query,values);},async all(){return execute(query,args);},async first(){return execute(query,args).results[0]||null;},async run(){return execute(query,args);}});
 return{raw,prepare:query=>wrapper(query),async batch(statements){raw.exec('BEGIN IMMEDIATE');try{const result=statements.map(s=>execute(s.query,s.args));raw.exec('COMMIT');return result;}catch(e){raw.exec('ROLLBACK');throw e;}},close(){raw.close();}};
}
