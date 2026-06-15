import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Resolve __dirname under ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables safely
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { db } from './shared/database.js'; // This imports and initializes the SQLite database

// Import routers
import adminRouter, { registerLegacyAdminRoutes } from './features/admin/presentation/routes.js';
import authRouter from './features/auth/presentation/routes.js';
import bazkariaRouter from './features/bazkaria/presentation/routes.js';
import konpartsakideakRouter from './features/konpartsakideak/presentation/routes.js';
import memesRouter, { registerLegacyMemeRoutes } from './features/memes/presentation/routes.js';
import postersRouter, { registerLegacyPosterRoutes } from './features/posters/presentation/routes.js';
import reviewsRouter, { registerLegacyReviewRoutes } from './features/reviews/presentation/routes.js';
import rulesRouter from './features/rules/presentation/routes.js';
import songsRouter from './features/songs/presentation/routes.js';
import systemRouter, { registerLegacySystemRoutes } from './features/system/presentation/routes.js';

const app = express();

// Set proxy trust
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directories exist relative to root
const uploadDirMemes = path.resolve(__dirname, '..', 'uploads', 'memes');
const uploadDirPosters = path.resolve(__dirname, '..', 'uploads', 'posters');
if (!fs.existsSync(uploadDirMemes)) fs.mkdirSync(uploadDirMemes, { recursive: true });
if (!fs.existsSync(uploadDirPosters)) fs.mkdirSync(uploadDirPosters, { recursive: true });

// Serve static files
app.use('/uploads/memes', express.static(uploadDirMemes));
app.use('/uploads/posters', express.static(uploadDirPosters));
app.use('/assets', express.static(path.resolve(__dirname, '..', '..', 'public', 'assets')));

// Mount API routers under /api
app.use('/api', authRouter);
app.use('/api', bazkariaRouter);
app.use('/api', konpartsakideakRouter);
app.use('/api', memesRouter);
app.use('/api', postersRouter);
app.use('/api', reviewsRouter);
app.use('/api', rulesRouter);
app.use('/api', songsRouter);
app.use('/api', systemRouter);

// Register legacy non-prefixed routes for backward-compatibility with admin dashboard
registerLegacyAdminRoutes(app);
registerLegacyMemeRoutes(app);
registerLegacyPosterRoutes(app);
registerLegacyReviewRoutes(app);
registerLegacySystemRoutes(app);

// Global Express error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global Express error handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Zerbitzari errorea.'
  });
});

// Start the server and handle EADDRINUSE gracefully
const server = app.listen(PORT, () => {
  console.log(`Pikutara API running on http://localhost:${PORT}`);
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use by another process. Please stop that process and try again.`);
  } else {
    console.error('Server error event:', error);
  }
});

// Prevent Node process from crashing due to unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Prevent Node process from crashing due to uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
});

export default app;
