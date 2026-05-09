// init.js
// Run this to initialise the database, creating all tables and inserting fixed users and tools.
// Reads schema.sql to create the database structure, then wipes any existing data
// and reinitialises with fixed values. Safe to run on a fresh or existing database.
//
// Fixed users:
//   - admin       (role: Admin,      jurisdiction: ALL)
//   - supervisor  (role: Supervisor, jurisdiction: ALL)
//   - engineer    (role: Engineer,   jurisdiction: UK)
//   - inspector   (role: Inspector,  jurisdiction: FR)
//
// Run order:
//   1. node init.js   — creates tables and fixed data
//   2. node seed.js   — optional, adds random test data
//
// Usage: node init.js

const Database = require('better-sqlite3')
const fs = require('fs')
const db = new Database('ar_transport.db')

const schema = fs.readFileSync('schema.sql', 'utf8')
db.exec(schema)

// Delete any previous data in the db
db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM tool_check_logs;
    DELETE FROM faults;
    DELETE FROM sessions;
    DELETE FROM locations;
    DELETE FROM tools;
    DELETE FROM users;
`)

function initUsers() {
    const fixedUsers = [
        { username: 'admin',      password_hash: 'hashed_pw_admin',      role: 'Admin',      jurisdiction: 'ALL' },
        { username: 'supervisor', password_hash: 'hashed_pw_supervisor', role: 'Supervisor', jurisdiction: 'ALL' },
        { username: 'engineer',   password_hash: 'hashed_pw_engineer',   role: 'Engineer',   jurisdiction: 'UK'  },
        { username: 'inspector',  password_hash: 'hashed_pw_inspector',  role: 'Inspector',  jurisdiction: 'FR'  },
    ]

    const stmt = db.prepare('INSERT INTO users (username, password_hash, role, jurisdiction) VALUES (?, ?, ?, ?)')
    for (const u of fixedUsers) {
        stmt.run(u.username, u.password_hash, u.role, u.jurisdiction)
    }
}

function initTools() {
    const fixedTools = [
        { name: 'Torque Wrench',  category: 'Measurement', rfid_tag: 'RFID-0001', calibration_due: '2026-09-01' },
        { name: 'Laser Measure',  category: 'Measurement', rfid_tag: 'RFID-0002', calibration_due: '2026-10-15' },
        { name: 'Crack Gauge',    category: 'Inspection',  rfid_tag: 'RFID-0003', calibration_due: '2026-12-01' },
        { name: 'Gas Detector',   category: 'Safety',      rfid_tag: 'RFID-0004', calibration_due: '2027-01-30' },
        { name: 'Thermal Camera', category: 'Inspection',  rfid_tag: 'RFID-0005', calibration_due: '2027-03-01' },
        { name: 'Voltage Tester', category: 'Electrical',  rfid_tag: 'RFID-0006', calibration_due: '2026-11-15' },
    ]

    const stmt = db.prepare('INSERT INTO tools (name, category, rfid_tag, calibration_due) VALUES (?, ?, ?, ?)')
    for (const t of fixedTools) {
        stmt.run(t.name, t.category, t.rfid_tag, t.calibration_due)
    }
}

initUsers()
initTools()

db.close()
console.log('Database initialised with fixed users and tools')