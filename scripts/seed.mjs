/**
 * Seed script: populates the database with demo data for development.
 * Run with: npm run db:seed
 */
import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(PROJECT_ROOT, 'data');
const DB_PATH = path.join(DB_DIR, 'guestbook.db');
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'db', 'migrations');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const SQL = await initSqlJs();
let db;
if (fs.existsSync(DB_PATH)) {
  db = new SQL.Database(fs.readFileSync(DB_PATH));
} else {
  db = new SQL.Database();
}

// Run migrations
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
for (const file of migrationFiles) {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
  db.run(sql);
  console.log(`Applied migration: ${file}`);
}

// ─── Seed data ───────────────────────────────────────────────────────────────

// Admin (password: admin123)
const adminHash = bcrypt.hashSync('admin123', 10);
db.run(`INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)`, [adminHash ? 'admin' : 'admin', adminHash]);
// Fix: use correct parameter order
try {
  db.run(`INSERT INTO admins (username, password_hash) VALUES (?, ?)`, ['admin', adminHash]);
} catch (e) {
  // Already exists, ignore
}
console.log('Seeded admin user (admin / admin123)');

// Staff members
const staffMembers = [
  ['Dr. Siti Nurhaliza', 'Direktur', 'siti@example.local'],
  ['Budi Santoso', 'Keuangan', 'budi@example.local'],
  ['Rina Marlina', 'SDM', 'rina@example.local'],
  ['Ahmad Fauzi', 'IT', 'ahmad@example.local'],
  ['Dewi Lestari', 'Humas', 'dewi@example.local'],
  ['Pak Joko Widodo', 'Umum', 'joko@example.local'],
  ['Ibu Maya Sari', 'Akademik', 'maya@example.local'],
  ['Rudi Hartono', 'Keamanan', 'rudi@example.local'],
];

for (const [name, dept, email] of staffMembers) {
  try {
    db.run(`INSERT INTO staff (name, department, email) VALUES (?, ?, ?)`, [name, dept, email]);
  } catch (e) { /* duplicate */ }
}
console.log(`Seeded ${staffMembers.length} staff members`);

// Visit categories
const categories = [
  'Rapat/Meeting', 'Konsultasi', 'Pengiriman Barang', 'Tamu Dinas',
  'Wawancara', 'Kunjungan Kerja', 'Keperluan Pribadi', 'Lainnya',
];

for (const c of categories) {
  try {
    db.run(`INSERT INTO visit_categories (name) VALUES (?)`, [c]);
  } catch (e) { /* duplicate */ }
}
console.log(`Seeded ${categories.length} visit categories`);

// Save to disk
const data = db.export();
fs.writeFileSync(DB_PATH, Buffer.from(data));
db.close();

console.log('\nSeed complete! Database ready at:', DB_PATH);
