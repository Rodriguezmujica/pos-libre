console.log(`Node version: ${process.version}`);
try {
    const sqlite3 = require('sqlite3');
    console.log('sqlite3 required successfully');
    const db = new sqlite3.Database('database.sqlite');
    console.log('Database opened');
    db.serialize(() => {
        db.all("SELECT * FROM users", (err, rows) => {
            if (err) console.error("Error query:", err);
            else console.log(`Users found: ${rows.length}`);
            // Print usernames to help me login
            if (rows) rows.forEach(r => console.log(`User: ${r.username}, Role: ${r.role}`));
        });
    });
} catch (e) {
    console.error('Failed to load sqlite3:', e);
}
