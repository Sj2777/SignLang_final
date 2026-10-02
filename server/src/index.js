import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import communityRoutes from './routes/community.js';
import lessonRoutes from './routes/lessons.js';

const requiredEnvironment = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_ORIGIN'];
const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key]);
if (missingEnvironment.length) {
  throw new Error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/lessons', lessonRoutes);

app.use((req, res) => res.status(404).json({
  error: { code: 'NOT_FOUND', message: 'That page could not be found.' },
}));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  const code = status === 400 && error.type === 'entity.parse.failed'
    ? 'INVALID_JSON'
    : 'INTERNAL_ERROR';
  const message = code === 'INVALID_JSON'
    ? 'Request body must contain valid JSON.'
    : 'Something went wrong. Please try again.';
  return res.status(status).json({ error: { code, message } });
});

const port = Number(process.env.PORT || 5000);
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.info(`[database] Connected to MongoDB database "${mongoose.connection.name}".`);
  app.listen(port, () => console.log(`HandSpeak API listening on port ${port}`));
} catch (error) {
  console.error('[database] Failed to connect to MongoDB:', error.message);
  process.exitCode = 1;
}
