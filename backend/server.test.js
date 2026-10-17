const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const fs = require("node:fs/promises");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const sqlite3 = require("sqlite3").verbose();

async function findAvailablePort() {
    const listener = net.createServer();
    listener.listen(0, "127.0.0.1");
    await once(listener, "listening");
    const { port } = listener.address();
    await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
    return port;
}

function readDatabaseValue(filename, sql) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(filename, sqlite3.OPEN_READONLY, (openError) => {
            if (openError) {
                reject(openError);
                return;
            }
            db.get(sql, [], (queryError, row) => {
                db.close((closeError) => {
                    if (queryError) {
                        reject(queryError);
                    } else if (closeError) {
                        reject(closeError);
                    } else {
                        resolve(row);
                    }
                });
            });
        });
    });
}

test("website API validates and serializes queue operations", async (t) => {
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "queuecare-test-"));
    const databasePath = path.join(tempDirectory, "queue.db");
    const port = await findAvailablePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const backendDirectory = __dirname;
    const child = spawn(process.execPath, ["server.js"], {
        cwd: backendDirectory,
        env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", QUEUE_DB_PATH: databasePath },
        stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { output += chunk; });

    t.after(async () => {
        if (child.exitCode === null) {
            child.kill();
            await Promise.race([once(child, "exit"), new Promise((resolve) => setTimeout(resolve, 3000))]);
        }
        await fs.rm(tempDirectory, { recursive: true, force: true });
    });

    let ready = false;
    for (let attempt = 0; attempt < 60; attempt += 1) {
        if (child.exitCode !== null) {
            break;
        }
        try {
            const response = await fetch(`${baseUrl}/api/test`);
            if (response.ok) {
                ready = true;
                break;
            }
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    assert.equal(ready, true, `server did not start: ${output}`);

    async function request(endpoint, options = {}) {
        const response = await fetch(`${baseUrl}${endpoint}`, options);
        const body = await response.json();
        return { response, body };
    }

    async function postRegistration(name, phone) {
        return request("/api/registrations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                patientName: name,
                patientAge: 30,
                patientGender: "Other",
                patientPhone: phone,
                healthProblem: "Routine check-up",
                department: "General Medicine"
            })
        });
    }

    async function postHospitalRegistration(name, phone, hospitalKey, department) {
        return request("/api/registrations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                patientName: name,
                patientAge: 30,
                patientGender: "Other",
                patientPhone: phone,
                healthProblem: "Routine check-up",
                department,
                hospitalKey
            })
        });
    }

    const homeResponse = await fetch(baseUrl);
    assert.equal(homeResponse.status, 200);
    assert.match(await homeResponse.text(), /QueueCare/);

    const malformedJson = await fetch(`${baseUrl}/api/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{"
    });
    assert.equal(malformedJson.status, 400);
    assert.equal((await malformedJson.json()).success, false);

    const invalidRegistration = await request("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            patientName: "Invalid1",
            patientAge: 30,
            patientGender: "Other",
            patientPhone: "1234567890",
            healthProblem: "Test",
            department: "General Medicine"
        })
    });
    assert.equal(invalidRegistration.response.status, 400);

    const smallLimit = await request("/api/queue/limit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxTokens: 2 })
    });
    assert.equal(smallLimit.response.status, 200);

    const registrations = await Promise.all([
        postRegistration("Patient One", "1234567890"),
        postRegistration("Patient Two", "1234567891"),
        postRegistration("Patient Three", "1234567892")
    ]);
    assert.deepEqual(registrations.map(({ response }) => response.status).sort(), [201, 201, 409]);

    const tokensResult = await request("/api/tokens");
    assert.equal(tokensResult.body.tokens.length, 2);
    assert.deepEqual(tokensResult.body.tokens.map((token) => token.token_number), ["1", "2"]);

    const secondStatus = await request("/api/tokens/T-002");
    assert.equal(secondStatus.response.status, 200);
    assert.equal(secondStatus.body.peopleAhead, 1);

    const tokenId = tokensResult.body.tokens[0].id;
    const served = await request(`/api/tokens/${tokenId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Served" })
    });
    assert.equal(served.response.status, 200);
    const updatedStatus = await request("/api/tokens/2");
    assert.equal(updatedStatus.body.peopleAhead, 0);
    const queueAfterServe = await request("/api/queue");
    assert.equal(queueAfterServe.body.queue.current_token, 1);
    assert.equal(queueAfterServe.body.queue.waiting_count, 1);

    const tooSmallLimit = await request("/api/queue/limit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxTokens: 1 })
    });
    assert.equal(tooSmallLimit.response.status, 400);

    const support = await request("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Support User",
            phone: "1234567890",
            issueType: "Token problem",
            message: "Please check my token."
        })
    });
    assert.equal(support.response.status, 201);
    const invalidSupport = await request("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Support User",
            phone: "123",
            issueType: "Token problem",
            message: "Please check my token."
        })
    });
    assert.equal(invalidSupport.response.status, 400);

    const hospitals = await request("/api/hospitals");
    assert.equal(hospitals.response.status, 200);
    assert.equal(Array.isArray(hospitals.body.hospitals), true);

    const queueHospitals = await request("/api/queue/hospitals");
    assert.equal(queueHospitals.response.status, 200);
    assert.equal(queueHospitals.body.hospitals.length, 14);
    assert.deepEqual(
        queueHospitals.body.hospitals.find((hospital) => hospital.key === "kvg-medical-college").departments,
        [
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
        ]
    );
    assert.deepEqual(
        queueHospitals.body.hospitals.find((hospital) => hospital.key === "prasad-netralaya").departments,
        ["Eye Care", "Other / Not Listed"]
    );
    assert.deepEqual(
        queueHospitals.body.hospitals.find((hospital) => hospital.key === "kvg-implant-centre").departments,
        ["Dental Care", "Other / Not Listed"]
    );
    assert.equal(new Set(queueHospitals.body.hospitals.map((hospital) => hospital.key)).size, 14);

    const invalidHospitalDepartment = await postHospitalRegistration(
        "Wrong Department",
        "2234567890",
        "jyothi-hospital",
        "Not A Department"
    );
    assert.equal(invalidHospitalDepartment.response.status, 400);

    const skinRegistration = await postHospitalRegistration(
        "Skin Patient",
        "2234567897",
        "taluk-government-hospital",
        "Skin / Dermatology"
    );
    assert.equal(skinRegistration.response.status, 201);
    assert.equal(
        (await request("/api/queue?hospitalKey=taluk-government-hospital")).body.queue.registered_count,
        1
    );
    const invalidClinicDepartment = await postHospitalRegistration(
        "Dental Clinic Skin Patient",
        "2234567898",
        "siri-dental-clinic",
        "Skin / Dermatology"
    );
    assert.equal(invalidClinicDepartment.response.status, 400);

    const kvgRegistration = await postHospitalRegistration(
        "KVG Patient",
        "2234567891",
        "kvg-medical-college",
        "Pediatrics"
    );
    const jyothiRegistration = await postHospitalRegistration(
        "Jyothi Patient",
        "2234567892",
        "jyothi-hospital",
        "General Medicine"
    );
    assert.equal(kvgRegistration.response.status, 201);
    assert.equal(jyothiRegistration.response.status, 201);
    assert.equal(kvgRegistration.body.token.tokenNumber, "1");
    assert.equal(jyothiRegistration.body.token.tokenNumber, "1");
    assert.equal(jyothiRegistration.body.token.hospitalKey, "jyothi-hospital");

    const dentalRegistration = await postHospitalRegistration(
        "Dental Patient",
        "2234567895",
        "siri-dental-clinic",
        "Dental Care"
    );
    const eyeRegistration = await postHospitalRegistration(
        "Eye Patient",
        "2234567896",
        "prasad-netralaya",
        "Eye Care"
    );
    assert.equal(dentalRegistration.response.status, 201);
    assert.equal(eyeRegistration.response.status, 201);
    assert.equal(dentalRegistration.body.token.tokenNumber, "1");
    assert.equal(eyeRegistration.body.token.tokenNumber, "1");
    assert.equal((await request("/api/queue?hospitalKey=siri-dental-clinic")).body.queue.registered_count, 1);
    assert.equal((await request("/api/queue?hospitalKey=prasad-netralaya")).body.queue.registered_count, 1);

    const kvgQueue = await request("/api/queue?hospitalKey=kvg-medical-college");
    const jyothiQueue = await request("/api/queue?hospitalKey=jyothi-hospital");
    assert.equal(kvgQueue.body.queue.registered_count, 1);
    assert.equal(jyothiQueue.body.queue.registered_count, 1);
    assert.equal((await request("/api/tokens/1?hospitalKey=kvg-medical-college")).body.token.patient_name, "KVG Patient");
    assert.equal((await request("/api/tokens/1?hospitalKey=jyothi-hospital")).body.token.patient_name, "Jyothi Patient");

    const hospitalLimit = await request("/api/queue/limit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxTokens: 1, hospitalKey: "kvg-medical-college" })
    });
    assert.equal(hospitalLimit.response.status, 200);
    const fullHospitalRegistration = await postHospitalRegistration(
        "KVG Another Patient",
        "2234567893",
        "kvg-medical-college",
        "General Medicine"
    );
    assert.equal(fullHospitalRegistration.response.status, 409);
    const jyothiStillOpen = await postHospitalRegistration(
        "Jyothi Another Patient",
        "2234567894",
        "jyothi-hospital",
        "General Medicine"
    );
    assert.equal(jyothiStillOpen.response.status, 201);

    const resetKvg = await request("/api/queue?hospitalKey=kvg-medical-college", { method: "DELETE" });
    assert.equal(resetKvg.response.status, 200);
    assert.equal((await request("/api/queue?hospitalKey=kvg-medical-college")).body.queue.registered_count, 0);
    assert.equal((await request("/api/queue?hospitalKey=jyothi-hospital")).body.queue.registered_count, 2);

    const reset = await request("/api/queue", { method: "DELETE" });
    assert.equal(reset.response.status, 200);
    const emptyQueue = await request("/api/queue");
    assert.equal(emptyQueue.body.queue.registered_count, 0);
    assert.equal(emptyQueue.body.queue.max_tokens, 50);
    assert.equal(emptyQueue.body.queue.current_token, 0);
    assert.equal((await request("/api/tokens")).body.tokens.length, 0);
    assert.equal((await readDatabaseValue(databasePath, "SELECT COUNT(*) AS count FROM support_requests")).count, 1);

    const missingRoute = await request("/api/does-not-exist");
    assert.equal(missingRoute.response.status, 404);
    assert.equal(missingRoute.body.success, false);
});

