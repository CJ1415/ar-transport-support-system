const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json([
        {id: 1, location: "Tunnel A", type: "Structural Wear", severity: "High"},
        {id: 2, location: "Platform 3", type: "Electrical", severity: "Low"}
    ]);
});

router.post('/report', (req, res) => {
    console.log("Fault reported:", req.body);
    res.status(201).send({message: "Fault recorded successfully" });
});

module.exports = router;


