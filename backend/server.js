require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');

const { logOpenAIConfigStatus } = require('./config/openai');
const testRoute = require('./routes/test');
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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    app: 'StartupMantra',
    message: 'Backend is running.',
  });
});

app.use('/test', testRoute);
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
    console.error('[express] Invalid JSON body.', error.message);
    return res.status(400).json({
      message: 'Invalid JSON request body.',
    });
  }

  console.error('[express] Unhandled route error.', error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.status || 500).json({
    message: error.message || 'Something went wrong on the server.',
  });
});

app.listen(PORT, () => {
  logOpenAIConfigStatus();
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Restart the backend after changing backend/.env values.');
});
