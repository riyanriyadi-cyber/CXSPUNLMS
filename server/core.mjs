// API peserta: katalog (konten yang sudah publish), progres, bookmark, artikel dibaca, quiz.
import {json, fail, sql, protectMutation, bodyJSON, HttpError} from './http.mjs';
import {escapeDeep} from './content.mjs';
import {loadCatalog} from './catalog.mjs';
import {buildRaport, parsePeriod} from './raport.mjs';
export {json, HttpError};

const iso = v => v instanceof Date ? v.toISOString() : String(v);
const parseJson = v => typeof v === 'string' ? JSON.parse(v) : v;

export {loadCatalog};

// Versi aman untuk browser: tanpa kunci jawaban/pembahasan, semua teks di-escape.
export function safeCatalog(catalog) {
  return escapeDeep({
    courses: catalog.courses.map(({version, ...c}) => c),
    quizzes: catalog.quizzes.map(({version, ...q}) => ({...q, questions: q.questions.map(({q, options}) => ({q, options}))})),
    articles: catalog.articles.map(({version, ...a}) => ({...a, publishedAt: version}))
  });
}

const find = (list, id, message) => list.find(x => x.id === id) || fail(404, message);

export async function learningState(db, userId, catalog) {
  const [p, e, b, r, a] = await Promise.all([
    sql(db, 'SELECT course_id,lesson_id,completed_at FROM lesson_progress WHERE user_id=? ORDER BY completed_at', userId).all(),
    sql(db, 'SELECT course_id FROM enrollments WHERE user_id=? ORDER BY created_at', userId).all(),
    sql(db, 'SELECT kind,content_id FROM bookmarks WHERE user_id=? ORDER BY created_at', userId).all(),
    sql(db, 'SELECT article_id FROM article_reads WHERE user_id=?', userId).all(),
    sql(db, 'SELECT quiz_id,score,created_at FROM quiz_attempts WHERE user_id=? ORDER BY created_at,attempt_id', userId).all()
  ]);
  const has = (list, id) => list.some(x => x.id === id);
  const progress = Object.fromEntries(catalog.courses.map(c => [c.id, []]));
  const activity = [];
  const dateFormat = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit'});
  for (const row of p.results) {
    const c = catalog.courses.find(c => c.id === row.course_id);
    const index = c ? c.lessons.findIndex(l => l.id === row.lesson_id) : -1;
    if (index < 0) continue;
    progress[c.id].push(index);
    activity.push({date: dateFormat.format(new Date(row.completed_at)), minutes: c.lessons[index].duration});
  }
  const results = {};
  for (const row of a.results) {
    if (!has(catalog.quizzes, row.quiz_id)) continue;
    const prev = results[row.quiz_id];
    results[row.quiz_id] = {score: Math.max(prev?.score || 0, row.score), lastScore: row.score, attempts: (prev?.attempts || 0) + 1, date: iso(row.created_at)};
  }
  return {
    version: 3, progress,
    enrolled: e.results.map(x => x.course_id).filter(id => has(catalog.courses, id)),
    savedCourses: b.results.filter(x => x.kind === 'course' && has(catalog.courses, x.content_id)).map(x => x.content_id),
    savedArticles: b.results.filter(x => x.kind === 'article' && has(catalog.articles, x.content_id)).map(x => x.content_id),
    readArticles: r.results.map(x => x.article_id).filter(id => has(catalog.articles, id)),
    results, activity
  };
}

function attemptResult(record) {
  const review = parseJson(record.review);
  return escapeDeep({id: record.attempt_id, score: record.score, correct: review.filter(r => r.correct).length, total: review.length, passed: record.score >= 80, answers: parseJson(record.answers), review, quizId: record.quiz_id, createdAt: iso(record.created_at)});
}

