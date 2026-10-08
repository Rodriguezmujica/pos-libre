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
    { name: 'Refresco / Bebida', price: 1.50, cost: 0.80, stock: 50, category: 'BEBIDAS', barcode: null, min_stock: 5 },
    { name: 'Plato de Comida / Menú', price: 5.00, cost: 2.00, stock: 40, category: 'COMIDA', barcode: null, min_stock: 5 },
    { name: 'Café / Infusión', price: 1.20, cost: 0.30, stock: 100, category: 'BEBIDAS', barcode: null, min_stock: 5 },
    { name: 'Corte de Pelo', price: 8.00, cost: 0, stock: 999, category: 'SERVICIOS', barcode: null, min_stock: 0 },
    { name: 'Postre / Dulce', price: 2.00, cost: 0.80, stock: 30, category: 'COMIDA', barcode: null, min_stock: 5 },
    { name: 'Artículo Varios', price: 3.00, cost: 1.00, stock: 20, category: 'VARIOS', barcode: null, min_stock: 0 }
];

const initializeDatabase = () => {
    db.serialize(() => {
        // 1. Ensure Settings Table Exists FIRST to track seeding status
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )`, (err) => {
            if (err) console.error("Error creating settings table:", err);

            // Default settings for Spain / General POS
            const defaultSettings = [
                ['company', JSON.stringify({
                    name: 'Punto de Venta General',
                    fantasyName: 'Punto de Venta',
                    rut: '',
                    address: 'España',
                    phone: '',
                    giro: 'Ventas generales y servicios'
                })],
                ['ticket', JSON.stringify({
                    showTaxBreakdown: false,
                    showCashier: true,
                    footerText: '¡Muchas gracias por su colaboración!\nQue tenga un excelente día'
                })],
                ['system', JSON.stringify({
                    lowStockAlert: false,
                    autoBackup: false,
                    minStock: 0,
                    taxRate: 21,
                    taxIncluded: true
                })]
            ];

            defaultSettings.forEach(([k, v]) => {
                db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", [k, v]);
            });

            // 2. Create Products Table
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
                variants TEXT,
                total_sold INTEGER DEFAULT 0
            )`, (err) => {
                if (!err) {
                    // SEEDING LOGIC WITH FLAG CHECK
                    db.get("SELECT value FROM settings WHERE key = 'db_seeded'", (err, row) => {
                        const isSeeded = row && row.value === 'true';

                        if (!isSeeded) {
                            // Check if empty (only seed if truly empty AND never seeded before)
                            db.get("SELECT count(*) as count FROM products", (err, row) => {
                                if (!err && row.count === 0) {
                                    console.log("Seeding products (First Run)...");
                                    const stmt = db.prepare("INSERT INTO products (name, price, cost, stock, category, barcode, min_stock, location, image, keywords, variants) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
                                    seedData.forEach(p => {
                                        stmt.run(p.name, p.price, p.cost, p.stock, p.category, p.barcode, p.min_stock, '', null, '[]', p.variants ? JSON.stringify(p.variants) : null);
                                    });
                                    stmt.finalize();

                                    // Mark as seeded
                                    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('db_seeded', 'true')", (err) => {
                                        if (err) console.error("Error setting db_seeded flag:", err);
                                        else console.log("Seeding completed and flag set.");
                                    });
                                } else if (!err && row.count > 0) {
                                    // It has products but flag wasn't set (legacy db?), set flag to avoid future re-seed if they delete all
                                    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('db_seeded', 'true')");
                                }
                            });
                        } else {
                            console.log("Database already seeded. Skipping seed check.");
                        }
                    });
                }
            });
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

        // Settings Table (Created above, leaving this commented or removed to avoid redundancy/errors if async logic overlaps)
        // db.run(...) - Already handled in step 1

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
