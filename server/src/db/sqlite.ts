// Maynd.ma Admin API - SQLite Database
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'maynd-admin.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export function initializeDatabase(): void {
  console.log('Initializing Maynd Admin Database...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'support')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY NOT NULL,
      key TEXT UNIQUE NOT NULL,
      product TEXT NOT NULL DEFAULT 'maynd-desktop',
      type TEXT NOT NULL CHECK(type IN ('trial', 'pro', 'enterprise')),
      seats INTEGER NOT NULL DEFAULT 1,
      max_devices INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expired', 'revoked', 'suspended')),
      customer_id TEXT NOT NULL,
      organization TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT,
      hardware_binding BOOLEAN NOT NULL DEFAULT 1,
      usb_binding BOOLEAN NOT NULL DEFAULT 0,
      metadata TEXT NOT NULL DEFAULT '{}'
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY NOT NULL,
      license_id TEXT NOT NULL,
      hardware_fingerprint TEXT NOT NULL,
      hostname TEXT NOT NULL,
      os TEXT NOT NULL,
      arch TEXT NOT NULL,
      cpu TEXT NOT NULL,
      memory INTEGER NOT NULL,
      gpu TEXT,
      ip_address TEXT,
      last_seen TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'blocked')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      size INTEGER NOT NULL,
      parameters INTEGER NOT NULL,
      quant TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('llm', 'embedding')),
      url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'deprecated', 'beta')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS activation_logs (
      id TEXT PRIMARY KEY NOT NULL,
      license_id TEXT NOT NULL,
      device_id TEXT,
      action TEXT NOT NULL CHECK(action IN ('activate', 'validate', 'deactivate', 'block')),
      ip_address TEXT,
      user_agent TEXT,
      success BOOLEAN NOT NULL DEFAULT 1,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(key);
    CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
    CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);
    CREATE INDEX IF NOT EXISTS idx_devices_fingerprint ON devices(hardware_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_devices_license ON devices(license_id);
    CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
    CREATE INDEX IF NOT EXISTS idx_activation_logs_license ON activation_logs(license_id);
    CREATE INDEX IF NOT EXISTS idx_activation_logs_created ON activation_logs(created_at);
  `);

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
  if (adminCount.count === 0) {
    const { scryptSync, randomBytes } = require('crypto');
    const defaultPassword = 'admin123';
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(defaultPassword, salt, 64).toString('hex');
    const passwordHash = `${salt}:${hash}`;
    
    db.prepare(`
      INSERT INTO admin_users (id, username, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      require('crypto').randomUUID(),
      'admin',
      'admin@maynd.ma',
      passwordHash,
      'superadmin',
      'active'
    );
    console.log('Created default admin user (username: admin, password: admin123)');
  }

  console.log('Database initialized successfully!');
}

export default db;
