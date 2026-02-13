const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
const bcrypt = require('bcrypt');

// Adjust DB Path because we will run from backend folder or check relative path
// If running from project root: ./backend/database.sqlite
// If running from backend: ./database.sqlite
// We will try both
// Run from backend/ folder
const DB_PATH = path.resolve(__dirname, 'database.sqlite');

const API_PORT = 3001;

const TEMP_USER = 'verify_admin_' + Date.now();
const TEMP_PASS = 'verify_pass';

// Helper for HTTP Request
function httpRequest(endpoint, method, body, token) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            hostname: 'localhost',
            port: API_PORT,
            path: '/api' + endpoint,
            method: method,
            headers: headers
        };

        const req = http.request(options, res => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(data);
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: buffer,
                    json: () => {
                        try { return JSON.parse(buffer.toString()); }
                        catch (e) { return {}; }
                    },
                    text: () => buffer.toString()
                });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    console.log(`[1] Connecting to DB at ${DB_PATH}...`);
    const db = new sqlite3.Database(DB_PATH);

    // 1. Create Temp Admin
    console.log(`[2] Creating temp admin: ${TEMP_USER} in ${DB_PATH}`);
    const hash = bcrypt.hashSync(TEMP_PASS, 10);

    await new Promise((resolve, reject) => {
        db.run("INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)",
            ['Verifier', TEMP_USER, hash, 'ADMIN'], function (err) {
                if (err) reject(err);
                else resolve();
            });
    });

    // Verify it exists locally
    const exists = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE username = ?", [TEMP_USER], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    if (!exists) throw new Error("Local verification failed: User not found in DB after insert");
    console.log("    Local insert verified. ID:", exists.id);

    // Close DB connection to ensure flush (WAL checkpoint happens on close often)
    db.close();
    // Re-open later if needed or just use http for rest.
    // For verifying empty tables later, we can re-open.

    try {
        // 2. Login
        console.log(`[3] Logging in...`);
        // Add delay to ensure FS sync?
        await new Promise(r => setTimeout(r, 5000));

        const loginRes = await httpRequest('/login', 'POST', { username: TEMP_USER, password: TEMP_PASS });

        if (loginRes.status !== 200) {
            throw new Error(`Login failed: ${loginRes.status} - ${loginRes.text()}`);
        }
        const token = loginRes.json().token;
        console.log("    Login successful. Token obtained.");

        // 3. Insert Dummy Sale
        console.log(`[4] Inserting dummy data to clear...`);
        await new Promise((resolve, reject) => {
            db.run("INSERT INTO cash_sessions (opened_by, opened_at, initial_amount) VALUES (?, ?, ?)",
                [TEMP_USER, new Date().toISOString(), 1000], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });

        // 4. Test Backup Download
        console.log(`[5] Testing Backup Download...`);
        const downloadRes = await httpRequest('/backup/download', 'GET', null, token);

        if (downloadRes.status !== 200) {
            console.error("    Download failed:", downloadRes.status, downloadRes.text());
            throw new Error("Backup download failed");
        }
        // Check content-disposition or size
        if (downloadRes.body.length > 0) {
            console.log(`    Download successful. Size: ${downloadRes.body.length} bytes`);
        } else {
            throw new Error("Downloaded file is empty");
        }

        // 5. Test Clear Database
        console.log(`[6] Testing Clear Database...`);
        const clearRes = await httpRequest('/database/clear', 'POST', {
            password: TEMP_PASS,
            confirmationPhrase: 'limpiarbasededatos'
        }, token);

        const clearData = clearRes.json();
        if (clearRes.status !== 200) {
            console.error("    Clear failed:", clearData);
            throw new Error("Clear Database failed");
        }
        console.log("    Clear response:", clearData.message);

        // 6. Verify Tables Empty
        console.log(`[7] Verifying data cleared...`);
        const count = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as c FROM cash_sessions", (err, row) => {
                if (err) reject(err);
                else resolve(row.c);
            });
        });

        if (count === 0) {
            console.log("    SUCCESS: cash_sessions table is empty.");
        } else {
            console.error(`    FAILURE: cash_sessions has ${count} rows.`);
            throw new Error("Database was not cleared");
        }

    } catch (error) {
        console.error("VERIFICATION FAILED:", error);
        require('fs').writeFileSync(path.resolve(__dirname, 'verify_error.txt'), "ERROR: " + error.toString() + "\nSTACK: " + error.stack);
    } finally {
        // Cleanup
        console.log(`[8] Cleaning up temp user...`);
        db.run("DELETE FROM users WHERE username = ?", [TEMP_USER], (err) => {
            db.close();
        });
    }
}

run();
