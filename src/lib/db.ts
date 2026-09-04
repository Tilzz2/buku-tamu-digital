import initSqlJs, { type Database } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

const DB_DIR = path.join(PROJECT_ROOT, 'data');
const DB_PATH = path.join(DB_DIR, 'guestbook.db');
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'db', 'migrations');

let _db: Database | null = null;
let _initPromise: Promise<Database> | null = null;

/**
 * Returns a singleton database connection (async on first call to load WASM).
 */
export async function getDb(): Promise<Database> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const SQL = await initSqlJs();

    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    // Load existing DB or create new
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      _db = new SQL.Database(buffer);
    } else {
      _db = new SQL.Database();
    }

    // Performance & integrity settings
    _db.run('PRAGMA journal_mode = WAL');
    _db.run('PRAGMA foreign_keys = ON');

    // Run migrations
    runMigrations(_db);

    // Persist after migrations
    saveDb();

    return _db;
  })();

  return _initPromise;
}

/**
 * Persist the in-memory database to disk.
 * Call this after every write operation.
 */
export function saveDb(): void {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function runMigrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = new Set<number>();
  const result = db.exec('SELECT version FROM schema_version');
  if (result.length > 0) {
    for (const row of result[0].values) {
      applied.add(row[0] as number);
    }
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) return;

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = parseInt(file.split('_')[0], 10);
    if (isNaN(version) || applied.has(version)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    db.run(sql);
    db.run('INSERT OR IGNORE INTO schema_version (version) VALUES (?)', [version]);
    console.log(`[DB] Applied migration: ${file}`);
  }
}

/**
 * Helper: run a single-row query and return the first result as an object.
 */
export function queryOne(db: Database, sql: string, params: any[] = []): Record<string, any> | null {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    stmt.free();
    const obj: Record<string, any> = {};
    cols.forEach((c, i) => { obj[c] = vals[i]; });
    return obj;
  }
  stmt.free();
  return null;
}

/**
 * Helper: run a query and return all results as an array of objects.
 */
export function queryAll(db: Database, sql: string, params: any[] = []): Record<string, any>[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: Record<string, any>[] = [];
  while (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    const obj: Record<string, any> = {};
    cols.forEach((c, i) => { obj[c] = vals[i]; });
    rows.push(obj);
  }
  stmt.free();
  return rows;
}

/**
 * Helper: run an INSERT/UPDATE/DELETE and return { changes, lastId }.
 */
export function runSql(db: Database, sql: string, params: any[] = []): { changes: number; lastId: number } {
  db.run(sql, params);
  const info = db.exec('SELECT changes() as changes, last_insert_rowid() as lastId');
  const changes = info[0]?.values[0]?.[0] as number ?? 0;
  const lastId = info[0]?.values[0]?.[1] as number ?? 0;
  saveDb(); // persist after write
  return { changes, lastId };
}

export { DB_PATH };
