require('dotenv').config();
const cors = require('cors');
const express = require('express');
const app = express();

// 1. IMPORT MIDDLEWARE
// MERGED: Getting both protect and authorizeRoles from their version
const { protect, authorizeRoles } = require('./middleware/authMiddleware');
const PORT = process.env.PORT || 3000;

// 2. GLOBAL MIDDLEWARE
// MERGED: Using their stricter CORS rule
app.use(cors({ origin: 'http://localhost:5173' }));

// MERGED: Keeping YOUR 50mb limits! Without this, the AR image uploads will crash the server!
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. IMPORT ROUTES
const faultRoutes = require('./routes/faults');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');

// 4. APPLY ROUTES

// Analytics: Restricted to Admin and Supervisor only (Their version)
app.use(
    '/api/analytics',
    protect,
    authorizeRoles('Admin', 'Supervisor'),
    analyticsRoutes
);

// Faults: Available to all logged-in users
app.use('/api/faults', protect, faultRoutes);

// Auth: Publicly accessible for login
app.use('/api/auth', authRoutes);

// 5. START SERVER
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`Server running on port: ${PORT}`);
    console.log(`Status: HELL YEAH`);
    console.log(`-----------------------------------------`);
});