export async function api(request, {db, user, origin}) {
  try {
    if (!user?.id) fail(401, 'Silakan masuk untuk melanjutkan.');
    const path = new URL(request.url).pathname, method = request.method;
    protectMutation(request, origin);
    const catalog = await loadCatalog(db);
    if (path === '/api/catalog' && method === 'GET') return json(safeCatalog(catalog));
    if (path === '/api/me/raport' && method === 'GET') return json(await buildRaport(db, user.id, parsePeriod(new URL(request.url)), catalog));
    if (path === '/api/me' && method === 'GET') return json({profile: {id: user.id, name: user.name, email: user.email, role: user.role || 'learner'}, state: await learningState(db, user.id, catalog)});
    let m;
    const now = new Date().toISOString();
    if (method === 'POST' && (m = path.match(/^\/api\/courses\/([a-z0-9-]+)\/enroll$/))) {
      find(catalog.courses, m[1], 'Course tidak ditemukan.'); await bodyJSON(request);
      await sql(db, 'INSERT INTO enrollments(user_id,course_id,created_at) VALUES(?,?,?) ON CONFLICT DO NOTHING', user.id, m[1], now).run();
    } else if (method === 'POST' && (m = path.match(/^\/api\/courses\/([a-z0-9-]+)\/lessons\/(\d+)\/complete$/))) {
      const c = find(catalog.courses, m[1], 'Course tidak ditemukan.'), data = await bodyJSON(request);
      const lesson = typeof data.lessonId === 'string' ? c.lessons.find(l => l.id === data.lessonId) : c.lessons[Number(m[2])];
      if (!lesson) fail(404, 'Modul tidak ditemukan. Muat ulang halaman.');
      await db.batch([
        sql(db, 'INSERT INTO enrollments(user_id,course_id,created_at) VALUES(?,?,?) ON CONFLICT DO NOTHING', user.id, c.id, now),
        sql(db, 'INSERT INTO lesson_progress(user_id,course_id,lesson_id,completed_at) VALUES(?,?,?,?) ON CONFLICT DO NOTHING', user.id, c.id, lesson.id, now)
      ]);
    } else if (path === '/api/bookmarks' && method === 'POST') {
      const data = await bodyJSON(request);
      if (!['course', 'article'].includes(data.kind) || typeof data.saved !== 'boolean' || typeof data.id !== 'string') fail(422, 'Jenis, ID, dan status simpan tidak valid.');
      find(data.kind === 'course' ? catalog.courses : catalog.articles, data.id, data.kind === 'course' ? 'Course tidak ditemukan.' : 'Artikel tidak ditemukan.');
      if (data.saved) await sql(db, 'INSERT INTO bookmarks(user_id,kind,content_id,created_at) VALUES(?,?,?,?) ON CONFLICT DO NOTHING', user.id, data.kind, data.id, now).run();
      else await sql(db, 'DELETE FROM bookmarks WHERE user_id=? AND kind=? AND content_id=?', user.id, data.kind, data.id).run();
    } else if (method === 'POST' && (m = path.match(/^\/api\/articles\/([a-z0-9-]+)\/read$/))) {
      find(catalog.articles, m[1], 'Artikel tidak ditemukan.'); await bodyJSON(request);
      await sql(db, 'INSERT INTO article_reads(user_id,article_id,read_at) VALUES(?,?,?) ON CONFLICT DO NOTHING', user.id, m[1], now).run();
    } else if (method === 'POST' && (m = path.match(/^\/api\/quizzes\/([a-z0-9-]+)\/attempts$/))) {
      const q = find(catalog.quizzes, m[1], 'Quiz tidak ditemukan.'), data = await bodyJSON(request);
      if (typeof data.attemptId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.attemptId)) fail(422, 'ID percobaan tidak valid.');
      if (!Array.isArray(data.answers) || data.answers.length !== q.questions.length || data.answers.some((v, i) => !Number.isInteger(v) || v < 0 || v >= q.questions[i].options.length)) fail(422, 'Jawab semua pertanyaan dengan pilihan yang valid. Jika quiz baru diperbarui, muat ulang halaman.');
      const review = q.questions.map((question, i) => ({q: question.q, options: question.options, selected: data.answers[i], answer: question.answer, correct: data.answers[i] === question.answer, why: question.why}));
      const score = Math.round(review.filter(x => x.correct).length / review.length * 100);
      await sql(db, 'INSERT INTO quiz_attempts(user_id,attempt_id,quiz_id,score,answers,review,content_version,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING', user.id, data.attemptId, q.id, score, JSON.stringify(data.answers), JSON.stringify(review), q.version, now).run();
      const record = await sql(db, 'SELECT * FROM quiz_attempts WHERE user_id=? AND attempt_id=?', user.id, data.attemptId).first();
      if (record.quiz_id !== q.id || record.answers !== JSON.stringify(data.answers)) fail(409, 'ID percobaan telah digunakan untuk jawaban yang berbeda.');
      return json({result: attemptResult(record), state: await learningState(db, user.id, catalog)});
    } else if (method === 'GET' && (m = path.match(/^\/api\/quizzes\/([a-z0-9-]+)\/attempts$/))) {
      const q = find(catalog.quizzes, m[1], 'Quiz tidak ditemukan.');
      const records = await sql(db, 'SELECT * FROM quiz_attempts WHERE user_id=? AND quiz_id=? ORDER BY created_at DESC LIMIT 50', user.id, q.id).all();
      return json({attempts: records.results.map(attemptResult)});
    } else fail(404, 'Endpoint tidak ditemukan.');
    return json({state: await learningState(db, user.id, catalog)});
  } catch (error) {
    if (!(error instanceof HttpError)) console.error('Learning API error:', error.message);
    return json({error: error instanceof HttpError ? error.message : 'Server mengalami kendala. Coba lagi.'}, error.status || 500);
  }
}
