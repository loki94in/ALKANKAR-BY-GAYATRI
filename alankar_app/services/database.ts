import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export interface DbProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  origPrice?: number | null;
  stock: number;
  desc: string;
  image: string;
  visible: number; // 0 or 1
  featured: number; // 0 or 1
}

export interface DbSyncItem {
  id: number;
  endpoint: string;
  method: string;
  body: string;
  timestamp: string;
  retries: number;
}

export interface DbOrder {
  id: string;
  date: string;
  name: string;
  phone: string;
  address: string;
  items: string;
  total: number;
  status: string;
}

export function getDb() {
  if (!db) {
    db = SQLite.openDatabaseSync('alankar_db.db');
  }
  return db;
}

export function initDatabase() {
  const database = getDb();
  
  // Create tables in a single transaction-like block
  database.execSync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      origPrice INTEGER,
      stock INTEGER NOT NULL,
      desc TEXT NOT NULL,
      image TEXT NOT NULL,
      visible INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categories (
      name TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      items TEXT NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      body TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      retries INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      productId INTEGER PRIMARY KEY,
      qty INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      productId INTEGER PRIMARY KEY
    );
  `);
}

// Product operations
export function getAllProducts(): DbProduct[] {
  const database = getDb();
  return database.getAllSync<DbProduct>('SELECT * FROM products');
}

export function saveProducts(products: DbProduct[]) {
  const database = getDb();
  database.withTransactionSync(() => {
    // Delete existing products to overwrite with fresh list from server
    database.runSync('DELETE FROM products');
    for (const p of products) {
      database.runSync(
        `INSERT INTO products (id, name, category, price, origPrice, stock, desc, image, visible, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.name, p.category, p.price, p.origPrice ?? null, p.stock, p.desc, p.image, p.visible, p.featured]
      );
    }
  });
}

// Category operations
export function getAllCategories(): string[] {
  const database = getDb();
  const rows = database.getAllSync<{ name: string }>('SELECT name FROM categories');
  return rows.map((r: { name: string }) => r.name);
}

export function saveCategories(categories: string[]) {
  const database = getDb();
  database.withTransactionSync(() => {
    database.runSync('DELETE FROM categories');
    for (const cat of categories) {
      database.runSync('INSERT INTO categories (name) VALUES (?)', [cat]);
    }
  });
}

// Sync Queue operations
export function getQueuedSyncItems(): DbSyncItem[] {
  const database = getDb();
  return database.getAllSync<DbSyncItem>('SELECT * FROM sync_queue ORDER BY id ASC');
}

export function addToSyncQueue(endpoint: string, method: string, body: string) {
  const database = getDb();
  database.runSync(
    'INSERT INTO sync_queue (endpoint, method, body, timestamp, retries) VALUES (?, ?, ?, ?, 0)',
    [endpoint, method.toUpperCase(), body, new Date().toISOString()]
  );
}

export function deleteSyncItem(id: number) {
  const database = getDb();
  database.runSync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

export function incrementSyncRetry(id: number, retries: number) {
  const database = getDb();
  database.runSync('UPDATE sync_queue SET retries = ? WHERE id = ?', [retries, id]);
}

// Order operations
export function getAllOrders(): DbOrder[] {
  const database = getDb();
  return database.getAllSync<DbOrder>('SELECT * FROM orders ORDER BY date DESC');
}

export function saveOrders(orders: DbOrder[]) {
  const database = getDb();
  database.withTransactionSync(() => {
    database.runSync('DELETE FROM orders');
    for (const o of orders) {
      database.runSync(
        `INSERT INTO orders (id, date, name, phone, address, items, total, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [o.id, o.date, o.name, o.phone, o.address, o.items, o.total, o.status]
      );
    }
  });
}

export function addOrderLocal(o: DbOrder) {
  const database = getDb();
  database.runSync(
    `INSERT OR REPLACE INTO orders (id, date, name, phone, address, items, total, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [o.id, o.date, o.name, o.phone, o.address, o.items, o.total, o.status]
  );
}

// Product CRUD operations
export function addProductLocal(p: DbProduct) {
  const database = getDb();
  database.runSync(
    `INSERT OR REPLACE INTO products (id, name, category, price, origPrice, stock, desc, image, visible, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.id, p.name, p.category, p.price, p.origPrice ?? null, p.stock, p.desc, p.image, p.visible, p.featured]
  );
}

export function updateProductLocal(p: DbProduct) {
  const database = getDb();
  database.runSync(
    `UPDATE products SET name = ?, category = ?, price = ?, origPrice = ?, stock = ?, desc = ?, image = ?, visible = ?, featured = ?
     WHERE id = ?`,
    [p.name, p.category, p.price, p.origPrice ?? null, p.stock, p.desc, p.image, p.visible, p.featured, p.id]
  );
}

export function deleteProductLocal(id: number) {
  const database = getDb();
  database.runSync('DELETE FROM products WHERE id = ?', [id]);
}

// Category CRUD operations
export function addCategoryLocal(name: string) {
  const database = getDb();
  database.runSync('INSERT OR IGNORE INTO categories (name) VALUES (?)', [name]);
}

export function deleteCategoryLocal(name: string) {
  const database = getDb();
  database.runSync('DELETE FROM categories WHERE name = ?', [name]);
}
