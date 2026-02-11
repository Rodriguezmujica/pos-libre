const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- AUTH DEPENDENCIES ---
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'tecniworld_secret_key_change_me'; // In prod, use env var

// --- MIDDLEWARE ---
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

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next();
        } else {
            res.sendStatus(403);
        }
    };
};

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
            keywords: p.keywords ? JSON.parse(p.keywords) : [],
            variants: p.variants ? JSON.parse(p.variants) : null
        }));
        res.json({
            "message": "success",
            "data": products
        });
    });
});

app.post('/api/products', (req, res) => {
    const { name, price, cost, stock, category, barcode, min_stock, location, image, keywords, variants } = req.body;
    const sql = 'INSERT INTO products (name, price, cost, stock, category, barcode, min_stock, location, image, keywords, variants) VALUES (?,?,?,?,?,?,?,?,?,?,?)';
    const params = [name, price, cost, stock, category, barcode, min_stock, location, image, JSON.stringify(keywords), variants ? JSON.stringify(variants) : null];

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
    const { name, price, cost, stock, category, barcode, min_stock, location, image, keywords, variants } = req.body;
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
           keywords = COALESCE(?,keywords),
           variants = COALESCE(?,variants)
           WHERE id = ?`;

    // Keywords and Variants must be stringified if present
    const keywordsStr = keywords ? JSON.stringify(keywords) : null;
    const variantsStr = variants ? JSON.stringify(variants) : null;

    console.log(`[PUT Product ${req.params.id}] Updating...`);
    console.log("Variants received:", variants);
    console.log("VariantesStr len:", variantsStr ? variantsStr.length : 'null');
    console.log("Params:", [name, price, cost, stock, category, barcode, min_stock, location, image, keywordsStr, variantsStr, req.params.id]);

    const params = [name, price, cost, stock, category, barcode, min_stock, location, image, keywordsStr, variantsStr, req.params.id];

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



            // Logic to update stock depends on if it's a variant or main product
            const updateMainStock = 'UPDATE products SET stock = stock - ? WHERE id = ?';
            const getProductVariants = 'SELECT variants FROM products WHERE id = ?';
            const updateProductVariants = 'UPDATE products SET variants = ? WHERE id = ?';

            // We need to process items sequentially to handle async DB queries inside
            const processItems = async () => {
                for (const item of items) {
                    try {
                        // 1. Determine if item is a variant or main product
                        // Our frontend sends variant IDs as strings (e.g. "v1-256-nat") or numbers for main products
                        // But wait, the cart item ID for a variant is the variant ID, but we need the PARENT ID to update the DB record.
                        // CURRENTLY, the frontend sends the variant ID as item.id.
                        // We need a way to find the parent. 
                        // HACK: For now, I'll cheat. The `data/seed_sales.js` or `database.js` uses simple IDs. 
                        // If `item.id` is a string starting with 'v', it's a variant. 
                        // But we don't know the parent ID from just "v1...".
                        // IMPROVEMENT: Frontend should send userId or we search. 
                        // actually, in `ProductSearch.jsx`, we didn't store parentId in the cart item. 
                        // Let's assume for this mock that we iterate products to find who owns this variant if it's a string.

                        // Wait! A better approach for this mock: 
                        // The variant ID I assigned is "v{parentId}-{...}". 
                        // So "v1-256-nat" implies parent ID 1.
                        // I will parse the parent ID from the variant string.

                        let parentId = item.id;
                        let isVariant = false;

                        if (typeof item.id === 'string' && item.id.startsWith('v')) {
                            isVariant = true;
                            parentId = parseInt(item.id.split('-')[0].replace('v', ''));
                        }

                        // Insert Sale Item
                        // We store parentId as product_id, and if it's a variant, we store its ID in variant_id
                        const variantId = isVariant ? item.id : null;

                        await new Promise((resolve, reject) => {
                            db.run('INSERT INTO sale_items (sale_id, product_id, quantity, price, variant_id) VALUES (?,?,?,?,?)',
                                [id, parentId, item.quantity, item.price, variantId],
                                (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                        });

                        // Update Stock
                        if (isVariant) {
                            // Fetch parent, find variant, decrease stock, update parent
                            await new Promise((resolve, reject) => {
                                db.get(getProductVariants, [parentId], (err, row) => {
                                    if (err || !row) {
                                        console.error("Error fetching parent for variant:", err);
                                        resolve(); // Skip update if fail
                                        return;
                                    }
                                    let variants = JSON.parse(row.variants || '[]');
                                    const variantIndex = variants.findIndex(v => v.id === item.id);

                                    if (variantIndex !== -1) {
                                        variants[variantIndex].stock -= item.quantity;
                                        db.run(updateProductVariants, [JSON.stringify(variants), parentId], (err) => {
                                            if (err) reject(err);
                                            else resolve();
                                        });
                                    } else {
                                        resolve();
                                    }
                                });
                            });
                        } else {
                            // Normal Product
                            await new Promise((resolve, reject) => {
                                db.run(updateMainStock, [item.quantity, item.id], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            });
                        }

                    } catch (error) {
                        console.error("Error processing item:", error);
                        // In a real app we might rollback here
                    }
                }

                db.run('COMMIT');
                res.json({ message: "Sale completed successfully", saleId: id });
            };

            processItems();
        });
    });
});

app.post('/api/sales/:id/void', authenticateToken, authorizeRole('ADMIN'), (req, res) => {
    const saleId = req.params.id;
    const { reason } = req.body;
    const voidedBy = req.user.username;
    const voidedAt = new Date().toISOString();

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.get("SELECT status FROM sales WHERE id = ?", [saleId], (err, row) => {
            if (err || !row) {
                db.run('ROLLBACK');
                return res.status(404).json({ error: "Sale not found" });
            }
            if (row.status === 'VOIDED') {
                db.run('ROLLBACK');
                return res.status(400).json({ error: "Sale already voided" });
            }

            // Update Status
            db.run("UPDATE sales SET status = 'VOIDED', void_reason = ?, voided_by = ?, voided_at = ? WHERE id = ?",
                [reason, voidedBy, voidedAt, saleId],
                (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }

                    // Return Stock
                    db.all("SELECT * FROM sale_items WHERE sale_id = ?", [saleId], async (err, items) => {
                        if (err || !items) {
                            // Should not happen, but commit anyway if just status change? No, data integrity.
                            db.run('COMMIT');
                            return res.json({ message: "Sale voided (no items to return)" });
                        }

                        const updateMainStock = 'UPDATE products SET stock = stock + ? WHERE id = ?';
                        const getProductVariants = 'SELECT variants FROM products WHERE id = ?';
                        const updateProductVariants = 'UPDATE products SET variants = ? WHERE id = ?';

                        for (const item of items) {
                            // Check for variant_id if we added it, or try to guess.
                            // For this task, I will finalize the logic in the next steps.
                            // Logic: 
                            if (item.variant_id) { // Future proofing
                                await new Promise((resolve) => {
                                    db.get(getProductVariants, [item.product_id], (err, row) => {
                                        if (!row) return resolve();
                                        let variants = JSON.parse(row.variants || '[]');
                                        const vIndex = variants.findIndex(v => v.id === item.variant_id);
                                        if (vIndex !== -1) {
                                            variants[vIndex].stock += item.quantity;
                                            db.run(updateProductVariants, [JSON.stringify(variants), item.product_id], resolve);
                                        } else resolve();
                                    });
                                });
                            } else {
                                // Default to main product
                                await new Promise((resolve) => {
                                    db.run(updateMainStock, [item.quantity, item.product_id], resolve);
                                });
                            }
                        }

                        db.run('COMMIT');
                        res.json({ message: "Sale voided successfully" });
                    });
                }
            );
        });
    });
});

// Update Sales Getter to return status
app.get('/api/sales', (req, res) => {
    const query = `
        SELECT s.id, s.date, s.total, s.payment_method, s.cashier, s.status, s.void_reason, s.voided_by, s.voided_at,
               si.quantity, si.price as item_price, si.variant_id,
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
                    status: row.status, // Added
                    voidMetadata: row.status === 'VOIDED' ? {
                        reason: row.void_reason,
                        by: row.voided_by,
                        at: row.voided_at
                    } : null,
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
                    variantId: row.variant_id, // Added
                    subtotal: subtotalItem
                });
                salesMap[row.id].subtotal += subtotalItem;
            }
        });

        // Calculate Tax and Finalize
        const salesList = Object.values(salesMap).map(sale => {
            sale.tax = sale.total - sale.subtotal;
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

// --- CASH SESSION (Apertura/Cierre de Caja) ---
// GET current open session (requires auth to know if we're logged in)
app.get('/api/cash-session/current', authenticateToken, (req, res) => {
    db.get(
        "SELECT * FROM cash_sessions WHERE closed_at IS NULL ORDER BY opened_at DESC LIMIT 1",
        [],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) {
                return res.json({ isOpen: false, session: null });
            }
            res.json({
                isOpen: true,
                session: {
                    openedBy: { username: row.opened_by },
                    openedAt: row.opened_at,
                    initialAmount: row.initial_amount,
                    expectedCash: row.expected_cash,
                    expectedCard: row.expected_card
                }
            });
        }
    );
});

