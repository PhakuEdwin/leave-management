import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(__dirname, '..', '..', 'leave_management.db');

// Wrapper that mimics better-sqlite3's synchronous API
class DatabaseWrapper {
  private db!: SqlJsDatabase;
  private _ready = false;

  get ready() { return this._ready; }

  async init() {
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }
    this._ready = true;

    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON');

    // Initialize tables
    this.db.run(`
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
      )
    `);

    this.db.run(`
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
      )
    `);

    // Seed default admin if no users exist
    const countResult = this.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    if (countResult.count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      this.prepare(`
        INSERT INTO users (username, password, firstName, lastName, role, leaveBalance)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('admin', hashedPassword, 'Dr P', 'Malatji', 'admin', 999);
      console.log('Default admin user created (username: admin, password: admin123)');
    }
  }

  private save() {
    const data = this.db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  prepare(sql: string) {
    const self = this;
    return {
      get(...params: any[]): any {
        const stmt = self.db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        let result: any = undefined;
        if (stmt.step()) {
          result = stmt.getAsObject();
        }
        stmt.free();
        return result;
      },
      all(...params: any[]): any[] {
        const stmt = self.db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const results: any[] = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },
      run(...params: any[]): { lastInsertRowid: number; changes: number } {
        self.db.run(sql, params);
        self.save();
        const rowid = self.db.exec("SELECT last_insert_rowid()");
        const lastInsertRowid = rowid[0]?.values[0]?.[0] as number ?? 0;
        const changes = self.db.getRowsModified();
        return { lastInsertRowid, changes };
      }
    };
  }

  pragma(pragma: string) {
    this.db.run(`PRAGMA ${pragma}`);
  }

  exec(sql: string) {
    this.db.run(sql);
    this.save();
  }
}

const db = new DatabaseWrapper();
export default db;
export { db };
