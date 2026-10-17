const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/queue_management.db");
const sqlPath = path.join(__dirname, "../database/database.sql");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

const sql = fs.readFileSync(sqlPath, "utf8");

db.exec(sql, (err) => {
    if (err) {
        console.error("Database setup failed:", err.message);
    } else {
        console.log("Database tables created successfully.");
    }
});

module.exports = db;