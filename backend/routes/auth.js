const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

// TARGET: backend/db/ar_transport.db (up one level, then into db folder)
const dbPath = path.resolve(__dirname, '..', 'db', 'ar_transport.db');
const db = new Database(dbPath);

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Fetch user by username
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // 2. Compare Bcrypt hash (Plain text from user vs Hash from DB)
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // 3. Generate Token
        const token = jwt.sign(
            { id: user.id, user: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 4. Send response back to App.jsx
        return res.json({
            success: true,
            token: token,
            role: user.role,
            message: "Authentication successful"
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;