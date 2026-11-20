// API admin: kelola materi (draft/publish), unggah gambar, peserta, laporan.
// Hanya dipanggil oleh app.mjs setelah memastikan user.role === 'admin' (dicek dari database setiap request).
import {randomUUID} from 'node:crypto';
import {json, fail, sql, protectMutation, bodyJSON, HttpError} from './http.mjs';
import {KINDS, ID_RE, normalize, forPublish, slugify, mediaPrefix} from './content.mjs';
import {buildRaport, parsePeriod} from './raport.mjs';
import {loadCatalog} from './catalog.mjs';
import {onboardingOverview, saveSettings, updateUserOnboarding} from './onboarding.mjs';

const iso = v => v == null ? null : v instanceof Date ? v.toISOString() : String(v);
const parseJson = v => typeof v === 'string' ? JSON.parse(v) : v;
const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
const NAME_RE = /^[\p{L}\p{N} .,'()-]{2,80}$/u;
const IMAGE_TYPES = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif'};

function status(row) {
  if (!row.published_at) return 'draft';
  return row.revision > row.published_revision ? 'changed' : 'published';
}
function summary(row) {
  const d = parseJson(row.draft);
  return {
    kind: row.kind, id: row.id, title: d.title || '(tanpa judul)', category: d.category || '',
    count: row.kind === 'course' ? d.lessons?.length || 0 : row.kind === 'quiz' ? d.questions?.length || 0 : d.sections?.length || 0,
    status: status(row), revision: row.revision, sortOrder: row.sort_order,
    updatedAt: iso(row.updated_at), publishedAt: iso(row.published_at), updatedBy: row.updated_by_name || null
  };
}

const CONTENT_COLUMNS = 'c.kind,c.id,c.draft,c.published_at,c.sort_order,c.revision,c.updated_at,c.published_revision,u.name AS updated_by_name';

async function getItem(db, kind, id) {
  const row = await sql(db, `SELECT ${CONTENT_COLUMNS} FROM content_items c LEFT JOIN users u ON u.id=c.updated_by WHERE c.kind=? AND c.id=?`, kind, id).first();
  return row || fail(404, 'Konten tidak ditemukan.');
}
const full = row => ({...summary(row), draft: parseJson(row.draft)});

async function userList(db) {
  const rows = await sql(db, `SELECT au.id, au.email, au.created_at, au.last_sign_in_at,
      COALESCE(u.name, au.raw_user_meta_data->>'full_name', split_part(au.email,'@',1)) AS name,
      COALESCE(u.role,'learner') AS role, COALESCE(u.status,'active') AS status,
      COALESCE(u.onboarding_required,false) AS ob_required, u.onboarding_started_at AS ob_started, u.onboarding_due_at AS ob_due, u.onboarding_completed_at AS ob_done,
      (SELECT count(*) FROM enrollments e WHERE e.user_id=au.id) AS courses_enrolled,
      (SELECT count(*) FROM lesson_progress p WHERE p.user_id=au.id) AS lessons_completed,
      (SELECT count(DISTINCT quiz_id) FROM quiz_attempts a WHERE a.user_id=au.id AND a.score>=80) AS quizzes_passed,
      (SELECT max(x) FROM (SELECT max(completed_at) AS x FROM lesson_progress p WHERE p.user_id=au.id
         UNION ALL SELECT max(created_at) FROM quiz_attempts a WHERE a.user_id=au.id) s) AS last_activity
    FROM auth.users au LEFT JOIN users u ON u.id=au.id ORDER BY lower(COALESCE(u.name, au.email))`).all();
  return rows.results.map(r => ({
    id: r.id, name: r.name, email: r.email, role: r.role,
    status: r.status === 'disabled' ? 'disabled' : r.last_sign_in_at ? 'active' : 'invited',
    createdAt: iso(r.created_at), lastSignInAt: iso(r.last_sign_in_at), lastActivity: iso(r.last_activity),
    onboarding: !r.ob_required ? null : r.ob_done ? 'completed' : !r.ob_started ? 'not_started' : Date.now() > Date.parse(iso(r.ob_due)) ? 'overdue' : 'active',
    coursesEnrolled: Number(r.courses_enrolled), lessonsCompleted: Number(r.lessons_completed), quizzesPassed: Number(r.quizzes_passed)
  }));
}

async function authUser(db, id) {
  return await sql(db, `SELECT au.id, au.email, au.last_sign_in_at, COALESCE(u.name, au.raw_user_meta_data->>'full_name', split_part(au.email,'@',1)) AS name
    FROM auth.users au LEFT JOIN users u ON u.id=au.id WHERE au.id=?`, id).first() || fail(404, 'Peserta tidak ditemukan.');
}
async function ensureRow(db, u) {
  await sql(db, 'INSERT INTO users(id,name,email,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING', u.id, u.name, u.email, new Date().toISOString()).run();
}

async function publishedCatalogLite(db) {
  const rows = await sql(db, 'SELECT kind,id,published FROM content_items WHERE published IS NOT NULL ORDER BY sort_order, created_at, id').all();
  return rows.results.map(r => ({kind: r.kind, id: r.id, ...parseJson(r.published)}));
}

export async function adminApi(request, {db, user, origin, config, admin}) {
  try {
    const url = new URL(request.url), path = url.pathname, method = request.method;
    protectMutation(request, origin);
    const ctx = {supabaseUrl: config.supabaseUrl};
    let m;

    // ---------- Materi ----------
    if (path === '/api/admin/content' && method === 'GET') {
      const rows = await sql(db, `SELECT ${CONTENT_COLUMNS} FROM content_items c LEFT JOIN users u ON u.id=c.updated_by ORDER BY c.kind, c.sort_order, c.created_at, c.id`).all();
      return json({items: rows.results.map(summary)});
    }
    if ((m = path.match(/^\/api\/admin\/content\/(course|quiz|article)\/([a-z0-9-]+)$/)) && method === 'GET') {
      return json({item: full(await getItem(db, m[1], m[2]))});
    }
    if ((m = path.match(/^\/api\/admin\/content\/(course|quiz|article)$/)) && method === 'POST') {
      const kind = m[1], body = await bodyJSON(request, 512 * 1024);
      const draft = normalize(kind, body.draft || {}, ctx);
      const base = slugify(draft.title);
      let id = base;
      for (let n = 2; await sql(db, 'SELECT 1 AS x FROM content_items WHERE kind=? AND id=?', kind, id).first(); n++) id = `${base.slice(0, 54)}-${n}`;
      const order = await sql(db, 'SELECT COALESCE(max(sort_order),0)+10 AS n FROM content_items WHERE kind=?', kind).first();
      await sql(db, 'INSERT INTO content_items(kind,id,draft,sort_order,updated_by) VALUES(?,?,?::jsonb,?,?)', kind, id, JSON.stringify(draft), Number(order.n), user.id).run();
      return json({item: full(await getItem(db, kind, id))}, 201);
    }
    if ((m = path.match(/^\/api\/admin\/content\/(course|quiz|article)\/reorder$/)) && method === 'POST') {
      const body = await bodyJSON(request, 64 * 1024);
      if (!Array.isArray(body.ids) || !body.ids.every(id => typeof id === 'string' && ID_RE.test(id))) fail(422, 'Urutan tidak valid.');
      await db.batch(body.ids.map((id, i) => sql(db, 'UPDATE content_items SET sort_order=? WHERE kind=? AND id=?', (i + 1) * 10, m[1], id)));
      return json({ok: true});
    }
    if ((m = path.match(/^\/api\/admin\/content\/(course|quiz|article)\/([a-z0-9-]+)(?:\/(publish|unpublish|delete))?$/)) && method === 'POST') {
      const [, kind, id, action] = m;
      const body = await bodyJSON(request, 512 * 1024);
      const row = await getItem(db, kind, id);
      if (body.baseRevision !== undefined && body.baseRevision !== row.revision) fail(409, `Konten ini baru saja diubah${row.updated_by_name ? ' oleh ' + row.updated_by_name : ''}. Muat ulang untuk melihat versi terbaru.`);
      if (!action) {
        const draft = normalize(kind, body.draft, ctx);
        await sql(db, 'UPDATE content_items SET draft=?::jsonb, revision=revision+1, updated_at=now(), updated_by=? WHERE kind=? AND id=?', JSON.stringify(draft), user.id, kind, id).run();
      } else if (action === 'publish') {
        const draft = normalize(kind, parseJson(row.draft), ctx);
        if (kind === 'quiz' && draft.course) {
          const course = await sql(db, 'SELECT 1 AS x FROM content_items WHERE kind=? AND id=? AND published IS NOT NULL', 'course', draft.course).first();
          if (!course) fail(422, 'Course terkait quiz ini belum tayang. Publish course-nya dulu atau kosongkan pilihan course.');
        }
        const published = forPublish(kind, draft);
        await sql(db, 'UPDATE content_items SET published=?::jsonb, published_at=now(), published_revision=revision, updated_by=? WHERE kind=? AND id=?', JSON.stringify(published), user.id, kind, id).run();
      } else if (action === 'unpublish') {
        await sql(db, 'UPDATE content_items SET published=NULL, published_at=NULL, published_revision=NULL, updated_by=? WHERE kind=? AND id=?', user.id, kind, id).run();
      } else if (action === 'delete') {
        if (row.published_at) fail(409, 'Sembunyikan konten ini dulu (Unpublish) sebelum menghapusnya.');
        await sql(db, 'DELETE FROM content_items WHERE kind=? AND id=?', kind, id).run();
        return json({ok: true});
      }
      return json({item: full(await getItem(db, kind, id))});
    }
    if (path === '/api/admin/media/upload-url' && method === 'POST') {
      const body = await bodyJSON(request);
      const ext = IMAGE_TYPES[body.contentType];
      if (!ext) fail(422, 'Format gambar harus PNG, JPG, WEBP, atau GIF.');
      if (!Number.isInteger(body.size) || body.size <= 0 || body.size > 5 * 1024 * 1024) fail(422, 'Ukuran gambar maksimal 5 MB.');
      const d = new Date(), objectPath = `content/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${ext}`;
      const {uploadUrl} = await admin.signUpload(objectPath);
      return json({uploadUrl, publicUrl: mediaPrefix(config.supabaseUrl) + objectPath});
    }

    // ---------- Peserta ----------
    if (path === '/api/admin/users' && method === 'GET') return json({users: await userList(db), me: user.id});
    if (path === '/api/admin/users/invite' && method === 'POST') {
      const body = await bodyJSON(request);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const role = body.role === 'admin' ? 'admin' : 'learner';
      if (!EMAIL_RE.test(email) || email.length > 254) fail(422, 'Email tidak valid.');
      if (!NAME_RE.test(name)) fail(422, 'Isi nama 2–80 karakter.');
      if (await sql(db, 'SELECT 1 AS x FROM auth.users WHERE lower(email)=?', email).first()) fail(409, 'Email ini sudah terdaftar.');
      const onboarding = role === 'learner' && body.onboarding !== false;
      const {id} = await admin.invite(email, {name, redirectTo: origin + '/'});
      await sql(db, 'INSERT INTO users(id,name,email,role,created_at,onboarding_required) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET role=excluded.role, onboarding_required=excluded.onboarding_required', id, name, email, role, new Date().toISOString(), onboarding).run();
      return json({ok: true, users: await userList(db)}, 201);
    }
    // ---------- Onboarding ----------
    if (path === '/api/admin/onboarding' && method === 'GET') return json(await onboardingOverview(db, await loadCatalog(db)));
    if (path === '/api/admin/onboarding/settings' && method === 'POST') {
      const body = await bodyJSON(request);
      const ids = (await sql(db, "SELECT id FROM content_items WHERE kind='course'").all()).results.map(r => r.id);
      await saveSettings(db, body, ids, user.id);
      return json(await onboardingOverview(db, await loadCatalog(db)));
    }
    if ((m = path.match(/^\/api\/admin\/users\/([0-9a-f-]{36})\/onboarding$/)) && method === 'POST') {
      const body = await bodyJSON(request);
      const u = await authUser(db, m[1]);
      await ensureRow(db, u);
      await updateUserOnboarding(db, u.id, body, user.id);
      return json(await onboardingOverview(db, await loadCatalog(db)));
    }
    if ((m = path.match(/^\/api\/admin\/users\/([0-9a-f-]{36})\/raport$/)) && method === 'GET') {
      const u = await authUser(db, m[1]);
      await ensureRow(db, u);
      return json(await buildRaport(db, u.id, parsePeriod(url)));
    }
    if ((m = path.match(/^\/api\/admin\/users\/([0-9a-f-]{36})$/)) && method === 'GET') {
      const u = await authUser(db, m[1]);
      const catalog = await publishedCatalogLite(db);
      const [p, a, r] = await Promise.all([
        sql(db, 'SELECT course_id,lesson_id FROM lesson_progress WHERE user_id=?', u.id).all(),
        sql(db, "SELECT quiz_id,max(score) AS best,count(*) AS attempts,max(created_at) AS last FROM quiz_attempts WHERE user_id=? AND status='graded' GROUP BY quiz_id", u.id).all(),
        sql(db, 'SELECT count(*) AS n FROM article_reads WHERE user_id=?', u.id).first()
      ]);
      const courses = catalog.filter(c => c.kind === 'course').map(c => {
        const done = p.results.filter(x => x.course_id === c.id && c.lessons.some(l => l.id === x.lesson_id)).length;
        return {id: c.id, title: c.title, done, total: c.lessons.length};
      });
      const quizzes = catalog.filter(q => q.kind === 'quiz').map(q => {
        const x = a.results.find(x => x.quiz_id === q.id);
        return {id: q.id, title: q.title, best: x ? Number(x.best) : null, attempts: x ? Number(x.attempts) : 0, last: iso(x?.last)};
      });
      return json({user: {id: u.id, name: u.name, email: u.email}, courses, quizzes, articlesRead: Number(r.n)});
    }
    if ((m = path.match(/^\/api\/admin\/users\/([0-9a-f-]{36})\/(role|status|resend)$/)) && method === 'POST') {
      const [, id, action] = m, body = await bodyJSON(request);
      if (id === user.id && action !== 'resend') fail(409, 'Kamu tidak bisa mengubah role atau status akunmu sendiri. Minta admin lain melakukannya.');
      const u = await authUser(db, id);
      await ensureRow(db, u);
      if (action === 'role') {
        if (!['admin', 'learner'].includes(body.role)) fail(422, 'Role tidak valid.');
        await sql(db, 'UPDATE users SET role=? WHERE id=?', body.role, id).run();
      } else if (action === 'status') {
        if (!['active', 'disabled'].includes(body.status)) fail(422, 'Status tidak valid.');
        await admin.setBanned(id, body.status === 'disabled');
        await sql(db, 'UPDATE users SET status=? WHERE id=?', body.status, id).run();
      } else {
        if (u.last_sign_in_at) fail(409, 'Peserta ini sudah pernah masuk. Minta dia memakai "Lupa password?" bila perlu.');
        await admin.invite(u.email, {name: u.name, redirectTo: origin + '/'}).catch(e => {if (e.status === 409) fail(409, 'Supabase menolak undangan ulang untuk email ini. Hapus user di Supabase lalu undang lagi.'); throw e;});
      }
      return json({ok: true, users: await userList(db)});
    }

    // ---------- Nilai quiz (matriks peserta × quiz) ----------
    if (path === '/api/admin/scores' && method === 'GET') {
      const period = parsePeriod(url);
      const catalog = (await publishedCatalogLite(db)).filter(x => x.kind === 'quiz');
      const ids = new Set(catalog.map(q => q.id));
      const conds = [], args = [];
      if (period.from) {conds.push('created_at >= ?'); args.push(period.from.toISOString());}
      if (period.to) {conds.push('created_at <= ?'); args.push(period.to.toISOString());}
      const rows = await sql(db, `SELECT user_id,quiz_id,score,status,created_at FROM quiz_attempts ${conds.length ? 'WHERE ' + conds.join(' AND ') : ''} ORDER BY created_at, attempt_id`, ...args).all();
      const cells = {};
      for (const r of rows.results) {
        if (!ids.has(r.quiz_id)) continue;
        const u = cells[r.user_id] ||= {}, c = u[r.quiz_id] ||= {best: null, last: null, attempts: 0, pending: 0, lastAt: null};
        c.attempts++; c.lastAt = iso(r.created_at);
        if (r.status === 'pending') {c.pending++; continue;}
        c.best = Math.max(c.best ?? 0, r.score); c.last = r.score;
      }
      const users = (await userList(db)).map(({id, name, email, role, status}) => ({id, name, email, role, status}));
      return json({quizzes: catalog.map(q => ({id: q.id, title: q.title, category: q.category, questions: q.questions.length})), users, cells, period: {from: period.fromDay, to: period.toDay}, generatedAt: new Date().toISOString()});
    }

    // ---------- Laporan ----------
    if (path === '/api/admin/report' && method === 'GET') {
      const catalog = await publishedCatalogLite(db);
      const [p, e, a] = await Promise.all([
        sql(db, 'SELECT user_id,course_id,lesson_id FROM lesson_progress').all(),
        sql(db, 'SELECT user_id,course_id FROM enrollments').all(),
        sql(db, "SELECT user_id,quiz_id,max(score) AS best,count(*) AS attempts FROM quiz_attempts WHERE status='graded' GROUP BY user_id,quiz_id").all()
      ]);
      const courses = catalog.filter(c => c.kind === 'course').map(c => {
        const ids = new Set(c.lessons.map(l => l.id)), per = new Map();
        for (const x of p.results) if (x.course_id === c.id && ids.has(x.lesson_id)) per.set(x.user_id, (per.get(x.user_id) || 0) + 1);
        const enrolled = new Set(e.results.filter(x => x.course_id === c.id).map(x => x.user_id));
        for (const u of per.keys()) enrolled.add(u);
        const completed = [...per.values()].filter(n => n === c.lessons.length).length;
        const avg = enrolled.size ? Math.round([...enrolled].reduce((s, u) => s + (per.get(u) || 0) / c.lessons.length, 0) / enrolled.size * 100) : 0;
        return {id: c.id, title: c.title, lessons: c.lessons.length, enrolled: enrolled.size, completed, avgProgress: avg};
      });
      const quizzes = catalog.filter(q => q.kind === 'quiz').map(q => {
        const rows = a.results.filter(x => x.quiz_id === q.id);
        return {id: q.id, title: q.title, takers: rows.length, passed: rows.filter(x => Number(x.best) >= 80).length, avgBest: rows.length ? Math.round(rows.reduce((s, x) => s + Number(x.best), 0) / rows.length) : null, attempts: rows.reduce((s, x) => s + Number(x.attempts), 0)};
      });
      return json({courses, quizzes, users: await userList(db), generatedAt: new Date().toISOString()});
    }
    // ---------- Penilaian essay ----------
    const QUIZ_TITLE = "COALESCE(ci.published->>'title', ci.draft->>'title', a.quiz_id)";
    if (path === '/api/admin/grading/count' && method === 'GET') {
      const r = await sql(db, "SELECT count(*) AS n FROM quiz_attempts WHERE status='pending'").first();
      return json({pending: Number(r.n)});
    }
    if (path === '/api/admin/grading' && method === 'GET') {
      const graded = url.searchParams.get('status') === 'graded';
      const rows = await sql(db, `SELECT a.user_id,a.attempt_id,a.quiz_id,a.created_at,a.graded_at,a.score,a.status,u.name,u.email,g.name AS grader,${QUIZ_TITLE} AS quiz_title
        FROM quiz_attempts a JOIN users u ON u.id=a.user_id LEFT JOIN users g ON g.id=a.graded_by LEFT JOIN content_items ci ON ci.kind='quiz' AND ci.id=a.quiz_id
        WHERE ${graded ? "a.status='graded' AND a.review LIKE '%\"type\":\"essay\"%'" : "a.status='pending'"}
        ORDER BY ${graded ? 'a.graded_at DESC NULLS LAST' : 'a.created_at ASC'} LIMIT 200`).all();
      return json({items: rows.results.map(r => ({userId: r.user_id, attemptId: r.attempt_id, quizId: r.quiz_id, quizTitle: r.quiz_title, name: r.name, email: r.email, createdAt: iso(r.created_at), gradedAt: iso(r.graded_at), score: r.score, status: r.status, grader: r.grader}))});
    }
    if ((m = path.match(/^\/api\/admin\/grading\/([0-9a-f-]{36})\/([0-9a-f-]{36})$/))) {
      const [, uid, aid] = m;
      const rec = await sql(db, `SELECT a.*,u.name,u.email,g.name AS grader,${QUIZ_TITLE} AS quiz_title FROM quiz_attempts a JOIN users u ON u.id=a.user_id LEFT JOIN users g ON g.id=a.graded_by LEFT JOIN content_items ci ON ci.kind='quiz' AND ci.id=a.quiz_id WHERE a.user_id=? AND a.attempt_id=?`, uid, aid).first() || fail(404, 'Percobaan quiz tidak ditemukan.');
      const review = parseJson(rec.review);
      if (!review.some(r => r.type === 'essay')) fail(409, 'Percobaan ini tidak berisi essay.');
      if (method === 'POST') {
        const body = await bodyJSON(request, 128 * 1024);
        if (!Array.isArray(body.grades)) fail(422, 'Data nilai tidak valid.');
        review.forEach((r, i) => {
          if (r.type !== 'essay') return;
          const g = body.grades.find(x => x && x.index === i);
          const earned = g ? Number(g.earned) : NaN;
          if (!Number.isFinite(earned) || earned < 0 || earned > r.points || Math.round(earned * 2) !== earned * 2) fail(422, `Pertanyaan ${i + 1}: isi nilai 0–${r.points} (kelipatan 0,5).`);
          const feedback = typeof g.feedback === 'string' ? g.feedback.trim() : '';
          if (feedback.length > 2000) fail(422, `Pertanyaan ${i + 1}: komentar maksimal 2.000 karakter.`);
          r.earned = earned; r.feedback = feedback;
        });
        const max = review.reduce((s, r) => s + r.points, 0), earned = review.reduce((s, r) => s + (r.earned || 0), 0);
        const score = Math.round(earned / max * 100);
        await sql(db, "UPDATE quiz_attempts SET review=?, score=?, status='graded', earned_points=?, max_points=?, graded_at=now(), graded_by=? WHERE user_id=? AND attempt_id=?", JSON.stringify(review), score, earned, max, user.id, uid, aid).run();
        return json({ok: true, score, pending: Number((await sql(db, "SELECT count(*) AS n FROM quiz_attempts WHERE status='pending'").first()).n)});
      }
      if (method === 'GET') return json({attempt: {
        userId: uid, attemptId: aid, quizId: rec.quiz_id, quizTitle: rec.quiz_title, name: rec.name, email: rec.email, status: rec.status, score: rec.score,
        earnedPoints: rec.earned_points === null ? null : Number(rec.earned_points), maxPoints: rec.max_points, createdAt: iso(rec.created_at), gradedAt: iso(rec.graded_at), grader: rec.grader, review
      }});
    }

    // ---------- Impor / ekspor quiz ----------
    if (path === '/api/admin/export/quizzes' && method === 'GET') {
      const rows = await sql(db, "SELECT id,draft,published_at FROM content_items WHERE kind='quiz' ORDER BY sort_order, created_at, id").all();
      return json({quizzes: rows.results.map(r => ({id: r.id, published: Boolean(r.published_at), ...parseJson(r.draft)}))});
    }
    if (path === '/api/admin/import/quizzes' && method === 'POST') {
      const body = await bodyJSON(request, 4 * 1024 * 1024);
      if (!Array.isArray(body.quizzes) || !body.quizzes.length) fail(422, 'File tidak berisi quiz.');
      if (body.quizzes.length > 100) fail(422, 'Maksimal 100 quiz per file.');
      const errors = [], items = [], plans = [];
      const courses = new Set((await sql(db, "SELECT id FROM content_items WHERE kind='course'").all()).results.map(r => r.id));
      for (const qz of body.quizzes) {
        const where = qz.row ? `Baris ${qz.row}` : `Quiz "${qz.title || qz.id}"`;
        let existing = null;
        if (qz.id) {
          existing = await sql(db, "SELECT id,draft,published_at,revision FROM content_items WHERE kind='quiz' AND id=?", String(qz.id)).first();
          if (!existing) {errors.push({row: qz.row, message: `${where}: quiz_id "${qz.id}" tidak ditemukan. Kosongkan quiz_id untuk membuat quiz baru.`}); continue;}
        }
        const base = existing ? parseJson(existing.draft) : {title: '', category: '', description: '', minutes: 5, color: 'peach', course: '', questions: []};
        const pick = (v, fallback) => v === undefined || v === null || String(v).trim() === '' ? fallback : v;
        const draftIn = {...base, title: pick(qz.title, base.title), category: pick(qz.category, base.category), description: pick(qz.description, base.description), minutes: pick(qz.minutes, base.minutes), course: pick(qz.course, base.course)};
        if (!draftIn.title) {errors.push({row: qz.row, message: `${where}: judul_quiz wajib diisi untuk quiz baru.`}); continue;}
        if (draftIn.course && !courses.has(String(draftIn.course))) errors.push({row: qz.row, message: `${where}: course_id "${draftIn.course}" tidak ditemukan.`});
        if (!Array.isArray(qz.questions) || !qz.questions.length) {errors.push({row: qz.row, message: `${where}: quiz "${draftIn.title}" tidak punya pertanyaan.`}); continue;}
        draftIn.questions = [];
        for (const q of qz.questions) {
          const at = `Baris ${q.row ?? '?'}`;
          const type = String(q.type || 'pg').trim().toLowerCase();
          if (!['pg', 'pilihan ganda', 'mc', 'essay', 'esai'].includes(type)) {errors.push({row: q.row, message: `${at}: tipe harus PG atau Essay.`}); continue;}
          const text = String(q.q ?? '').trim();
          if (!text) {errors.push({row: q.row, message: `${at}: pertanyaan kosong.`}); continue;}
          const points = pick(q.points, undefined);
          if (points !== undefined && !(Number.isInteger(Number(points)) && Number(points) >= 1 && Number(points) <= 100)) {errors.push({row: q.row, message: `${at}: poin harus angka bulat 1–100.`}); continue;}
          if (type === 'essay' || type === 'esai') {draftIn.questions.push({type: 'essay', q: text, points, rubric: String(q.explanation ?? '')}); continue;}
          const options = (Array.isArray(q.options) ? q.options : []).map(o => String(o ?? '').trim());
          while (options.length && !options[options.length - 1]) options.pop();
          if (options.length < 2 || options.some(o => !o)) {errors.push({row: q.row, message: `${at}: isi minimal 2 pilihan berurutan (A, B, …) tanpa yang kosong di tengah.`}); continue;}
          const letter = String(q.answer ?? '').trim().toUpperCase();
          const answer = /^[A-F]$/.test(letter) ? letter.charCodeAt(0) - 65 : /^[1-6]$/.test(letter) ? Number(letter) - 1 : -1;
          if (answer < 0 || answer >= options.length) {errors.push({row: q.row, message: `${at}: jawaban_benar harus huruf A–${String.fromCharCode(64 + options.length)}.`}); continue;}
          draftIn.questions.push({type: 'mc', q: text, options, answer, why: String(q.explanation ?? ''), points});
        }
        let draft;
        try {draft = normalize('quiz', draftIn, ctx);} catch (e) {errors.push({row: qz.row, message: `${where}: ${e.message}`}); continue;}
        let warning = '';
        try {forPublish('quiz', structuredClone(draft));} catch (e) {warning = e.message;}
        items.push({id: existing?.id || null, title: draft.title, action: existing ? 'update' : 'create', questions: draft.questions.length, essays: draft.questions.filter(q => q.type === 'essay').length, published: Boolean(existing?.published_at), warning});
        plans.push({existing, draft});
      }
      const summary = {create: items.filter(i => i.action === 'create').length, update: items.filter(i => i.action === 'update').length, questions: items.reduce((s, i) => s + i.questions, 0)};
      if (errors.length || body.dryRun) return json({dryRun: true, ok: !errors.length, errors, items, summary});
      for (const {existing, draft} of plans) {
        if (existing) await sql(db, "UPDATE content_items SET draft=?::jsonb, revision=revision+1, updated_at=now(), updated_by=? WHERE kind='quiz' AND id=?", JSON.stringify(draft), user.id, existing.id).run();
        else {
          const base = slugify(draft.title); let id = base;
          for (let n = 2; await sql(db, "SELECT 1 AS x FROM content_items WHERE kind='quiz' AND id=?", id).first(); n++) id = `${base.slice(0, 54)}-${n}`;
          const order = await sql(db, "SELECT COALESCE(max(sort_order),0)+10 AS n FROM content_items WHERE kind='quiz'").first();
          await sql(db, "INSERT INTO content_items(kind,id,draft,sort_order,updated_by) VALUES('quiz',?,?::jsonb,?,?)", id, JSON.stringify(draft), Number(order.n), user.id).run();
        }
      }
      return json({dryRun: false, ok: true, errors: [], items, summary});
    }
    fail(404, 'Endpoint admin tidak ditemukan.');
  } catch (error) {
    if (!(error instanceof HttpError)) console.error('Admin API error:', error.message);
    return json({error: error instanceof HttpError ? error.message : 'Server mengalami kendala. Coba lagi.'}, error.status || 500);
  }
}
