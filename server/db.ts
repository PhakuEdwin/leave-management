import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(__dirname, '..', '..', 'leave_management.db');

const db: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    employeeTitle TEXT DEFAULT '',
    preferredName TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin', 'staff')),
    leaveBalance INTEGER NOT NULL DEFAULT 21,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    leaveType TEXT NOT NULL CHECK(leaveType IN ('Normal Leave', 'Study / Exam Leave', 'Family Responsibility')),
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    totalDays INTEGER NOT NULL,
    reason TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'declined')),
    processedBy INTEGER,
    processedAt TEXT,
    declineReason TEXT DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (processedBy) REFERENCES users(id)
  );
`);

// Seed default admin if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (username, password, firstName, lastName, role, leaveBalance)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('admin', hashedPassword, 'Dr P', 'Malatji', 'admin', 999);
  console.log('Default admin user created (username: admin, password: admin123)');
}

export default db;
