#!/usr/bin/env node
'use strict';
/**
 * Migrate the old Google Sheet to Supabase.
 *   1. In Google Sheets, for each tab: File → Download → Comma-separated values (.csv)
 *      Put the 5 files in one folder. The file name must contain the tab name (USERS, COURSES, LESSONS, ENROLLMENTS, LESSON_PROGRESS).
 *   2. Dry run (touches nothing):  node scripts/import-from-sheets.js ./export
 *   3. Real import:                node --env-file=.env scripts/import-from-sheets.js ./export --apply
 */
const fs = require('fs');
const path = require('path');
const { importAll } = require('../lib/importer');
const { MemoryStore, getStore } = require('../lib/store');

(async () => {
  const dir = process.argv[2]; const apply = process.argv.includes('--apply');
  if (!dir || !fs.existsSync(dir)) { console.error('Usage: node scripts/import-from-sheets.js <folder-with-csv-files> [--apply]'); process.exit(1); }
  const files = fs.readdirSync(dir); const csv = {};
  ['LESSON_PROGRESS', 'USERS', 'COURSES', 'LESSONS', 'ENROLLMENTS'].forEach((name) => { // longest/most specific names first
    const f = files.find((x) => x.toUpperCase().endsWith('.CSV') && x.toUpperCase().includes(name) && !(name === 'USERS' && 0));
    if (f) csv[name] = fs.readFileSync(path.join(dir, f), 'utf8'); else console.warn('Note: no CSV found for ' + name);
  });
  const report = await importAll(apply ? getStore() : new MemoryStore(), csv);
  console.log((apply ? 'IMPORTED' : 'DRY RUN (nothing written)') + ':', JSON.stringify(report.inserted));
  if (report.skipped.length) { console.log('\nRows that need attention (' + report.skipped.length + '):'); report.skipped.forEach((s) => console.log('  ' + s.table + ' line ' + s.line + ': ' + s.why)); }
  if (!apply) console.log('\nLooks right? Run again with --apply to write to Supabase.');
})().catch((e) => { console.error('Import failed:', e.message); process.exit(1); });
