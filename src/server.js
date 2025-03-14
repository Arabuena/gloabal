const express = require('express');
const app = express();
const rideRoutes = require('./routes/rideRoutes');

// ... existing code ...

app.use('/api/rides', rideRoutes);

// ... existing code ... 