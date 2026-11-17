import {sqliteTable,text,integer,primaryKey,index} from 'drizzle-orm/sqlite-core';
export const users=sqliteTable('users',{
 id:text('id').primaryKey(),name:text('name').notNull(),email:text('email').notNull(),createdAt:text('created_at').notNull()
});
export const accounts=sqliteTable('local_accounts',{
 userId:text('user_id').primaryKey().references(()=>users.id,{onDelete:'cascade'}),
 email:text('email').notNull().unique(),passwordHash:text('password_hash').notNull()
});
export const sessions=sqliteTable('sessions',{
 tokenHash:text('token_hash').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),expiresAt:integer('expires_at').notNull()
},t=>[index('session_user_idx').on(t.userId),index('session_expiry_idx').on(t.expiresAt)]);
export const throttle=sqliteTable('auth_throttle',{
 bucket:text('bucket').primaryKey(),count:integer('count').notNull(),resetAt:integer('reset_at').notNull()
});
export const enrollments=sqliteTable('enrollments',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),courseId:text('course_id').notNull(),createdAt:text('created_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.courseId]})]);
export const progress=sqliteTable('lesson_progress',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),courseId:text('course_id').notNull(),lessonIndex:integer('lesson_index').notNull(),completedAt:text('completed_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.courseId,t.lessonIndex]})]);
export const bookmarks=sqliteTable('bookmarks',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),kind:text('kind').notNull(),contentId:text('content_id').notNull(),createdAt:text('created_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.kind,t.contentId]})]);
export const reads=sqliteTable('article_reads',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),articleId:text('article_id').notNull(),readAt:text('read_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.articleId]})]);
export const attempts=sqliteTable('quiz_attempts',{
 userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),attemptId:text('attempt_id').notNull(),quizId:text('quiz_id').notNull(),score:integer('score').notNull(),answers:text('answers').notNull(),review:text('review').notNull(),contentVersion:text('content_version').notNull(),createdAt:text('created_at').notNull()
},t=>[primaryKey({columns:[t.userId,t.attemptId]}),index('attempt_user_quiz_idx').on(t.userId,t.quizId)]);
