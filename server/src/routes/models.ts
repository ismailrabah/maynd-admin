// Maynd.ma Admin API - Model Management Routes
import { Hono } from 'hono';
import { db } from '../db/sqlite';
import { v4 as uuidv4 } from 'uuid';
import type { ApiResponse, PaginatedResponse, AIModel, ModelCreationInput } from '../types';

const modelsRoutes = new Hono();

modelsRoutes.get('/', (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    const type = c.req.query('type');
    const status = c.req.query('status');
    const search = c.req.query('search');
    let query = 'SELECT * FROM models';
    const params: (string | number)[] = [];
    if (type || status || search) {
      query += ' WHERE ';
      const conditions: string[] = [];
      if (type) { conditions.push('type = ?'); params.push(type); }
      if (status) { conditions.push('status = ?'); params.push(status); }
      if (search) { conditions.push('(name LIKE ? OR filename LIKE ?)'); const s = `%${search}%`; params.push(s, s); }
      query += conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const models = db.prepare(query).all(...params) as AIModel[];
    const count = db.prepare(type || status || search ? `SELECT COUNT(*) as count FROM models WHERE ${conditions.join(' AND ')}` : 'SELECT COUNT(*) as count FROM models').get(...params.slice(0, -2)) as { count: number };
    return c.json<PaginatedResponse<AIModel>>({
      success: true,
      data: models,
      pagination: { page, limit, total: count.count, totalPages: Math.ceil(count.count / limit) }
    });
  } catch (error) {
    console.error('List models error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

modelsRoutes.get('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const model = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as AIModel | undefined;
    if (!model) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Model not found' }, 404);
    }
    return c.json<ApiResponse<AIModel>>({ success: true, data: model });
  } catch (error) {
    console.error('Get model error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

modelsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<ModelCreationInput>();
    if (!body.name || !body.filename || !body.url) {
      return c.json<ApiResponse<null>>({ success: false, error: 'name, filename, and url are required' }, 400);
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO models (id, name, filename, size, parameters, quant, type, url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, body.name, body.filename, body.size || 0, body.parameters || 0, body.quant || 'unknown', body.type || 'llm', body.url, body.status || 'available', now
    );
    const newModel = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as AIModel;
    return c.json<ApiResponse<AIModel>>({ success: true, data: newModel, message: 'Model created successfully' });
  } catch (error) {
    console.error('Create model error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

modelsRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<ModelCreationInput>>();
    const existing = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as AIModel | undefined;
    if (!existing) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Model not found' }, 404);
    }
    const updates: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    if (body.name !== undefined) { updates.push('name = ?'); params.push(body.name); }
    if (body.filename !== undefined) { updates.push('filename = ?'); params.push(body.filename); }
    if (body.size !== undefined) { updates.push('size = ?'); params.push(body.size); }
    if (body.parameters !== undefined) { updates.push('parameters = ?'); params.push(body.parameters); }
    if (body.quant !== undefined) { updates.push('quant = ?'); params.push(body.quant); }
    if (body.type !== undefined) { updates.push('type = ?'); params.push(body.type); }
    if (body.url !== undefined) { updates.push('url = ?'); params.push(body.url); }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
    if (updates.length === 0) {
      return c.json<ApiResponse<null>>({ success: false, error: 'No fields to update' }, 400);
    }
    params.push(id);
    db.prepare(`UPDATE models SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const updatedModel = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as AIModel;
    return c.json<ApiResponse<AIModel>>({ success: true, data: updatedModel, message: 'Model updated successfully' });
  } catch (error) {
    console.error('Update model error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

modelsRoutes.delete('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const existing = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as AIModel | undefined;
    if (!existing) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Model not found' }, 404);
    }
    db.prepare('DELETE FROM models WHERE id = ?').run(id);
    return c.json<ApiResponse<AIModel>>({ success: true, data: existing, message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Delete model error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

export default modelsRoutes;
