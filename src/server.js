require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const toyRoutes = require('./routes/toys');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/users', authRoutes);
app.use('/toys', toyRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  return res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT) || 3001;
async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGODB_URI and JWT_SECRET must be set in the environment');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`Toys API listening on port ${port}`));
}

if (require.main === module) {
  start().catch((error) => { console.error(error); process.exit(1); });
}

module.exports = app;
