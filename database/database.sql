-- Digital Queue Management System Database

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT,
    phone TEXT NOT NULL,
    health_problem TEXT,
    department TEXT,
    hospital_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_number TEXT NOT NULL,
    patient_id INTEGER NOT NULL,
    department TEXT NOT NULL,
    hospital_key TEXT,
    status TEXT DEFAULT 'Waiting',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS queue_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    max_tokens INTEGER NOT NULL DEFAULT 50 CHECK (max_tokens BETWEEN 1 AND 1000)
);

INSERT OR IGNORE INTO queue_settings (id, max_tokens) VALUES (1, 50);

CREATE TABLE IF NOT EXISTS hospital_queue_settings (
    hospital_key TEXT PRIMARY KEY,
    max_tokens INTEGER NOT NULL DEFAULT 50 CHECK (max_tokens BETWEEN 1 AND 1000)
);

-- Emergency requests table
CREATE TABLE IF NOT EXISTS emergency_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    emergency_type TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customer support requests table
CREATE TABLE IF NOT EXISTS support_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals and clinics table
CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
