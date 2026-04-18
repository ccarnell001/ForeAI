import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDB } from './db/index.js';
import authRoutes from './routes/auth.js';
import analyzeRoutes from './routes/analyze.js';
import historyRoutes from './routes/history.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please slow down.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
});

app.use(globalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', app: 'ForeAI' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/history', historyRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🏌️  ForeAI backend running on port ${PORT}`);
  });
}

start();
