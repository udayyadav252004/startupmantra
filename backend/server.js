require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');

const { logOpenAIConfigStatus } = require('./config/openai');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const generateIdeasRoutes = require('./routes/generateIdeas');
const ideaRoutes = require('./routes/ideas');
const roadmapRoutes = require('./routes/roadmap');
const roadmapHistoryRoutes = require('./routes/roadmaps');
const protectedRoutes = require('./routes/protected');

process.on('uncaughtException', (error) => {
  console.error('[process] Uncaught exception.', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[process] Unhandled rejection.', reason);
});

function getAllowedOrigins() {
  return String(process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const allowedOrigins = getAllowedOrigins();

app.use((req, res, next) => {
  console.log('Incoming:', req.method, req.url);
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS_ALLOWED_ORIGINS is not configured.'));
      }

      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed.'));
  },
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    app: 'StartupMantra',
    message: 'Backend is running.',
  });
});

app.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend running',
  });
});

app.use('/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/roadmaps', roadmapHistoryRoutes);
app.use('/generate-ideas', generateIdeasRoutes);
app.use('/generate-roadmap', roadmapRoutes);
app.use('/chat', chatRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', protectedRoutes);

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      message: 'Invalid JSON request body.',
    });
  }

  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.status || 500).json({
    message: error.message || 'Something went wrong on the server.',
  });
});

app.listen(PORT, () => {
  logOpenAIConfigStatus();
  console.log(`Server running on port ${PORT}`);
});
