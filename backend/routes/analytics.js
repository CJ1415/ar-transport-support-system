const express = require('express');
const router = express.Router();
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '../db/ar_transport.db');
const db = new Database(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

// Severity breakdown — how many faults per severity level
router.get('/severity-breakdown', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT severity, COUNT(*) as count
            FROM faults
            WHERE deleted_at IS NULL
            GROUP BY severity
            ORDER BY CASE severity
                WHEN 'Critical' THEN 1
                WHEN 'High' THEN 2
                WHEN 'Medium' THEN 3
                WHEN 'Low' THEN 4
            END
        `);
        res.json(stmt.all());
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch severity breakdown' });
    }
});

// Fault type breakdown — how many faults per fault type
router.get('/fault-types', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT fault_type, COUNT(*) as count
            FROM faults
            WHERE deleted_at IS NULL
            GROUP BY fault_type
            ORDER BY count DESC
        `);
        res.json(stmt.all());
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch fault types' });
    }
});

// Tool status — current check in/out status of each tool
router.get('/tool-status', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT 
                t.id,
                t.name,
                t.category,
                t.rfid_tag,
                t.calibration_due,
                tcl.action as last_action,
                tcl.checked_at as last_checked
            FROM tools t
            LEFT JOIN tool_check_logs tcl ON tcl.id = (
                SELECT id FROM tool_check_logs
                WHERE tool_id = t.id
                ORDER BY checked_at DESC
                LIMIT 1
            )
            ORDER BY t.name
        `);
        res.json(stmt.all());
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch tool status' });
    }
});

// Active sessions — sessions that have not ended
router.get('/active-sessions', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT 
                s.id,
                s.device_uid,
                s.started_at,
                u.username,
                u.role,
                l.name as location,
                l.tunnel_section
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            JOIN locations l ON s.location_id = l.id
            WHERE s.ended_at IS NULL
            ORDER BY s.started_at DESC
        `);
        res.json(stmt.all());
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch active sessions' });
    }
});

// Audit log — most recent system events
router.get('/audit-log', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT 
                al.id,
                al.event_type,
                al.entity_type,
                al.entity_id,
                al.occurred_at,
                u.username
            FROM audit_logs al
            JOIN users u ON al.user_id = u.id
            ORDER BY al.occurred_at DESC
            LIMIT 50
        `);
        res.json(stmt.all());
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

// ML predictions — predicted severity for active open faults
router.get('/ml-predictions', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT 
                f.id,
                f.fault_type,
                f.asset_class,
                f.severity as actual_severity,
                f.status,
                l.name as location,
                l.tunnel_section,
                p.predicted_severity,
                p.confidence,
                p.predicted_at
            FROM faults f
            JOIN locations l ON f.location_id = l.id
            JOIN predictions p ON p.fault_id = f.id
            WHERE f.status IN ('Open', 'In progress')
            AND f.deleted_at IS NULL
            ORDER BY p.confidence DESC
        `);
        res.json(stmt.all());
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch ML predictions' });
    }
});

module.exports = router;