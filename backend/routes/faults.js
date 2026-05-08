const express = require('express');
const router = express.Router();
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '../ar_transport.db');
const db = new Database(dbPath);

router.get('/', (req, res) => {
    res.json([
        {id: 1, location: "Tunnel A", type: "Structural Wear", severity: "High"},
        {id: 2, location: "Platform 3", type: "Electrical", severity: "Low"},
        {id: 3, location: "Tunnel B", type: "Blockage", severity: "Very High"}
    ]);
});

// Change 'res' to 'async (req, res)' so you can use await if needed
router.post('/report', async (req, res) => {
    console.log("full body recieved", req.body)
    try {
        // 1. "Open the letter" (Extract data from the request body)
        const { location, type, severity } = req.body;

        // 2. The SQL part (Using better-sqlite3)
        // Note: You need a valid location_id. For now, we'll assume 1 
        // until you're ready to look up location IDs!
        const stmt = db.prepare(`
            INSERT INTO faults (location_id, fault_type, severity, status) 
            VALUES (?, ?, ?, 'Open')
        `);

        // 3. Run the command
        const info = stmt.run(1, type, severity); 

        // 4. Send a success message back to React
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
module.exports = router;
