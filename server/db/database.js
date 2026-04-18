const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'spendwise.db');
let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

const DEFAULT_CATEGORIES = [
  { name: 'Food',       icon: '🍔', color: '#F59E0B' },
  { name: 'Travel',     icon: '✈️',  color: '#3B82F6' },
  { name: 'Bills',      icon: '📄', color: '#EF4444' },
  { name: 'Investment', icon: '📈', color: '#10B981' },
  { name: 'Debt',       icon: '💳', color: '#8B5CF6' },
  { name: 'Drinks',     icon: '🍻', color: '#EC4899' },
];

function initializeDB() {
  const database = getDB();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT NOT NULL,
      email            TEXT UNIQUE NOT NULL,
      google_id        TEXT UNIQUE,
      avatar_url       TEXT,
      currency         TEXT DEFAULT 'INR',
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      name       TEXT NOT NULL,
      icon       TEXT DEFAULT '📦',
      color      TEXT DEFAULT '#6C63FF',
      is_default INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount      REAL NOT NULL,
      date        TEXT NOT NULL,
      notes       TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount      REAL NOT NULL,
      period      TEXT DEFAULT 'month',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      UNIQUE(user_id, category_id)
    );
  `);

  console.log('✅ Database initialized at', DB_PATH);
}

/**
 * Seed default categories for a newly registered user.
 */
function seedDefaultCategories(userId) {
  const db = getDB();
  const insert = db.prepare(
    'INSERT INTO categories (user_id, name, icon, color, is_default) VALUES (?, ?, ?, ?, 1)'
  );
  const insertMany = db.transaction((cats) => {
    for (const cat of cats) insert.run(userId, cat.name, cat.icon, cat.color);
  });
  insertMany(DEFAULT_CATEGORIES);
}

module.exports = { getDB, initializeDB, seedDefaultCategories };
