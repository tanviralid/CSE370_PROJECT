const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/reports', require('./routes/reports'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/police', require('./routes/police'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SafeCity API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
