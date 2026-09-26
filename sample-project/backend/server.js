const express = require('express');
const cors = require('cors');
const tasksRouter = require('./routes/tasks');
const authRouter = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/tasks', tasksRouter);
app.use('/api', authRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Only start listening if this file is run directly (keeps it testable via supertest)
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`TaskFlow backend (sample buggy project) running on :${PORT}`));
}

module.exports = app;
