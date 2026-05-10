require('dotenv').config();
const cors = require('cors');
const express = require('express');
const app = express();

// 1. IMPORT MIDDLEWARE (Using destructuring to get both functions)
const { protect, authorizeRoles } = require('./middleware/authMiddleware');
const PORT = process.env.PORT || 3000;

// 2. GLOBAL MIDDLEWARE
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

// 3. IMPORT ROUTES
const faultRoutes = require('./routes/faults');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');

// 4. APPLY ROUTES

// Analytics: Restricted to Admin and Supervisor only
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