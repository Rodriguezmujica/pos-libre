const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// PRODUCTS
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        const products = rows.map(p => ({
            ...p,
            keywords: p.keywords ? JSON.parse(p.keywords) : []
        }));
        res.json({
            "message": "success",
            "data": products
        });
    });
});

app.post('/api/products', (req, res) => {
    const { name, price, cost, stock, category, barcode, min_stock, location, image, keywords } = req.body;
    const sql = 'INSERT INTO products (name, price, cost, stock, category, barcode, min_stock, location, image, keywords) VALUES (?,?,?,?,?,?,?,?,?,?)';
    const params = [name, price, cost, stock, category, barcode, min_stock, location, image, JSON.stringify(keywords)];

    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": req.body,
            "id": this.lastID
        });
    });
});

app.put('/api/products/:id', (req, res) => {
    const { name, price, cost, stock, category, barcode, min_stock, location, image, keywords } = req.body;
    const sql = `UPDATE products set 
           name = COALESCE(?,name), 
           price = COALESCE(?,price), 
           cost = COALESCE(?,cost), 
           stock = COALESCE(?,stock), 
           category = COALESCE(?,category), 
           barcode = COALESCE(?,barcode), 
           min_stock = COALESCE(?,min_stock),
           location = COALESCE(?,location),
           image = COALESCE(?,image),
           keywords = COALESCE(?,keywords)
           WHERE id = ?`;

    // Keywords must be stringified if present
    const keywordsStr = keywords ? JSON.stringify(keywords) : null;

    const params = [name, price, cost, stock, category, barcode, min_stock, location, image, keywordsStr, req.params.id];

    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            message: "success",
            changes: this.changes
        });
    });
});

app.delete('/api/products/:id', (req, res) => {
    db.run(
        'DELETE FROM products WHERE id = ?',
        req.params.id,
        function (err, result) {
            if (err) {
                res.status(400).json({ "error": res.message });
                return;
            }
            res.json({ "message": "deleted", changes: this.changes });
        });
});

// SALES
app.post('/api/sales', (req, res) => {
    const { id, date, total, payment_method, cashier, items } = req.body;

    // Start Transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const insertSale = 'INSERT INTO sales (id, date, total, payment_method, cashier) VALUES (?,?,?,?,?)';
        db.run(insertSale, [id, date, total, payment_method, cashier], function (err) {
            if (err) {
                console.error("Error inserting sale:", err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            const insertItem = 'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?,?,?,?)';
            const updateStock = 'UPDATE products SET stock = stock - ? WHERE id = ?';

            let itemsProcessed = 0;

            items.forEach(item => {
                // Insert Item
                db.run(insertItem, [id, item.id, item.quantity, item.price], (err) => {
                    if (err) console.error("Error inserting item:", err);
                });

                // Update Stock
                db.run(updateStock, [item.quantity, item.id], (err) => {
                    if (err) console.error("Error updating stock:", err);
                });
                itemsProcessed++;
            });

            db.run('COMMIT');
            res.json({ message: "Sale completed successfully", saleId: id });
        });
    });
});

app.get('/api/sales', (req, res) => {
    const query = `
        SELECT s.id, s.date, s.total, s.payment_method, s.cashier,
               si.quantity, si.price as item_price,
               p.name as product_name
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        ORDER BY s.date DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        const salesMap = {};
        rows.forEach(row => {
            if (!salesMap[row.id]) {
                salesMap[row.id] = {
                    id: row.id,
                    date: row.date,
                    total: row.total,
                    paymentMethod: row.payment_method,
                    cashier: row.cashier,
                    items: [],
                    subtotal: 0,
                    tax: 0
                };
            }
            if (row.product_name) {
                const subtotalItem = row.quantity * row.item_price;
                salesMap[row.id].items.push({
                    name: row.product_name,
                    price: row.item_price,
                    quantity: row.quantity,
                    subtotal: subtotalItem
                });
                salesMap[row.id].subtotal += subtotalItem;
            }
        });

        // Calculate Tax and Finalize
        const salesList = Object.values(salesMap).map(sale => {
            sale.tax = sale.total - sale.subtotal; // Assuming total was stored correctly including tax
            return sale;
        });

        res.json({
            "message": "success",
            "data": salesList
        });
    });
});


// SETTINGS
app.get('/api/settings', (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        // Convert array of {key, value} to single object
        const settingsObj = {};
        rows.forEach(row => {
            try {
                settingsObj[row.key] = JSON.parse(row.value);
            } catch (e) {
                settingsObj[row.key] = row.value;
            }
        });
        res.json({
            "message": "success",
            "data": settingsObj
        });
    });
});

app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    const valueStr = JSON.stringify(value);

    const sql = 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)';
    db.run(sql, [key, valueStr], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "key": key });
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// --- AUTHENTICATION & USERS ---

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'tecniworld_secret_key_change_me'; // In prod, use env var

// Middleware: Authenticate Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Middleware: Authorize Role
const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next();
        } else {
            res.sendStatus(403);
        }
    };
};

// LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ error: "Contraseña incorrecta" });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role
            }
        });
    });
});

// USERS CRUD (Admin Only)

// GET USERS
app.get('/api/users', authenticateToken, authorizeRole('ADMIN'), (req, res) => {
    db.all("SELECT id, name, username, role FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

// CREATE USER
app.post('/api/users', authenticateToken, authorizeRole('ADMIN'), (req, res) => {
    const { name, username, password, role } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    const finalRole = role || 'CASHIER';

    db.run("INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)",
        [name, username, hash, finalRole],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "success", id: this.lastID, user: { name, username, role: finalRole } });
        }
    );
});

// DELETE USER
app.delete('/api/users/:id', authenticateToken, authorizeRole('ADMIN'), (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "deleted", changes: this.changes });
    });
});
