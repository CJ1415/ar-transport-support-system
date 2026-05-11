const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// TARGET: backend/db/ar_transport.db (Same folder)
const dbPath = path.resolve(__dirname, 'ar_transport.db');
const db = new Database(dbPath);

// 1. Initialize Schema
const schemaPath = path.resolve(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// 2. Clear Existing Data (Correct Order)
try {
    db.transaction(() => {
        db.prepare(`DELETE FROM audit_logs`).run();
        db.prepare(`DELETE FROM tool_check_logs`).run();
        db.prepare(`DELETE FROM predictions`).run();
        db.prepare(`DELETE FROM faults`).run();
        db.prepare(`DELETE FROM sessions`).run();
        db.prepare(`DELETE FROM tools`).run();
        db.prepare(`DELETE FROM locations`).run();
        db.prepare(`DELETE FROM users`).run();
    })();
    console.log("Database cleared successfully.");
} catch (err) {
    console.log("Cleanup skipped (likely fresh DB or tables empty).");
}

// 3. Seed Fixed Users with Hashed Passwords
function initUsers() {
    const fixedUsers = [
        { username: 'admin',      password: 'admin123', role: 'Admin',      jurisdiction: 'ALL' },
        { username: 'supervisor', password: 'super123', role: 'Supervisor', jurisdiction: 'ALL' },
        { username: 'engineer',   password: 'eng123',   role: 'Engineer',   jurisdiction: 'UK'  },
        { username: 'inspector',  password: 'insp123',  role: 'Inspector',  jurisdiction: 'FR'  },
    ];

    const stmt = db.prepare('INSERT INTO users (username, password_hash, role, jurisdiction) VALUES (?, ?, ?, ?)');

    for (const u of fixedUsers) {
        const hash = bcrypt.hashSync(u.password, 10);
        stmt.run(u.username, hash, u.role, u.jurisdiction);
    }
}

// 4. Seed Tools
function initTools() {
    const fixedTools = [
        { name: 'Torque Wrench',  category: 'Measurement', rfid_tag: 'RFID-0001', calibration_due: '2026-09-01' },
        { name: 'Laser Measure',  category: 'Measurement', rfid_tag: 'RFID-0002', calibration_due: '2026-10-15' },
        { name: 'Crack Gauge',    category: 'Inspection',  rfid_tag: 'RFID-0003', calibration_due: '2026-12-01' },
        { name: 'Gas Detector',   category: 'Safety',      rfid_tag: 'RFID-0004', calibration_due: '2027-01-30' },
        { name: 'Thermal Camera', category: 'Inspection',  rfid_tag: 'RFID-0005', calibration_due: '2027-03-01' },
        { name: 'Voltage Tester', category: 'Electrical',  rfid_tag: 'RFID-0006', calibration_due: '2026-11-15' },
    ];

    const stmt = db.prepare('INSERT INTO tools (name, category, rfid_tag, calibration_due) VALUES (?, ?, ?, ?)');
    for (const t of fixedTools) {
        stmt.run(t.name, t.category, t.rfid_tag, t.calibration_due);
    }
}

initUsers();
initTools();

console.log('-----------------------------------------');
console.log('Database Path:', dbPath);
console.log('Status: DATABASE INITIALIZED (BCRYPT READY)');
console.log('-----------------------------------------');
db.close();