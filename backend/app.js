const express = require("express");
const path = require("path");
const { db } = require("./database");

const app = express();
const genderOptions = new Set(["Female", "Male", "Other", "Prefer not to say"]);
const departmentOptions = new Set([
    "General Medicine",
    "Eye Care",
    "Skin / Dermatology",
    "Dental Care",
    "Pediatrics",
    "Orthopedics",
    "Women's Health",
    "ENT",
    "Cardiology",
    "General Surgery",
    "Ayurveda",
    "Other / Not Listed"
]);
const legacyHospitalKey = "legacy";
const generalHospitalDepartments = [
    "General Medicine",
    "Eye Care",
    "Skin / Dermatology",
    "Dental Care",
    "Pediatrics",
    "Orthopedics",
    "Women's Health",
    "ENT",
    "Cardiology",
    "General Surgery",
    "Other / Not Listed"
];
const queueHospitals = [
    { key: "taluk-government-hospital", name: "Taluk Government Hospital, Sullia", category: "General Hospitals", departments: generalHospitalDepartments },
    { key: "kvg-medical-college", name: "K.V.G. Medical College & Hospital", category: "General Hospitals", departments: generalHospitalDepartments },
    { key: "jyothi-hospital", name: "Jyothi Hospital, Sullia", category: "General Hospitals", departments: generalHospitalDepartments },
    { key: "svm-hospital", name: "S.V.M. Hospital", category: "General Hospitals", departments: generalHospitalDepartments },
    { key: "kvg-dental-college", name: "KVG Dental College & Hospital", category: "Dental Clinics", departments: ["Dental Care", "Other / Not Listed"] },
    { key: "kvg-implant-centre", name: "KVG Implant Centre", category: "Dental Clinics", departments: ["Dental Care", "Other / Not Listed"] },
    { key: "soonthodu-dental-care", name: "Soonthodu Dental Care", category: "Dental Clinics", departments: ["Dental Care", "Other / Not Listed"] },
    { key: "shilpas-dental-care", name: "Shilpa’s Dental Care", category: "Dental Clinics", departments: ["Dental Care", "Other / Not Listed"] },
    { key: "siri-dental-clinic", name: "Siri Dental Clinic", category: "Dental Clinics", departments: ["Dental Care", "Other / Not Listed"] },
    { key: "prasad-netralaya", name: "Prasad Netralaya – Sullia", category: "Eye Clinics", departments: ["Eye Care", "Other / Not Listed"] },
    { key: "maithri-pediatric-clinic", name: "Maithri Pediatric Clinic", category: "Pediatric/Children's Clinics", departments: ["Pediatrics", "Other / Not Listed"] },
    { key: "kvg-ayurveda-hospital", name: "KVG Ayurveda Medical College & Hospital", category: "Other Clinics", departments: ["Ayurveda", "General Medicine", "Other / Not Listed"] },
    { key: "shree-clinic", name: "Shree Clinic", category: "Other Clinics", departments: ["General Medicine", "Skin / Dermatology", "Other / Not Listed"] },
    { key: "krishna-clinic", name: "Krishna Clinic", category: "Other Clinics", departments: ["General Medicine", "Skin / Dermatology", "Other / Not Listed"] }
];
const hospitalKeys = new Set(queueHospitals.map((hospital) => hospital.key));
let databaseQueue = Promise.resolve();

app.use(express.json({ limit: "16kb" }));

function dbGet(sql, parameters = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, parameters, (error, row) => {
            if (error) {
                reject(error);
            } else {
                resolve(row);
            }
        });
    });
}

function dbAll(sql, parameters = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, parameters, (error, rows) => {
            if (error) {
                reject(error);
            } else {
                resolve(rows);
            }
        });
    });
}

function dbRun(sql, parameters = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, parameters, function (error) {
            if (error) {
                reject(error);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
}

function withDatabaseLock(operation) {
    const result = databaseQueue.then(operation);
    databaseQueue = result.catch(() => undefined);
    return result;
}

async function withTransaction(operation) {
    await dbRun("BEGIN IMMEDIATE TRANSACTION");
    try {
        const result = await operation();
        await dbRun("COMMIT");
        return result;
    } catch (error) {
        try {
            await dbRun("ROLLBACK");
        } catch (rollbackError) {
            console.error("Database transaction rollback failed:", rollbackError.message);
        }
        throw error;
    }
}

function requestError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function getHospitalKey(value, fallback = legacyHospitalKey) {
    const key = value === undefined || value === null || value === "" ? fallback : value;
    if (key !== legacyHospitalKey && !hospitalKeys.has(key)) {
        throw requestError(400, "Choose a valid hospital queue.");
    }
    return key;
}

function handleDatabaseOperation(res, operation, fallbackMessage) {
    return withDatabaseLock(operation).catch((error) => {
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        console.error(`${fallbackMessage}:`, error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: fallbackMessage });
        }
    });
}

