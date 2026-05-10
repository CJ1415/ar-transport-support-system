// init.js
// Run this to initialise the database, creating all tables and inserting fixed users and tools.
// Reads schema.sql to create the database structure, then wipes any existing data
// and reinitialises with fixed values. Safe to run on a fresh or existing database.
//
// Fixed users:
//   - admin       (role: Admin,      jurisdiction: ALL) - password: admin123
//   - supervisor  (role: Supervisor, jurisdiction: ALL) - password: super123
//   - engineer    (role: Engineer,   jurisdiction: UK)  - password: eng123
//   - inspector   (role: Inspector,  jurisdiction: FR)  - password: insp123
//
// Admin access is only granted to the `admin` user above.
// Supervisors and other staff have non-admin roles and cannot complete or delete faults.
//
// Run order:
//   1. node init.js   — creates tables and fixed data
//   2. node seed.js   — optional, adds random test data
//
// Usage: node init.js

const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
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

async function initUsers() {
    const fixedUsers = [
        { username: 'admin',      password: 'admin123',  role: 'Admin',      jurisdiction: 'ALL' },
        { username: 'supervisor', password: 'super123',  role: 'Supervisor', jurisdiction: 'ALL' },
        { username: 'engineer',   password: 'eng123',    role: 'Engineer',   jurisdiction: 'UK'  },
        { username: 'inspector',  password: 'insp123',   role: 'Inspector',  jurisdiction: 'FR'  },
    ]

    const stmt = db.prepare('INSERT INTO users (username, password_hash, role, jurisdiction) VALUES (?, ?, ?, ?)')

    for (const u of fixedUsers) {
        const hashedPassword = await bcrypt.hash(u.password, 10)
        stmt.run(u.username, hashedPassword, u.role, u.jurisdiction)
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

async function main() {
    await initUsers()
    initTools()

    db.close()
    console.log('Database initialised with fixed users and tools')
}

main()