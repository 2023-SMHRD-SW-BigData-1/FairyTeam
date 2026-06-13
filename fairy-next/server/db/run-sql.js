// schema.sql → seed.sql 을 순서대로 실행하는 편의 스크립트.
//   사용:  node db/run-sql.js          (스키마 + 시드 둘 다)
//          node db/run-sql.js schema   (스키마만)
//          node db/run-sql.js seed     (시드만)
// .env 의 DB 접속정보를 사용. CREATE DATABASE 가 schema에 있어 DB 미존재여도 OK.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const which = process.argv[2]; // 'schema' | 'seed' | undefined(=전부)
const files =
  which === 'schema' ? ['schema.sql'] :
  which === 'seed'   ? ['seed_categories.sql', 'seed.sql'] :
  ['schema.sql', 'seed_categories.sql', 'seed.sql']; // 카테고리(대/중/소) → 나머지 시드

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true, // 한 파일에 여러 SQL 실행 허용
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

try {
  for (const f of files) {
    const sql = fs.readFileSync(path.resolve('db', f), 'utf8');
    await conn.query(sql);
    console.log(`✅ ${f} 실행 완료`);
  }
  console.log('🎉 DB 준비 완료');
} catch (e) {
  console.error('❌ 실패:', e.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
