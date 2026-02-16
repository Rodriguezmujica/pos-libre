const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'repro.db');
const seedData = [
    { name: 'Item 1', price: 100 },
    { name: 'Item 2', price: 200 }
];

// cleanup
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}

function openDb() {
    return new sqlite3.Database(dbPath);
}

async function initDb(db) {
    return new Promise((resolve) => {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                price REAL
            )`);

            db.get("SELECT count(*) as count FROM products", (err, row) => {
                if (!err && row.count === 0) {
                    console.log("[Seeding] Seeding products...");
                    const stmt = db.prepare("INSERT INTO products (name, price) VALUES (?,?)");
                    seedData.forEach(p => stmt.run(p.name, p.price));
                    stmt.finalize();
                    console.log("[Seeding] Complete.");
                } else {
                    console.log("[Seeding] Skipped (count: " + (row ? row.count : 'err') + ")");
                }
                resolve();
            });
        });
    });
}

async function runTest() {
    console.log("--- TEST START ---");

    // 1. First Run (Start)
    console.log("1. Starting App (First Time)...");
    let db = openDb();
    await initDb(db);

    // Check count
    await new Promise(r => db.get("SELECT count(*) as c FROM products", (e, row) => {
        console.log("   Count after init:", row.c);
        r();
    }));

    // 2. Delete Item 1
    console.log("2. Deleting Item ID 1...");
    await new Promise(r => db.run("DELETE FROM products WHERE id = 1", function (err) {
        if (err) console.error("Error deleting:", err);
        else console.log("   Deleted rows:", this.changes);
        r();
    }));

    // Check count
    await new Promise(r => db.get("SELECT count(*) as c FROM products", (e, row) => {
        console.log("   Count after delete:", row.c);
        r();
    }));

    // 3. Close App (Restart)
    console.log("3. Closing DB...");
    await new Promise(r => db.close(r));

    // 4. Start App Again
    console.log("4. Restarting App...");
    db = openDb();
    await initDb(db);

    // 5. Verify Persistence
    console.log("5. Verifying persistence...");
    await new Promise(r => db.all("SELECT * FROM products", (e, rows) => {
        console.log("   Rows found:", rows.map(r => r.id + ":" + r.name));
        if (rows.find(r => r.id === 1)) {
            console.error("FAIL: Item 1 reappeared!");
        } else {
            console.log("PASS: Item 1 is still gone.");
        }
        r();
    }));

    db.close();
}

runTest();
