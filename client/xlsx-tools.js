// Baca/tulis Excel untuk impor-ekspor quiz di panel admin (dimuat hanya saat dibutuhkan).
// Versi "universal" dipakai karena tidak membuat Web Worker (CSP worker-src tidak dibuka).
import {readSheet} from 'read-excel-file/universal';
import writeXlsxFile from 'write-excel-file/browser';

export async function read(file) {
  return readSheet(file, 1);
}
export async function write(sheets, fileName) {
  await writeXlsxFile(sheets.map(s => ({sheet: s.name, data: s.rows.map((r, i) => r.map(v => i === 0 ? {value: v, fontWeight: 'bold', backgroundColor: '#FFF0E5'} : v === '' || v === null || v === undefined ? null : {value: v, wrap: true})), columns: s.widths?.map(width => ({width})), stickyRowsCount: 1}))).toFile(fileName);
}
