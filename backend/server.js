const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Digital Queue Management System Backend is running successfully!"
    });
});

// Test API
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Backend API is working!"
    });
});

// --------------------------------------------------
// PATIENT REGISTRATION
// --------------------------------------------------

app.post("/api/patients", (req, res) => {
    const {
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        healthProblem,
        department
    } = req.body;

    if (!patientName || !patientAge || !patientPhone) {
        return res.status(400).json({
            success: false,
            message: "Patient name, age and phone number are required."
        });
    }

    const sql = `
        INSERT INTO patients
        (patient_name, age, gender, phone, health_problem, department)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            patientName,
            patientAge,
            patientGender,
            patientPhone,
            healthProblem,
            department
        ],
        function (err) {
            if (err) {
                console.error(err.message);

                return res.status(500).json({
                    success: false,
                    message: "Failed to register patient."
                });
            }

            res.status(201).json({
                success: true,
                message: "Patient registered successfully.",
                patientId: this.lastID
            });
        }
    );
});

// Get all patients
app.get("/api/patients", (req, res) => {
    db.all(
        "SELECT * FROM patients ORDER BY id DESC",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to retrieve patients."
                });
            }

            res.json({
                success: true,
                patients: rows
            });
        }
    );
});

// --------------------------------------------------
// TOKEN GENERATION
// --------------------------------------------------

app.post("/api/tokens", (req, res) => {
    const { patientId, patientName, department,token } = req.body;

    if (!patientName || !department) {
        return res.status(400).json({
            success: false,
            message: "Patient name and department are required."
        });
    }

    const finalTokenNumber = tokenNumber || ("T" + Math.floor(100 + Math.random() * 900));

    // If patientId is available, use it.
    // Otherwise find the latest patient with the same name.
    const findPatient = patientId
        ? `SELECT id FROM patients WHERE id = ?`
        : `SELECT id FROM patients WHERE patient_name = ? ORDER BY id DESC LIMIT 1`;

    const findValue = patientId || patientName;

    db.get(findPatient, [findValue], (err, patient) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to find patient."
            });
        }

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found. Please register the patient first."
            });
        }

        const sql = `
            INSERT INTO tokens
            (token_number, patient_id, department)
            VALUES (?, ?, ?)
        `;

        db.run(
            sql,
           [finalTokenNumber, patient.id, department],
            function (err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Failed to generate token."
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Token generated successfully.",
                    token: {
                        id: this.lastID,
                        tokenNumber: finalTokenNumber,
                        patientName,
                        department,
                        status: "Waiting"
                    }
                });
            }
        );
    });
});

// Get all tokens
app.get("/api/tokens", (req, res) => {
    const sql = `
        SELECT
            tokens.id,
            tokens.token_number,
            patients.patient_name,
            tokens.department,
            tokens.status,
            tokens.created_at
        FROM tokens
        JOIN patients
        ON tokens.patient_id = patients.id
        ORDER BY tokens.id DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve tokens."
            });
        }

        res.json({
            success: true,
            tokens: rows
        });
    });
});
// Get single token status
app.get("/api/tokens/:tokenNumber", (req, res) => {
    const tokenNumber = req.params.tokenNumber;

    const sql = `
        SELECT
            tokens.id,
            tokens.token_number,
            patients.patient_name,
            tokens.department,
            tokens.status,
            tokens.created_at
        FROM tokens
        JOIN patients
        ON tokens.patient_id = patients.id
        WHERE tokens.token_number = ?
        LIMIT 1
    `;

    db.get(sql, [tokenNumber], (err, row) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve token."
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: "Token not found."
            });
        }

        res.json({
            success: true,
            token: row
        });
    });
});
// --------------------------------------------------
// EMERGENCY REQUEST
// --------------------------------------------------

app.post("/api/emergency", (req, res) => {
    const {
        patientName,
        phone,
        emergencyType,
        message
    } = req.body;

    if (!patientName || !phone) {
        return res.status(400).json({
            success: false,
            message: "Patient name and phone number are required."
        });
    }

    const sql = `
        INSERT INTO emergency_requests
        (patient_name, phone, emergency_type, message)
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [patientName, phone, emergencyType, message],
        function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to submit emergency request."
                });
            }

            res.status(201).json({
                success: true,
                message: "Emergency request received. Please seek immediate medical help.",
                requestId: this.lastID
            });
        }
    );
});

// --------------------------------------------------
// CUSTOMER SUPPORT
// --------------------------------------------------

app.post("/api/support", (req, res) => {
    const {
        name,
        phone,
        issueType,
        message
    } = req.body;

    if (!name || !phone || !issueType || !message) {
        return res.status(400).json({
            success: false,
            message: "All support fields are required."
        });
    }

    const sql = `
        INSERT INTO support_requests
        (name, phone, issue_type, message)
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [name, phone, issueType, message],
        function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to submit support request."
                });
            }

            res.status(201).json({
                success: true,
                message: "Your support request has been submitted successfully.",
                requestId: this.lastID
            });
        }
    );
});

// --------------------------------------------------
// HOSPITALS & CLINICS
// --------------------------------------------------

app.get("/api/hospitals", (req, res) => {
    db.all(
        "SELECT * FROM hospitals ORDER BY category, name",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to retrieve hospitals and clinics."
                });
            }

            res.json({
                success: true,
                hospitals: rows
            });
        }
    );
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------
// --------------------------------------------------
// UPDATE TOKEN STATUS
// --------------------------------------------------

app.put("/api/tokens/:id/status", (req, res) => {
    const { status } = req.body;
    const tokenId = req.params.id;

    if (!status) {
        return res.status(400).json({
            success: false,
            message: "Token status is required."
        });
    }

    const sql = `
        UPDATE tokens
        SET status = ?
        WHERE id = ?
    `;

    db.run(sql, [status, tokenId], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to update token status."
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Token not found."
            });
        }

        res.json({
            success: true,
            message: "Token status updated successfully."
        });
    });
});
app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
});