require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/me'));
app.use('/api/users', require('./routes/users'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/objectives', require('./routes/objectives'));
app.use('/api/cycles', require('./routes/cycles'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/hrdecisions', require('./routes/hrdecisions'));
app.use('/api/kpi', require('./routes/kpi'));
app.use('/api/kpi-crud', require('./routes/kpiCrud'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});