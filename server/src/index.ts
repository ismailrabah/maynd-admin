// Maynd.ma Admin API - Main Entry Point
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { db, initializeDatabase } from './db/sqlite';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import licensesRoutes from './routes/licenses';
import devicesRoutes from './routes/devices';
import modelsRoutes from './routes/models';
import statsRoutes from './routes/stats';

initializeDatabase();

const app = new Hono();
app.use('*', logger());
app.use('*', cors());
app.use('*', prettyJSON());

app.get('/', (c) => c.json({ success: true, message: 'Maynd.ma Admin API', version: '1.0.0', timestamp: new Date().toISOString() }));

app.get('/health', (c) => {
  try {
    db.prepare('SELECT 1').get();
    return c.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
  } catch {
    return c.json({ success: false, status: 'unhealthy', error: 'Database connection failed' }, 500);
  }
});

// Public routes
app.route('/api/auth', authRoutes);
app.route('/api/licenses', licensesRoutes);
app.route('/api/devices', devicesRoutes);

// Protected routes
const protectedApp = new Hono();
protectedApp.use('*', authMiddleware);
protectedApp.route('/users', usersRoutes);
protectedApp.route('/licenses', licensesRoutes);
protectedApp.route('/devices', devicesRoutes);
protectedApp.route('/models', modelsRoutes);
protectedApp.route('/stats', statsRoutes);
app.route('/api', protectedApp);

app.onError((err, c) => c.json({ success: false, error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? err.message : undefined }, 500));
app.notFound((c) => c.json({ success: false, error: 'Not found', path: c.req.path }, 404));

const port = parseInt(process.env.PORT || '4000');
console.log(`\nMaynd.ma Admin API\nhttps://github.com/ismailrabah/maynd-admin\n`);
console.log(`Starting server on http://localhost:${port}`);

serve({ fetch: app.fetch, port }, () => console.log(`Server is running on http://localhost:${port}`));
