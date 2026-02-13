const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');

console.log(`Initializing database at: ${dbPath}`);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Failed to connect:", err);
        process.exit(1);
    }
});

db.serialize(() => {
    // Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'CASHIER'
    )`, (err) => {
        if (err) console.error("Error creating users table:", err);
        else console.log("Users table OK");
    });

    // Products
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        color TEXT,
        barcode TEXT UNIQUE
    )`, (err) => {
        if (err) console.error("Error creating products:", err);
        else console.log("Products table OK");
    });

    // Sales
    db.run(`CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        date TEXT NOT NULL,
        payment_method TEXT,
        user_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) console.error("Error creating sales:", err);
        else console.log("Sales table OK");
    });

    // Sale Items
    db.run(`CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY(sale_id) REFERENCES sales(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )`, (err) => {
        if (err) console.error("Error creating sale_items:", err);
        else console.log("Sale Items table OK");
    });

    // Cash Sessions
    db.run(`CREATE TABLE IF NOT EXISTS cash_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opened_by TEXT NOT NULL,
        opened_at TEXT NOT NULL,
        initial_amount REAL NOT NULL,
        closed_at TEXT,
        closed_by TEXT,
        final_cash REAL,
        final_card REAL,
        expected_cash REAL,
        expected_card REAL,
        notes TEXT
    )`, (err) => {
        if (err) console.error("Error creating cash_sessions:", err);
        else console.log("Cash Sessions table OK");
    });

    // Settings
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`, (err) => {
        if (err) console.error("Error creating settings:", err);
        else console.log("Settings table OK");
    });
});

db.close();