test("schema migration keeps existing registrations in the legacy queue", async (t) => {
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "queuecare-migration-test-"));
    const databasePath = path.join(tempDirectory, "legacy.db");
    const port = await findAvailablePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const legacyDb = new sqlite3.Database(databasePath);
    await new Promise((resolve, reject) => {
        legacyDb.exec(`
            CREATE TABLE patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_name TEXT NOT NULL,
                age INTEGER NOT NULL,
                gender TEXT,
                phone TEXT NOT NULL,
                health_problem TEXT,
                department TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_number TEXT NOT NULL UNIQUE,
                patient_id INTEGER NOT NULL,
                department TEXT NOT NULL,
                status TEXT DEFAULT 'Waiting',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id)
            );
            CREATE TABLE queue_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                max_tokens INTEGER NOT NULL DEFAULT 50 CHECK (max_tokens BETWEEN 1 AND 1000)
            );
            INSERT INTO queue_settings (id, max_tokens) VALUES (1, 20);
            INSERT INTO patients (patient_name, age, gender, phone, health_problem, department)
            VALUES ('Existing Patient', 40, 'Other', '1234567890', 'Check-up', 'General Medicine');
            INSERT INTO tokens (token_number, patient_id, department)
            VALUES ('1', 1, 'General Medicine');
        `, (error) => error ? reject(error) : resolve());
    });
    await new Promise((resolve, reject) => legacyDb.close((error) => error ? reject(error) : resolve()));

    const child = spawn(process.execPath, ["server.js"], {
        cwd: __dirname,
        env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", QUEUE_DB_PATH: databasePath },
        stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    t.after(async () => {
        if (child.exitCode === null) {
            child.kill();
            await Promise.race([once(child, "exit"), new Promise((resolve) => setTimeout(resolve, 3000))]);
        }
        await fs.rm(tempDirectory, { recursive: true, force: true });
    });

    let ready = false;
    for (let attempt = 0; attempt < 60; attempt += 1) {
        if (child.exitCode !== null) break;
        try {
            const response = await fetch(`${baseUrl}/api/test`);
            if (response.ok) {
                ready = true;
                break;
            }
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    assert.equal(ready, true, `server did not start: ${output}`);

    const legacyResponse = await fetch(`${baseUrl}/api/queue`);
    const legacyQueue = await legacyResponse.json();
    assert.equal(legacyQueue.queue.registered_count, 1);
    assert.equal(legacyQueue.queue.max_tokens, 20);
    const oldTokens = await fetch(`${baseUrl}/api/tokens`).then((response) => response.json());
    assert.equal(oldTokens.tokens[0].patient_name, "Existing Patient");

    const hospitalQueue = await fetch(`${baseUrl}/api/queue?hospitalKey=kvg-medical-college`).then((response) => response.json());
    assert.equal(hospitalQueue.queue.registered_count, 0);
    assert.equal(hospitalQueue.queue.max_tokens, 50);
});