function tokenNumberSql(column) {
    return `CAST(REPLACE(REPLACE(${column}, 'T-', ''), 'T', '') AS INTEGER)`;
}

app.get("/api/test", (req, res) => {
    res.json({ success: true, message: "Backend API is working!" });
});

app.get("/api/queue/hospitals", (req, res) => {
    res.json({ success: true, hospitals: queueHospitals });
});

app.post("/api/registrations", (req, res) => {
    const body = req.body || {};
    const name = typeof body.patientName === "string" ? body.patientName.trim() : "";
    const ageText = String(body.patientAge ?? "");
    const age = Number(ageText);
    const gender = body.patientGender;
    const phone = typeof body.patientPhone === "string" ? body.patientPhone.trim() : "";
    const problem = typeof body.healthProblem === "string" ? body.healthProblem.trim() : "";
    const department = body.department;
    let hospitalKey;
    try {
        hospitalKey = getHospitalKey(body.hospitalKey);
    } catch (error) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    const hospital = queueHospitals.find((item) => item.key === hospitalKey);
    const validDepartment = departmentOptions.has(department)
        && (!hospital || hospital.departments.includes(department));

    if (
        !/^[\p{L} ]+$/u.test(name) ||
        name.length > 100 ||
        !/^[0-9]+$/.test(ageText) ||
        !Number.isInteger(age) ||
        age < 1 ||
        age > 120 ||
        !genderOptions.has(gender) ||
        !/^[0-9]{10}$/.test(phone) ||
        !problem ||
        problem.length > 500 ||
        !validDepartment
    ) {
        return res.status(400).json({ success: false, message: "Enter valid patient details." });
    }

    handleDatabaseOperation(res, async () => {
        const registration = await withTransaction(async () => {
            const settings = await dbGet(
                `SELECT max_tokens,
                        (SELECT COUNT(*) FROM tokens WHERE COALESCE(hospital_key, 'legacy') = ?) AS registered_count,
                        (SELECT COALESCE(MAX(${tokenNumberSql("token_number")}), 0) FROM tokens
                         WHERE COALESCE(hospital_key, 'legacy') = ?) AS last_token
                 FROM hospital_queue_settings
                 WHERE hospital_key = ?`,
                [hospitalKey, hospitalKey, hospitalKey]
            );
            if (!settings) {
                throw new Error("Queue settings are missing.");
            }
            if (settings.registered_count >= settings.max_tokens) {
                throw requestError(409, "Today's queue is full. Please try again later.");
            }

            const tokenNumber = String(settings.last_token + 1);
            const patient = await dbRun(
                `INSERT INTO patients
                    (patient_name, age, gender, phone, health_problem, department, hospital_key)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [name, age, gender, phone, problem, department, hospitalKey === legacyHospitalKey ? null : hospitalKey]
            );
            const token = await dbRun(
                `INSERT INTO tokens (token_number, patient_id, department, hospital_key)
                 VALUES (?, ?, ?, ?)`,
                [tokenNumber, patient.lastID, department, hospitalKey === legacyHospitalKey ? null : hospitalKey]
            );

            return {
                patientId: patient.lastID,
                registeredCount: settings.registered_count + 1,
                maxTokens: settings.max_tokens,
                token: {
                    id: token.lastID,
                    tokenNumber,
                    patientName: name,
                    department,
                    hospitalKey,
                    hospitalName: hospital?.name || "Legacy / unassigned registrations",
                    status: "Waiting"
                }
            };
        });
        res.status(201).json({
            success: true,
            message: "Patient registered successfully.",
            ...registration
        });
    }, "Failed to register patient.");
});

app.get("/api/patients", (req, res) => {
    handleDatabaseOperation(res, async () => {
        const patients = await dbAll("SELECT * FROM patients ORDER BY id DESC");
        res.json({ success: true, patients });
    }, "Failed to retrieve patients.");
});

app.get("/api/queue", (req, res) => {
    let hospitalKey;
    try {
        hospitalKey = getHospitalKey(req.query.hospitalKey);
    } catch (error) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    handleDatabaseOperation(res, async () => {
        const queue = await dbGet(
            `SELECT hospital_queue_settings.max_tokens,
                    COUNT(tokens.id) AS registered_count,
                    COALESCE(SUM(CASE WHEN lower(tokens.status) = 'waiting' THEN 1 ELSE 0 END), 0) AS waiting_count,
                    COALESCE(MAX(CASE WHEN lower(tokens.status) = 'served' THEN
                        ${tokenNumberSql("tokens.token_number")}
                    END), 0) AS current_token
             FROM hospital_queue_settings
             LEFT JOIN tokens ON COALESCE(tokens.hospital_key, 'legacy') = hospital_queue_settings.hospital_key
             WHERE hospital_queue_settings.hospital_key = ?`,
            [hospitalKey]
        );
        if (!queue) {
            throw new Error("Queue settings are missing.");
        }
        res.json({ success: true, queue });
    }, "Failed to retrieve queue settings.");
});

app.put("/api/queue/limit", (req, res) => {
    const maxTokens = Number(req.body?.maxTokens);
    let hospitalKey;
    try {
        hospitalKey = getHospitalKey(req.body?.hospitalKey);
    } catch (error) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 1000) {
        return res.status(400).json({
            success: false,
            message: "Choose a whole-number limit from 1 to 1000."
        });
    }

    handleDatabaseOperation(res, async () => {
        await withTransaction(async () => {
            const { registered_count: registeredCount } = await dbGet(
                "SELECT COUNT(*) AS registered_count FROM tokens WHERE COALESCE(hospital_key, 'legacy') = ?",
                [hospitalKey]
            );
            if (maxTokens < registeredCount) {
                throw requestError(400, "The limit cannot be lower than the number of patients already registered.");
            }
            await dbRun("UPDATE hospital_queue_settings SET max_tokens = ? WHERE hospital_key = ?", [maxTokens, hospitalKey]);
            if (hospitalKey === legacyHospitalKey) {
                await dbRun("UPDATE queue_settings SET max_tokens = ? WHERE id = 1", [maxTokens]);
            }
        });
        res.json({ success: true, maxTokens, hospitalKey });
    }, "Failed to update queue settings.");
});

app.get("/api/tokens", (req, res) => {
    let hospitalKey;
    try {
        hospitalKey = getHospitalKey(req.query.hospitalKey);
    } catch (error) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    handleDatabaseOperation(res, async () => {
        const tokens = await dbAll(
            `SELECT tokens.id,
                    tokens.token_number,
                    patients.id AS patient_id,
                    patients.patient_name,
                    patients.age,
                    patients.gender,
                    patients.phone,
                    patients.health_problem,
                    tokens.department,
                    tokens.status,
                    tokens.hospital_key,
                    tokens.created_at
             FROM tokens
             JOIN patients ON tokens.patient_id = patients.id
             WHERE COALESCE(tokens.hospital_key, 'legacy') = ?
             ORDER BY ${tokenNumberSql("tokens.token_number")}`,
            [hospitalKey]
        );
        res.json({ success: true, tokens });
    }, "Failed to retrieve tokens.");
});

app.get("/api/tokens/:tokenNumber", (req, res) => {
    let hospitalKey;
    try {
        hospitalKey = getHospitalKey(req.query.hospitalKey);
    } catch (error) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    const suppliedToken = req.params.tokenNumber.toUpperCase().replace(/^T-?/, "");
    if (!/^[0-9]+$/.test(suppliedToken) || Number(suppliedToken) < 1) {
        return res.status(400).json({ success: false, message: "Enter a valid token number." });
    }
    const number = Number(suppliedToken);
    if (!Number.isSafeInteger(number)) {
        return res.status(400).json({ success: false, message: "Enter a valid token number." });
    }

    handleDatabaseOperation(res, async () => {
        const token = await dbGet(
            `SELECT tokens.id,
                    tokens.token_number,
                    patients.patient_name,
                    tokens.department,
                    tokens.status,
                    tokens.created_at,
                    (SELECT COUNT(*)
                     FROM tokens AS waiting_tokens
                     WHERE lower(waiting_tokens.status) = 'waiting'
                       AND COALESCE(waiting_tokens.hospital_key, 'legacy') = ?
                       AND ${tokenNumberSql("waiting_tokens.token_number")} < ${tokenNumberSql("tokens.token_number")}
                    ) AS people_ahead
             FROM tokens
             JOIN patients ON tokens.patient_id = patients.id
             WHERE ${tokenNumberSql("tokens.token_number")} = ?
               AND COALESCE(tokens.hospital_key, 'legacy') = ?
             LIMIT 1`,
            [hospitalKey, number, hospitalKey]
        );
        if (!token) {
            throw requestError(404, "Token not found.");
        }
        res.json({ success: true, token, peopleAhead: token.people_ahead });
    }, "Failed to retrieve token.");
});

app.put("/api/tokens/:id/status", (req, res) => {
    const tokenId = req.params.id;
    const { status } = req.body || {};
    if (!/^[1-9][0-9]*$/.test(tokenId) || !["Waiting", "Served"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "A valid token ID and status (Waiting or Served) are required."
        });
    }

    handleDatabaseOperation(res, async () => {
        const result = await dbRun("UPDATE tokens SET status = ? WHERE id = ?", [status, tokenId]);
        if (!result.changes) {
            throw requestError(404, "Token not found.");
        }
        res.json({ success: true, message: "Token status updated successfully." });
    }, "Failed to update token status.");
});

app.delete("/api/queue", (req, res) => {
    let hospitalKey;
    try {
        hospitalKey = getHospitalKey(req.query.hospitalKey);
    } catch (error) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    handleDatabaseOperation(res, async () => {
        await withTransaction(async () => {
            await dbRun("DELETE FROM tokens WHERE COALESCE(hospital_key, 'legacy') = ?", [hospitalKey]);
            await dbRun("DELETE FROM patients WHERE COALESCE(hospital_key, 'legacy') = ?", [hospitalKey]);
            await dbRun("UPDATE hospital_queue_settings SET max_tokens = 50 WHERE hospital_key = ?", [hospitalKey]);
            if (hospitalKey === legacyHospitalKey) {
                await dbRun("UPDATE queue_settings SET max_tokens = 50 WHERE id = 1");
            }
        });
        res.json({ success: true, message: "Queue reset successfully.", maxTokens: 50, hospitalKey });
    }, "Failed to reset queue.");
});

app.post("/api/support", (req, res) => {
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const issueType = typeof body.issueType === "string" ? body.issueType.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (
        !/^[\p{L} ]+$/u.test(name) ||
        name.length > 100 ||
        !/^[0-9]{10}$/.test(phone) ||
        !issueType ||
        issueType === "Other:" ||
        issueType.length > 150 ||
        !message ||
        message.length > 2000
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid name, 10-digit phone number, issue type and message."
        });
    }

    handleDatabaseOperation(res, async () => {
        const result = await dbRun(
            `INSERT INTO support_requests (name, phone, issue_type, message)
             VALUES (?, ?, ?, ?)`,
            [name, phone, issueType, message]
        );
        res.status(201).json({
            success: true,
            message: "Your support request was saved. This project demo does not send alerts or provide real-time monitoring.",
            requestId: result.lastID
        });
    }, "Failed to submit support request.");
});

app.post("/api/emergency", (req, res) => {
    const body = req.body || {};
    const name = typeof body.patientName === "string" ? body.patientName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const emergencyType = typeof body.emergencyType === "string" ? body.emergencyType.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (
        !/^[\p{L} ]+$/u.test(name) ||
        name.length > 100 ||
        !/^[0-9]{10}$/.test(phone) ||
        emergencyType.length > 100 ||
        message.length > 2000
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid patient name and 10-digit phone number."
        });
    }

    handleDatabaseOperation(res, async () => {
        const result = await dbRun(
            `INSERT INTO emergency_requests (patient_name, phone, emergency_type, message)
             VALUES (?, ?, ?, ?)`,
            [name, phone, emergencyType, message]
        );
        res.status(201).json({
            success: true,
            message: "This request is not monitored and cannot dispatch help. Call your local emergency number immediately.",
            requestId: result.lastID
        });
    }, "Failed to submit emergency request.");
});

app.get("/api/hospitals", (req, res) => {
    handleDatabaseOperation(res, async () => {
        const hospitals = await dbAll("SELECT * FROM hospitals ORDER BY category, name");
        res.json({ success: true, hospitals });
    }, "Failed to retrieve hospitals and clinics.");
});

app.use("/api", (req, res) => {
    res.status(404).json({ success: false, message: "API endpoint not found." });
});

app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ success: false, message: "Request body must contain valid JSON." });
    }
    if (error.type === "entity.too.large") {
        return res.status(413).json({ success: false, message: "Request body is too large." });
    }

    console.error("Unhandled request error:", error.message);
    res.status(500).json({ success: false, message: "An unexpected server error occurred." });
});

module.exports = app;
