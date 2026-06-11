// Maynd.ma Admin API - Authentication Routes
import { Hono } from 'hono';
import { db } from '../db/sqlite';
import { generateToken, hashPassword, verifyPassword } from '../middleware/auth';
import type { LoginInput, ApiResponse, AuthToken, AdminUser } from '../types';

const authRoutes = new Hono();

authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json<LoginInput>();
    if (!body.username || !body.password) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Username and password are required' }, 400);
    }
    const user = db.prepare('SELECT id, username, email, password_hash, role, status FROM admin_users WHERE username = ? OR email = ?').get(body.username, body.username) as AdminUser | undefined;
    if (!user) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Invalid username or password' }, 401);
    }
    if (user.status !== 'active') {
      return c.json<ApiResponse<null>>({ success: false, error: 'Account is inactive' }, 403);
    }
    const isValid = verifyPassword(body.password, user.password_hash);
    if (!isValid) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Invalid username or password' }, 401);
    }
    const token = await generateToken(user.id, user.username, user.email, user.role);
    db.prepare('UPDATE admin_users SET last_login = datetime("now") WHERE id = ?').run(user.id);
    return c.json<ApiResponse<AuthToken>>({
      success: true,
      data: {
        token,
        expires_in: 24 * 60 * 60,
        user: { id: user.id, username: user.username, email: user.email, role: user.role }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

authRoutes.post('/refresh', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json<ApiResponse<null>>({ success: false, error: 'No token provided' }, 401);
    }
    const token = authHeader.substring(7);
    const user = await verifyToken(token);
    if (!user) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Invalid token' }, 401);
    }
    const dbUser = db.prepare('SELECT id, username, email, role, status FROM admin_users WHERE id = ?').get(user.userId) as AdminUser | undefined;
    if (!dbUser || dbUser.status !== 'active') {
      return c.json<ApiResponse<null>>({ success: false, error: 'User not found or inactive' }, 401);
    }
    const newToken = await generateToken(dbUser.id, dbUser.username, dbUser.email, dbUser.role);
    return c.json<ApiResponse<AuthToken>>({
      success: true,
      data: {
        token: newToken,
        expires_in: 24 * 60 * 60,
        user: { id: dbUser.id, username: dbUser.username, email: dbUser.email, role: dbUser.role }
      }
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

authRoutes.post('/change-password', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Unauthorized' }, 401);
    }
    const { currentPassword, newPassword } = await c.req.json<{ currentPassword: string; newPassword: string }>();
    if (!currentPassword || !newPassword) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Current and new password are required' }, 400);
    }
    const dbUser = db.prepare('SELECT password_hash FROM admin_users WHERE id = ?').get(user.id) as { password_hash: string } | undefined;
    if (!dbUser) {
      return c.json<ApiResponse<null>>({ success: false, error: 'User not found' }, 404);
    }
    const isValid = verifyPassword(currentPassword, dbUser.password_hash);
    if (!isValid) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Current password is incorrect' }, 401);
    }
    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
    return c.json<ApiResponse<null>>({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

export default authRoutes;
