const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const path = require('path');
const Database = require('better-sqlite3');
const JWT_SECRET = process.env.JWT_SECRET

const dbPath = path.resolve(__dirname, '../db/ar_transport.db');
const db = new Database(dbPath);

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username ==="engineer" && password === "Password1"){
        // Look up user ID from database
        const userStmt = db.prepare('SELECT id FROM users WHERE username = ?');
        const user = userStmt.get(username);
        
        if (!user) {
            return res.status(401).json({success: false, message: "User not found"});
        }

        const token = jwt.sign(
            {id: user.id, user: username, role: "technician"},
            JWT_SECRET,
            {expiresIn: '1h'}
        );

        return res.json({
            success: true,
            token: token,
            message: "Authentication successful"
        });

    } else {
        res.status(401).json({success: false, message: "Invalid credentials"});
    }
    
    
});


module.exports = router;