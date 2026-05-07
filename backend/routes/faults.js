const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');

const db = new Database('ar_transport.db');

router.get('/', (req, res) => {

    try {

        const stmt = db.prepare(`
            SELECT
                faults.id,
                locations.name AS location,
                faults.fault_type AS type,
                faults.severity
            FROM faults
            JOIN locations
            ON faults.location_id = locations.id
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

router.post('/report', (req, res) => {
    console.log("Fault reported:", req.body);

    res.status(201).send({
        message: "Fault recorded successfully"
    });
});

module.exports = router;