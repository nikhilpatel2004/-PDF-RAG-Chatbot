import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload.js';
import chatRouter from './routes/chat.js';
import summaryRouter from './routes/summary.js';
import quizRouter from './routes/quiz.js';
import { logger } from './utils/logger.js';

const app = express();
const port = process.env.PORT || 4000;

// Allow multiple origins for development
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/upload', uploadRouter);
app.use('/api/chat', chatRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/quiz', quizRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
