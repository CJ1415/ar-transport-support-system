const express = require('express');
const router = express.Router();
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '../db/ar_transport.db');
const db = new Database(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

const faultColumns = db.prepare('PRAGMA table_info(faults)').all();
if (!faultColumns.some((column) => column.name === 'deleted_at')) {
    db.prepare('ALTER TABLE faults ADD COLUMN deleted_at TEXT').run();
}

router.get('/', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT
                faults.id,
                locations.name AS location,
                faults.fault_type AS type,
                faults.asset_class,
                faults.severity,
                faults.status,
                faults.detected_at
            FROM faults
            JOIN locations
            ON faults.location_id = locations.id
            WHERE faults.deleted_at IS NULL
            ORDER BY faults.detected_at DESC
        `);
        const faults = stmt.all();
        res.json(faults);

    } catch (err) {

        console.error(err.message);
        res.status(500).json({
            message: "Database fetch failed"
        });
    }
});

router.get('/locations', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT id, name FROM locations ORDER BY name
        `);
        const locations = stmt.all();
        res.json(locations);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Failed to fetch locations" });
    }
});

router.post('/report', async (req, res) => {
    try {
        const { location_id, fault_type, severity, asset_class } = req.body;
        const user_id = req.user.id; // From JWT token via authMiddleware
        
        console.log("Fault report received - user_id:", user_id, "body:", req.body);

        // Validate required fields
        if (!user_id || !location_id || !fault_type || !severity || !asset_class) {
            console.log("Missing fields - user_id:", user_id, "location_id:", location_id, "fault_type:", fault_type, "severity:", severity, "asset_class:", asset_class);
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Get or create active session for user
        const sessionStmt = db.prepare(`
            SELECT id FROM sessions 
            WHERE user_id = ? AND ended_at IS NULL 
            LIMIT 1
        `);
        let session = sessionStmt.get(user_id);

        if (!session) {
            // Create new session if none exists
            const createSessionStmt = db.prepare(`
                INSERT INTO sessions (user_id, location_id, device_uid) 
                VALUES (?, ?, 'web-client')
            `);
            const sessionInfo = createSessionStmt.run(user_id, location_id);
            session = { id: sessionInfo.lastInsertRowid };
        }

        // Insert fault
        const insertStmt = db.prepare(`
            INSERT INTO faults (session_id, location_id, fault_type, asset_class, severity, status) 
            VALUES (?, ?, ?, ?, ?, 'Open')
        `);

        const info = insertStmt.run(session.id, location_id, fault_type, asset_class, severity);

        res.status(201).json({ 
            success: true, 
            message: "Fault saved!", 
            id: info.lastInsertRowid 
        });

    } catch (err) {
        console.error("SQL Error:", err.message);
        res.status(500).json({ error: "Failed to save fault" });
    }
});

router.patch('/:id', (req, res) => {
    try {
        const faultId = parseInt(req.params.id, 10);
        const { status } = req.body;

        if (!faultId || !status) {
            return res.status(400).json({ error: 'Fault id and status are required' });
        }

        const validStatuses = ['Open', 'In progress', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid fault status' });
        }

        const updateStmt = db.prepare(`UPDATE faults SET status = ? WHERE id = ? AND deleted_at IS NULL`);
        const result = updateStmt.run(status, faultId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Fault not found or already deleted' });
        }

        const auditStmt = db.prepare('INSERT INTO audit_logs (user_id, event_type, entity_type, entity_id) VALUES (?, ?, ?, ?)');
        auditStmt.run(req.user.id, 'Fault Completed', 'Fault', faultId);

        res.json({ success: true, message: 'Fault status updated', status });
    } catch (err) {
        console.error('Failed to update fault status:', err.message);
        res.status(500).json({ error: 'Failed to update fault status' });
    }
});

router.delete('/:id', (req, res) => {
    try {
        const faultId = parseInt(req.params.id, 10);
        if (!faultId) {
            return res.status(400).json({ error: 'Fault id is required' });
        }

        const deleteStmt = db.prepare('UPDATE faults SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL');
        const result = deleteStmt.run(faultId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Fault not found or already deleted' });
        }

        const auditStmt = db.prepare('INSERT INTO audit_logs (user_id, event_type, entity_type, entity_id) VALUES (?, ?, ?, ?)');
        auditStmt.run(req.user.id, 'Fault Deleted', 'Fault', faultId);

        res.json({ success: true, message: 'Fault deleted' });
    } catch (err) {
        console.error('Failed to delete fault:', err.message);
        res.status(500).json({ error: 'Failed to delete fault' });
    }
});

module.exports = router;
