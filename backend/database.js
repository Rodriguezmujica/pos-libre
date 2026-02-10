const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pos.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

const seedData = [
    { name: 'iPhone 15 Pro Max', price: 1199.00, cost: 950.00, stock: 12, category: 'CELULAR', barcode: '194253408456', min_stock: 5 },
    { name: 'Sony Alpha A7 IV', price: 2499.00, cost: 2100.00, stock: 2, category: 'CÁMARA', barcode: '4548736133036', min_stock: 2 },
    { name: 'MacBook Air M3', price: 1099.00, cost: 899.00, stock: 8, category: 'COMPUTACIÓN', barcode: '194253765123', min_stock: 5 },
    { name: 'Logitech MX Master 3S', price: 99.00, cost: 65.00, stock: 45, category: 'ACCESORIOS', barcode: '097855169045', min_stock: 5 },
    { name: 'Samsung T9 SSD 2TB', price: 239.00, cost: 180.00, stock: 18, category: 'ALMACENAMIENTO', barcode: '887276789012', min_stock: 5 }
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
            keywords TEXT
        )`, (err) => {
            if (!err) {
                // Migration: Add columns if they don't exist (for existing DBs)
                const columnsToAdd = ['location', 'image', 'keywords'];
                columnsToAdd.forEach(col => {
                    db.run(`ALTER TABLE products ADD COLUMN ${col} TEXT`, (err) => {
                        // Ignore error if column already exists
                    });
                });

                // Check if empty and seed
                db.get("SELECT count(*) as count FROM products", (err, row) => {
                    if (!err && row.count === 0) {
                        console.log("Seeding products...");
                        const stmt = db.prepare("INSERT INTO products (name, price, cost, stock, category, barcode, min_stock, location, image, keywords) VALUES (?,?,?,?,?,?,?,?,?,?)");
                        seedData.forEach(p => {
                            stmt.run(p.name, p.price, p.cost, p.stock, p.category, p.barcode, p.min_stock, '', null, '[]');
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
            cashier TEXT
        )`);

        // Sale Items Table
        db.run(`CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id TEXT NOT NULL,
            product_id INTEGER,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
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
