const db = require('./database');
const fs = require('fs');

// Simple script to drop products table and let it re-init with new seed data from database.js
// WARNING: This deletes all products! Use only for dev/testing new schema.

console.log("Resetting products table to apply new schema and seed data...");

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS products", (err) => {
        if (err) console.error("Error dropping table:", err);
        else console.log("Products table dropped.");
    });
});

// We rely on the app restart or database module re-import to recreate the table.
// However, since database.js runs initialization on import, running this script requires
// restarting the main process or triggering re-init.
// Ideally, we just delete the file 'pos.db' to start fresh if we want a clean slate.
