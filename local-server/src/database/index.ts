import Database from 'better-sqlite3';
import { config } from '../config.js';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

let db: Database.Database;

/**
 * 初始化数据库，创建表结构
 */
export function initializeDatabase(): void {
  // 确保数据目录存在
  mkdirSync(dirname(config.dbPath), { recursive: true });

  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      ai_mode TEXT DEFAULT 'openai',
      openai_api_key TEXT DEFAULT '',
      openai_base_url TEXT DEFAULT 'https://api.openai.com/v1',
      openai_model TEXT DEFAULT 'gpt-4o-mini',
      ollama_base_url TEXT DEFAULT 'http://127.0.0.1:11434',
      ollama_model TEXT DEFAULT 'qwen2:7b',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT '',
      style_html TEXT DEFAULT '',
      style_css TEXT DEFAULT '',
      preview TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT DEFAULT '',
      publish_time TEXT DEFAULT '',
      read_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS diagnosis_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      article_count INTEGER DEFAULT 0,
      avg_read_count REAL DEFAULT 0,
      report_text TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS wechat_authorizations (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'default',
      authorizer_appid TEXT UNIQUE NOT NULL,
      nick_name TEXT DEFAULT '',
      service_type TEXT DEFAULT '',
      verify_type TEXT DEFAULT '',
      head_img TEXT DEFAULT '',
      qrcode_url TEXT DEFAULT '',
      principal_name TEXT DEFAULT '',
      authorizer_access_token TEXT DEFAULT '',
      authorizer_refresh_token TEXT DEFAULT '',
      expires_at INTEGER DEFAULT 0,
      func_info TEXT DEFAULT '[]',
      raw_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS short_links (
      slug TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

/**
 * 获取数据库实例
 */
export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}
