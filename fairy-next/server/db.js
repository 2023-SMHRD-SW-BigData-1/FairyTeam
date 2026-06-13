// DB 연결 = workspace05의 DataSource / application.properties 의 DB 부분.
import 'dotenv/config';
import mysql from 'mysql2/promise';

// 커넥션 풀: 연결을 미리 여러 개 만들어두고 재사용 (성능)
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fairy',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4', // 한글/이모지 안전
  // 트랜잭션·여러 행 처리용. 클라우드 DB가 SSL 요구 시 DB_SSL=true
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