// POST open cash register
app.post('/api/cash-session/open', authenticateToken, (req, res) => {
    const { initialAmount } = req.body;
    const openedBy = req.user.username;
    const openedAt = new Date().toISOString();

    db.get("SELECT id FROM cash_sessions WHERE closed_at IS NULL LIMIT 1", [], (err, openRow) => {
        if (err) return res.status(500).json({ error: err.message });
        if (openRow) {
            return res.status(400).json({ error: "Ya hay una caja abierta" });
        }
        db.run(
            "INSERT INTO cash_sessions (opened_by, opened_at, initial_amount, expected_cash, expected_card) VALUES (?, ?, ?, 0, 0)",
            [openedBy, openedAt, parseFloat(initialAmount) || 0],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({
                    message: "Caja abierta",
                    session: {
                        openedBy: { username: openedBy },
                        openedAt,
                        initialAmount: parseFloat(initialAmount) || 0,
                        expectedCash: 0,
                        expectedCard: 0
                    }
                });
            }
        );
    });
});

// PATCH update expected totals (after each sale)
app.patch('/api/cash-session/current', authenticateToken, (req, res) => {
    const { expectedCash, expectedCard } = req.body;
    db.get("SELECT id FROM cash_sessions WHERE closed_at IS NULL LIMIT 1", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "No hay caja abierta" });
        db.run(
            "UPDATE cash_sessions SET expected_cash = ?, expected_card = ? WHERE id = ?",
            [parseFloat(expectedCash) || 0, parseFloat(expectedCard) || 0, row.id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "updated" });
            }
        );
    });
});

