const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const dbPath = process.env.QUEUE_DB_PATH || path.join(__dirname, "../database/queue_management.db");
const sqlPath = path.join(__dirname, "../database/database.sql");

const db = new sqlite3.Database(dbPath);
const sql = fs.readFileSync(sqlPath, "utf8");

function dbGet(query, parameters = []) {
    return new Promise((resolve, reject) => {
        db.get(query, parameters, (error, row) => error ? reject(error) : resolve(row));
    });
}

function dbAll(query) {
    return new Promise((resolve, reject) => {
        db.all(query, (error, rows) => error ? reject(error) : resolve(rows));
    });
}

function dbExec(query) {
    return new Promise((resolve, reject) => {
        db.exec(query, (error) => error ? reject(error) : resolve());
    });
}

function dbRun(query, parameters = []) {
    return new Promise((resolve, reject) => {
        db.run(query, parameters, (error) => error ? reject(error) : resolve());
    });
}

const ready = new Promise((resolve, reject) => {
    (async () => {
        await dbExec("PRAGMA foreign_keys = ON;");
        await dbExec(sql);

        const patientColumns = await dbAll("PRAGMA table_info(patients)");
        const tokenColumns = await dbAll("PRAGMA table_info(tokens)");
        if (!patientColumns.some((column) => column.name === "hospital_key")) {
            await dbExec("ALTER TABLE patients ADD COLUMN hospital_key TEXT");
        }
        if (!tokenColumns.some((column) => column.name === "hospital_key")) {
            await dbExec("ALTER TABLE tokens ADD COLUMN hospital_key TEXT");
        }

        const legacySettings = await dbGet("SELECT max_tokens FROM queue_settings WHERE id = 1");
        await dbRun(
            "INSERT OR IGNORE INTO hospital_queue_settings (hospital_key, max_tokens) VALUES ('legacy', ?)",
            [legacySettings?.max_tokens || 50]
        );
        for (const hospitalKey of [
            "taluk-government-hospital",
            "kvg-medical-college",
            "jyothi-hospital",
            "svm-hospital",
            "kvg-dental-college",
            "kvg-implant-centre",
            "soonthodu-dental-care",
            "shilpas-dental-care",
            "siri-dental-clinic",
            "prasad-netralaya",
            "maithri-pediatric-clinic",
            "kvg-ayurveda-hospital",
            "shree-clinic",
            "krishna-clinic"
        ]) {
            await dbRun(
                "INSERT OR IGNORE INTO hospital_queue_settings (hospital_key, max_tokens) VALUES (?, 50)",
                [hospitalKey]
            );
        }

        await dbExec("DROP INDEX IF EXISTS idx_tokens_token_number");
        await dbExec(
            `CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_hospital_token_number
             ON tokens (COALESCE(hospital_key, 'legacy'), token_number)`
        );
        console.log("Connected to SQLite database.");
    })().then(resolve, reject);
});

module.exports = { db, ready };