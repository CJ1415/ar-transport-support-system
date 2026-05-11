require('dotenv').config();
const cors = require('cors');
const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const app = express();

// 1. DATABASE CONNECTION
// Points to backend/db/ar_transport.db
const dbPath = path.resolve(__dirname, 'db', 'ar_transport.db');
const db = new Database(dbPath);

// 2. IMPORT MIDDLEWARE
const { protect, authorizeRoles } = require('./middleware/authMiddleware');
const PORT = process.env.PORT || 3000;

// 3. GLOBAL MIDDLEWARE
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. IMPORT ROUTES
const faultRoutes = require('./routes/faults');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');

// 5. APPLY ROUTES
app.use('/api/analytics', protect, authorizeRoles('Admin', 'Supervisor'), analyticsRoutes);
app.use('/api/faults', protect, faultRoutes);
app.use('/api/auth', authRoutes);

// 6. START SERVER
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`Server running on port: ${PORT}`);
    console.log(`Database Connected: ${dbPath}`);
    console.log(`Status: HELL YEAH`);
    console.log(`-----------------------------------------`);
});