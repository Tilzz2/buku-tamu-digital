import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../data/guestbook.db');
const backupsDir = path.resolve(__dirname, '../data/backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
  console.error('Database file not found at:', dbPath);
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupsDir, `guestbook_backup_${timestamp}.db`);

try {
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Database successfully backed up to: ${backupPath}`);
  
  // Cleanup old backups (keep last 7)
  const files = fs.readdirSync(backupsDir)
    .filter(f => f.endsWith('.db'))
    .map(f => ({ name: f, time: fs.statSync(path.join(backupsDir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  if (files.length > 7) {
    for (let i = 7; i < files.length; i++) {
      fs.unlinkSync(path.join(backupsDir, files[i].name));
      console.log(`🗑️  Deleted old backup: ${files[i].name}`);
    }
  }
} catch (error) {
  console.error('❌ Failed to backup database:', error);
}
