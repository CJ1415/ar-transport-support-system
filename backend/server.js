require('dotenv').config();
const cors = require('cors');
const express = require('express');
const app = express();
const protect = require('./middleware/authMiddleware');
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const faultRoutes = require('./routes/faults');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/analytics', protect, analyticsRoutes);
app.use('/api/faults', protect, faultRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`, 'hell yeah'));