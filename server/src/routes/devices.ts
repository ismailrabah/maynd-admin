// Maynd.ma Admin API - Device Management Routes
import { Hono } from 'hono';
import { db } from '../db/sqlite';
import { v4 as uuidv4 } from 'uuid';
import type { ApiResponse, PaginatedResponse, Device, DeviceRegistrationInput } from '../types';

const devicesRoutes = new Hono();

devicesRoutes.get('/', (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    const license_id = c.req.query('license_id');
    const status = c.req.query('status');
    const search = c.req.query('search');
    let query = `SELECT d.*, l.key as license_key, l.organization FROM devices d LEFT JOIN licenses l ON d.license_id = l.id`;
    const params: (string | number)[] = [];
    if (license_id || status || search) {
      query += ' WHERE ';
      const conditions: string[] = [];
      if (license_id) { conditions.push('d.license_id = ?'); params.push(license_id); }
      if (status) { conditions.push('d.status = ?'); params.push(status); }
      if (search) { conditions.push('(d.hostname LIKE ? OR d.hardware_fingerprint LIKE ? OR l.key LIKE ?)'); const s = `%${search}%`; params.push(s, s, s); }
      query += conditions.join(' AND ');
    }
    query += ' ORDER BY d.last_seen DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const devices = db.prepare(query).all(...params) as Array<Device & { license_key?: string; organization?: string }>;
    const count = db.prepare(license_id || status || search ? `SELECT COUNT(*) as count FROM devices d LEFT JOIN licenses l ON d.license_id = l.id WHERE ${conditions.join(' AND ')}` : 'SELECT COUNT(*) as count FROM devices').get(...params.slice(0, -2)) as { count: number };
    return c.json<PaginatedResponse<Device>>({
      success: true,
      data: devices,
      pagination: { page, limit, total: count.count, totalPages: Math.ceil(count.count / limit) }
    });
  } catch (error) {
    console.error('List devices error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

devicesRoutes.get('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as Device | undefined;
    if (!device) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Device not found' }, 404);
    }
    return c.json<ApiResponse<Device>>({ success: true, data: device });
  } catch (error) {
    console.error('Get device error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

devicesRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json<DeviceRegistrationInput>();
    if (!body.license_key || !body.hardware_fingerprint) {
      return c.json<ApiResponse<null>>({ success: false, error: 'license_key and hardware_fingerprint are required' }, 400);
    }
    const license = db.prepare('SELECT * FROM licenses WHERE key = ? AND status = \'active\'').get(body.license_key) as { id: string; max_devices: number; hardware_binding: boolean; expires_at?: string } | undefined;
    if (!license) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Invalid or inactive license key' }, 404);
    }
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return c.json<ApiResponse<null>>({ success: false, error: 'License has expired' }, 400);
    }
    if (license.hardware_binding) {
      const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices WHERE license_id = ? AND status = \'active\'').get(license.id) as { count: number };
      if (deviceCount.count >= license.max_devices) {
        return c.json<ApiResponse<null>>({ success: false, error: 'Maximum device limit reached for this license' }, 400);
      }
    }
    const existingDevice = db.prepare('SELECT * FROM devices WHERE hardware_fingerprint = ? AND license_id = ?').get(body.hardware_fingerprint, license.id) as Device | undefined;
    if (existingDevice) {
      db.prepare('UPDATE devices SET last_seen = datetime("now"), status = ? WHERE id = ?').run('active', existingDevice.id);
      return c.json<ApiResponse<Device>>({ success: true, data: existingDevice, message: 'Device already registered, updated last seen' });
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO devices (id, license_id, hardware_fingerprint, hostname, os, arch, cpu, memory, gpu, ip_address, status, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, license.id, body.hardware_fingerprint, body.hostname, body.os, body.arch, body.cpu, body.memory, body.gpu || null, body.ip_address || null, 'active', now, now
    );
    const newDevice = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as Device;
    db.prepare(`INSERT INTO activation_logs (id, license_id, device_id, action, ip_address, user_agent, success, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), license.id, id, 'activate', body.ip_address || c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip'), c.req.header('user-agent'), true, now
    );
    return c.json<ApiResponse<Device>>({ success: true, data: newDevice, message: 'Device registered successfully' });
  } catch (error) {
    console.error('Register device error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

devicesRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<DeviceRegistrationInput>>();
    const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as Device | undefined;
    if (!existing) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Device not found' }, 404);
    }
    const updates: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    if (body.hostname !== undefined) { updates.push('hostname = ?'); params.push(body.hostname); }
    if (body.os !== undefined) { updates.push('os = ?'); params.push(body.os); }
    if (body.arch !== undefined) { updates.push('arch = ?'); params.push(body.arch); }
    if (body.cpu !== undefined) { updates.push('cpu = ?'); params.push(body.cpu); }
    if (body.memory !== undefined) { updates.push('memory = ?'); params.push(body.memory); }
    if (body.gpu !== undefined) { updates.push('gpu = ?'); params.push(body.gpu); }
    if (body.ip_address !== undefined) { updates.push('ip_address = ?'); params.push(body.ip_address); }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
    if (updates.length === 0) {
      return c.json<ApiResponse<null>>({ success: false, error: 'No fields to update' }, 400);
    }
    params.push(id);
    db.prepare(`UPDATE devices SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const updatedDevice = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as Device;
    return c.json<ApiResponse<Device>>({ success: true, data: updatedDevice, message: 'Device updated successfully' });
  } catch (error) {
    console.error('Update device error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

devicesRoutes.delete('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as Device | undefined;
    if (!existing) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Device not found' }, 404);
    }
    db.prepare('DELETE FROM devices WHERE id = ?').run(id);
    return c.json<ApiResponse<Device>>({ success: true, data: existing, message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

devicesRoutes.post('/:id/deactivate', (c) => {
  try {
    const id = c.req.param('id');
    const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as Device | undefined;
    if (!existing) {
      return c.json<ApiResponse<null>>({ success: false, error: 'Device not found' }, 404);
    }
    db.prepare('UPDATE devices SET status = ?, last_seen = datetime("now") WHERE id = ?').run('inactive', id);
    const updatedDevice = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as Device;
    db.prepare(`INSERT INTO activation_logs (id, license_id, device_id, action, success, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(uuidv4(), existing.license_id, id, 'deactivate', true, new Date().toISOString());
    return c.json<ApiResponse<Device>>({ success: true, data: updatedDevice, message: 'Device deactivated successfully' });
  } catch (error) {
    console.error('Deactivate device error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

export default devicesRoutes;
