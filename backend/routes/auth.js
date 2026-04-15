const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET

router.post('/login', (req, res) => {
    const { username, password} = req.body;

    if (username ==="engineer1" && password === "Password-1"){
        const token = jwt.sign(
            {user: username, role: "technician"},
            JWT_SECRET,
            {expiresIn: '1h'}
        );

        return res.json({
            success: true,
            token: token,
            message: "Authentication successful"
        });
    }

    res.status(401).json({success: false, message: "Invalid credentials"});
});

module.exports = router;