// POST close cash register
app.post('/api/cash-session/close', authenticateToken, (req, res) => {
    const { countedCash, observations, expectedCash, expectedCard, initialAmount } = req.body;
    const closedBy = req.user.username;
    const closedAt = new Date().toISOString();

    db.get("SELECT * FROM cash_sessions WHERE closed_at IS NULL ORDER BY opened_at DESC LIMIT 1", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(400).json({ error: "No hay caja abierta" });

        const totalExpected = (parseFloat(expectedCash) ?? row.expected_cash) + (parseFloat(initialAmount) ?? row.initial_amount);
        const counted = parseFloat(countedCash) || 0;
        const difference = counted - totalExpected;

        db.run(
            "UPDATE cash_sessions SET closed_at = ?, closed_by = ?, counted_cash = ?, difference = ?, observations = ?, expected_cash = ?, expected_card = ? WHERE id = ?",
            [closedAt, closedBy, counted, difference, observations || null, row.expected_cash, row.expected_card, row.id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                    message: "Caja cerrada",
                    lastClosing: {
                        closedBy: { username: closedBy },
                        closedAt,
                        expectedCash: row.expected_cash,
                        expectedCard: row.expected_card,
                        countedCash: counted,
                        difference,
                        observations: observations || null
                    }
                });
            }
        );
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// --- AUTHENTICATION & USERS ---

// --- AUTHENTICATION & USERS ---
// Middleware moved to top


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
