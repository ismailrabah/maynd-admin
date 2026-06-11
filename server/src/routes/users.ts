// Maynd.ma Admin API - User Management Routes
import { Hono } from 'hono';
import { db } from '../db/sqlite';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../middleware/auth';
import type { ApiResponse, PaginatedResponse, AdminUser, UserCreationInput } from '../types';

const usersRoutes = new Hono();

usersRoutes.get('/', (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    const role = c.req.query('role');
    const status = c.req.query('status');
    const search = c.req.query('search');
    let query = 'SELECT * FROM admin_users';
    const params: (string | number)[] = [];
    if (role || status || search) {
      query += ' WHERE ';
      const conditions: string[] = [];
      if (role) { conditions.push('role = ?'); params.push(role); }
      if (status) { conditions.push('status = ?'); params.push(status); }
      if (search) { conditions.push('(username LIKE ? OR email LIKE ?)'); const s = `%${search}%`; params.push(s, s); }
      query += conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const users = db.prepare(query).all(...params) as AdminUser[];
    const sanitizedUsers = users.map(user => { const { password_hash, ...rest } = user; return rest; });
    const count = db.prepare(`SELECT COUNT(*) as count FROM admin_users${role || status || search ? ' WHERE ' + conditions.join(' AND ') : ''}`).get(...params.slice(0, -2)) as { count: number };
    return c.json<PaginatedResponse<Omit<AdminUser, 'password_hash'>>>({
      success: true,
      data: sanitizedUsers,
      pagination: { page, limit, total: count.count, totalPages: Math.ceil(count.count / limit) }
    });
  } catch (error) {
    console.error('List users error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

usersRoutes.get('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id) as AdminUser | undefined;
    if (!user) {
      return c.json<ApiResponse<null>>({ success: false, error: 'User not found' }, 404);
    }
    const { password_hash, ...sanitizedUser } = user;
    return c.json<ApiResponse<Omit<AdminUser, 'password_hash'>>>({
      success: true,
      data: sanitizedUser
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

usersRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<UserCreationInput>();
    if (!body.username || !body.email || !body.password) {
      return c.json<ApiResponse<null>>({ success: false, error: 'username, email, and password are required' }, 400);
    }
    const existing = db.prepare('SELECT id FROM admin_users WHERE username = ? OR email = ?').get(body.username, body.email);
    if (existing) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Username or email already exists' }, 409);
    }
    const id = uuidv4();
    const passwordHash = hashPassword(body.password);
    const now = new Date().toISOString();
    db.prepare('INSERT INTO admin_users (id, username, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, body.username, body.email, passwordHash, body.role || 'admin', 'active', now);
    const newUser = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id) as AdminUser;
    const { password_hash, ...sanitizedUser } = newUser;
    return c.json<ApiResponse<Omit<AdminUser, 'password_hash'>>>({
      success: true,
      data: sanitizedUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

usersRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<UserCreationInput>>();
    const existing = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id) as AdminUser | undefined;
    if (!existing) {
      return c.json<ApiResponse<null>>({ success: false, error: 'User not found' }, 404);
    }
    const updates: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    if (body.username !== undefined) {
      const existingUsername = db.prepare('SELECT id FROM admin_users WHERE username = ? AND id != ?').get(body.username, id);
      if (existingUsername) {
        return c.json<ApiResponse<null>>({ success: false, error: 'Username already exists' }, 409);
      }
      updates.push('username = ?');
      params.push(body.username);
    }
    if (body.email !== undefined) {
      const existingEmail = db.prepare('SELECT id FROM admin_users WHERE email = ? AND id != ?').get(body.email, id);
      if (existingEmail) {
        return c.json<ApiResponse<null>>({ success: false, error: 'Email already exists' }, 409);
      }
      updates.push('email = ?');
      params.push(body.email);
    }
    if (body.password !== undefined) {
      updates.push('password_hash = ?');
      params.push(hashPassword(body.password));
    }
    if (body.role !== undefined) {
      updates.push('role = ?');
      params.push(body.role);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      params.push(body.status);
    }
    if (updates.length === 0) {
      return c.json<ApiResponse<null>>({ success: false, error: 'No fields to update' }, 400);
    }
    params.push(id);
    db.prepare(`UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const updatedUser = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id) as AdminUser;
    const { password_hash, ...sanitizedUser } = updatedUser;
    return c.json<ApiResponse<Omit<AdminUser, 'password_hash'>>>({
      success: true,
      data: sanitizedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

usersRoutes.delete('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const superadminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users WHERE role = ?').get('superadmin') as { count: number };
    const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id) as AdminUser | undefined;
    if (!user) {
      return c.json<ApiResponse<null>>({ success: false, error: 'User not found' }, 404);
    }
    if (user.role === 'superadmin' && superadminCount.count <= 1) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Cannot delete the last superadmin user' }, 400);
    }
    db.prepare('DELETE FROM admin_users WHERE id = ?').run(id);
    const { password_hash, ...sanitizedUser } = user;
    return c.json<ApiResponse<Omit<AdminUser, 'password_hash'>>>({
      success: true,
      data: sanitizedUser,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

usersRoutes.get('/me', (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Unauthorized' }, 401);
    }
    const dbUser = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(user.id) as AdminUser | undefined;
    if (!dbUser) {
      return c.json<ApiResponse<null>>({ success: false, error: 'User not found' }, 404);
    }
    const { password_hash, ...sanitizedUser } = dbUser;
    return c.json<ApiResponse<Omit<AdminUser, 'password_hash'>>>({
      success: true,
      data: sanitizedUser
    });
  } catch (error) {
    console.error('Get me error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

export default usersRoutes;
