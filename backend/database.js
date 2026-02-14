const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.USER_DATA_PATH
    ? path.join(process.env.USER_DATA_PATH, 'pos.db')
    : path.resolve(__dirname, 'pos.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

const seedData = [
    {
        name: 'iPhone 15 Pro Max',
        price: 1200000,
        cost: 950000,
        stock: 12,
        category: 'CELULAR',
        barcode: '194253408456',
        min_stock: 5,
        variants: [
            { id: 'v1-256-nat', name: '256GB - Titanio Natural', price: 1200000, stock: 4 },
            { id: 'v1-256-blue', name: '256GB - Azul Titanio', price: 1200000, stock: 3 },
            { id: 'v1-512-nat', name: '512GB - Titanio Natural', price: 1400000, stock: 5 }
        ]
    },
    { name: 'Sony Alpha A7 IV', price: 2500000, cost: 2100000, stock: 2, category: 'CÁMARA', barcode: '4548736133036', min_stock: 2 },
    { name: 'MacBook Air M3', price: 1100000, cost: 900000, stock: 8, category: 'COMPUTACIÓN', barcode: '194253765123', min_stock: 5 },
    { name: 'Logitech MX Master 3S', price: 100000, cost: 65000, stock: 45, category: 'ACCESORIOS', barcode: '097855169045', min_stock: 5 },
    { name: 'Samsung T9 SSD 2TB', price: 240000, cost: 180000, stock: 18, category: 'ALMACENAMIENTO', barcode: '887276789012', min_stock: 5 }
];

const initializeDatabase = () => {
    db.serialize(() => {
        // Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            cost REAL DEFAULT 0,
            stock INTEGER DEFAULT 0,
            category TEXT,
            barcode TEXT UNIQUE,
            min_stock INTEGER DEFAULT 5,
            location TEXT,
            image TEXT,
            keywords TEXT,
            variants TEXT
        )`, (err) => {
            if (!err) {
                // Migration: Add columns if they don't exist (for existing DBs)
                const columnsToAdd = ['location', 'image', 'keywords', 'variants', 'total_sold'];
                columnsToAdd.forEach(col => {
                    const def = col === 'total_sold' ? 'INTEGER DEFAULT 0' : 'TEXT';
                    db.run(`ALTER TABLE products ADD COLUMN ${col} ${def}`, (err) => {
                        // Ignore error if column already exists
                    });
                });

                // Check if empty and seed
                db.get("SELECT count(*) as count FROM products", (err, row) => {
                    if (!err && row.count === 0) {
                        console.log("Seeding products...");
                        const stmt = db.prepare("INSERT INTO products (name, price, cost, stock, category, barcode, min_stock, location, image, keywords, variants) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
                        seedData.forEach(p => {
                            stmt.run(p.name, p.price, p.cost, p.stock, p.category, p.barcode, p.min_stock, '', null, '[]', p.variants ? JSON.stringify(p.variants) : null);
                        });
                        stmt.finalize();
                        console.log("Seeding completed.");
                    }
                });
            }
        });

        // Sales Table
        db.run(`CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            total REAL NOT NULL,
            payment_method TEXT,
            cashier TEXT,
            status TEXT DEFAULT 'COMPLETED',
            void_reason TEXT,
            voided_by TEXT,
            voided_at TEXT
        )`, (err) => {
            if (!err) {
                // Migration for Sales table
                const salesCols = ['status', 'void_reason', 'voided_by', 'voided_at'];
                salesCols.forEach(col => {
                    const def = col === 'status' ? "TEXT DEFAULT 'COMPLETED'" : "TEXT";
                    db.run(`ALTER TABLE sales ADD COLUMN ${col} ${def}`, (err) => { });
                });
            }
        });

        // Sale Items Table
        db.run(`CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id TEXT NOT NULL,
            product_id INTEGER,
            product_name TEXT, 
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            variant_id TEXT,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`, (err) => {
            if (!err) {
                // Migrations
                db.run(`ALTER TABLE sale_items ADD COLUMN variant_id TEXT`, (err) => { });
                db.run(`ALTER TABLE sale_items ADD COLUMN product_name TEXT`, (err) => { });
            }
        });

        // Cash Sessions Table (apertura/cierre de caja)
        db.run(`CREATE TABLE IF NOT EXISTS cash_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            opened_by TEXT NOT NULL,
            opened_at TEXT NOT NULL,
            initial_amount REAL NOT NULL DEFAULT 0,
            expected_cash REAL NOT NULL DEFAULT 0,
            expected_card REAL NOT NULL DEFAULT 0,
            closed_at TEXT,
            closed_by TEXT,
            counted_cash REAL,
            difference REAL,
            observations TEXT
        )`);

        // Settings Table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )`);

        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'cashier',
            username TEXT UNIQUE,
            password TEXT
        )`, (err) => {
            if (!err) {
                db.get("SELECT count(*) as count FROM users", (err, row) => {
                    if (!err && row.count === 0) {
                        console.log("Seeding default admin user...");
                        const bcrypt = require('bcrypt');
                        const hash = bcrypt.hashSync('admin123', 10);
                        db.run("INSERT INTO users (name, role, username, password) VALUES (?, ?, ?, ?)",
                            ['Admin User', 'ADMIN', 'admin', hash],
                            (err) => {
                                if (err) console.error("Error creating admin user:", err.message);
                                else console.log("Default admin user created.");
                            }
                        );
                    }
                });
            }
        });

        console.log('Database tables initialized.');
    });
};

module.exports = db;
