import {test} from 'node:test';
import assert from 'node:assert/strict';
import {docInfo, normalize, forPublish} from '../server/content.mjs';

const ctx = {supabaseUrl: 'https://abc.supabase.co'};
test('deteksi jenis dokumen & pratinjau hanya untuk Google', () => {
  assert.deepEqual(docInfo('https://docs.google.com/document/d/1AbCdEfGhIjKlMnOp/edit?usp=sharing'), {type: 'doc', preview: 'https://docs.google.com/document/d/1AbCdEfGhIjKlMnOp/preview'});
  assert.equal(docInfo('https://docs.google.com/spreadsheets/u/0/d/1AbCdEfGhIjKlMnOp/edit#gid=0').type, 'sheet');
  assert.equal(docInfo('https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOp/edit').preview, 'https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOp/embed');
  assert.equal(docInfo('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=drive_link').preview, 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview');
  assert.equal(docInfo('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp').type, 'drive');
  assert.equal(docInfo('https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp').type, 'folder');
  assert.deepEqual(docInfo('https://www.vfsglobal.com/files/checklist.PDF'), {type: 'pdf', preview: ''});
  assert.deepEqual(docInfo('https://docs.google.com.evil.co/document/d/1AbCdEfGhIjKlMnOp'), {type: 'link', preview: ''});
  assert.equal(docInfo('http://docs.google.com/document/d/1AbCdEfGhIjKlMnOp'), null);
  assert.equal(docInfo('javascript:alert(1)'), null);
});
test('dokumen di artikel & modul: validasi, link internal, baris kosong tidak tayang', () => {
  const a = normalize('article', {title: 'A', category: 'C', description: 'D', sections: [{heading: 'x', html: '<p>y</p>'}],
    docs: [{title: 'SOP', url: 'https://docs.google.com/document/d/1AbCdEfGhIjKlMnOp/edit'}, {title: '', ref: 'article:empathy'}, {title: 'kosong', url: ''}]}, ctx);
  assert.equal(a.docs[0].type, 'doc'); assert.deepEqual(a.docs[1], {title: '', ref: 'article:empathy', type: 'article'});
  assert.equal(forPublish('article', a).docs.length, 2);
  assert.throws(() => normalize('article', {docs: [{url: 'http://x.co/a'}]}, ctx), /https/);
  assert.throws(() => normalize('article', {docs: [{url: 'https://x.co/a"onload'}]}, ctx), /karakter/);
  assert.throws(() => normalize('article', {docs: [{ref: 'quiz:abc'}]}, ctx), /pilih artikel/);
  assert.throws(() => normalize('article', {docs: Array(21).fill({url: ''})}, ctx), /maksimal 20/);
  const c = normalize('course', {title: 'C', category: 'K', description: 'D', lessons: [{title: 'M', intro: 'i', docs: [{title: 'Form', url: 'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOp/edit'}]}]}, ctx);
  assert.equal(c.lessons[0].docs[0].type, 'sheet');
  assert.equal(forPublish('course', c).lessons[0].docs.length, 1);
});
