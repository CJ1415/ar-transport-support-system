const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const JWT_SECRET = process.env.JWT_SECRET

const dbPath = path.resolve(__dirname, '../db/ar_transport.db');
const db = new Database(dbPath);

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query user from database
        const userStmt = db.prepare('SELECT id, username, password_hash, role FROM users WHERE username = ?');
        const user = userStmt.get(username);

        if (!user) {
            return res.status(401).json({success: false, message: "Invalid credentials"});
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({success: false, message: "Invalid credentials"});
        }

        const token = jwt.sign(
            {id: user.id, user: user.username, role: user.role},
            JWT_SECRET,
            {expiresIn: '1h'}
        );

        return res.json({
            success: true,
            token: token,
            role: user.role,
            message: "Authentication successful"
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({success: false, message: "Internal server error"});
    }
});


module.exports = router;