// Maynd.ma Admin API - License Management Routes
import { Hono } from 'hono';
import { db } from '../db/sqlite';
import { v4 as uuidv4 } from 'uuid';
import type { ApiResponse, PaginatedResponse, License, LicenseCreationInput, ValidationResponse, Device } from '../types';

const licensesRoutes = new Hono();

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let key = '';
  for (let i = 0; i < 20; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key.match(/.{1,4}/g)?.join('-') || key;
}

licensesRoutes.get('/', (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    const status = c.req.query('status');
    const type = c.req.query('type');
    const search = c.req.query('search');
    let query = `SELECT * FROM licenses`;
    const params: (string | number)[] = [];
    if (status || type || search) {
      query += ' WHERE ';
      const conditions: string[] = [];
      if (status) { conditions.push('status = ?'); params.push(status); }
      if (type) { conditions.push('type = ?'); params.push(type); }
      if (search) { conditions.push('(organization LIKE ? OR email LIKE ? OR customer_id LIKE ? OR key LIKE ?)'); const s = `%${search}%`; params.push(s, s, s, s); }
      query += conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const licenses = db.prepare(query).all(...params) as License[];
    const count = db.prepare(status || type || search ? `SELECT COUNT(*) as count FROM licenses WHERE ${conditions.join(' AND ')}` : 'SELECT COUNT(*) as count FROM licenses').get(...params.slice(0, -2)) as { count: number };
    return c.json<PaginatedResponse<License>>({
      success: true,
      data: licenses,
      pagination: { page, limit, total: count.count, totalPages: Math.ceil(count.count / limit) }
    });
  } catch (error) {
    console.error('List licenses error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

licensesRoutes.get('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const license = db.prepare('SELECT * FROM licenses WHERE id = ?').get(id) as License | undefined;
    if (!license) {
      return c.json<ApiResponse<null>>({ success: false, error: 'License not found' }, 404);
    }
    const devices = db.prepare('SELECT * FROM devices WHERE license_id = ?').all(license.id);
    return c.json<ApiResponse<License & { devices: unknown[] }>>({
      success: true,
      data: { ...license, devices }
    });
  } catch (error) {
    console.error('Get license error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

licensesRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<LicenseCreationInput>();
    if (!body.customer_id || !body.organization || !body.email) {
      return c.json<ApiResponse<null>>({ success: false, error: 'customer_id, organization, and email are required' }, 400);
    }
    const id = uuidv4();
    const key = generateLicenseKey();
    const now = new Date().toISOString();
    let expires_at: string | null = null;
    if (body.expires_in_days) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + body.expires_in_days);
      expires_at = expiryDate.toISOString();
    }
    db.prepare(`INSERT INTO licenses (id, key, product, type, seats, max_devices, status, customer_id, organization, email, phone, created_at, expires_at, hardware_binding, usb_binding, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, key, body.product || 'maynd-desktop', body.type || 'pro', body.seats || 1, body.max_devices || 1, 'active',
      body.customer_id, body.organization, body.email, body.phone || null, now, expires_at,
      body.hardware_binding ?? true, body.usb_binding ?? false, JSON.stringify(body.metadata || {})
    );
    const newLicense = db.prepare('SELECT * FROM licenses WHERE id = ?').get(id) as License;
    db.prepare('INSERT INTO activation_logs (id, license_id, action, success, created_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), id, 'activate', true, now);
    return c.json<ApiResponse<License>>({ success: true, data: newLicense, message: 'License created successfully' });
  } catch (error) {
    console.error('Create license error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

licensesRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<LicenseCreationInput>>();
    const existing = db.prepare('SELECT * FROM licenses WHERE id = ?').get(id) as License | undefined;
    if (!existing) {
      return c.json<ApiResponse<null>>({ success: false, error: 'License not found' }, 404);
    }
    const updates: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    if (body.type !== undefined) { updates.push('type = ?'); params.push(body.type); }
    if (body.seats !== undefined) { updates.push('seats = ?'); params.push(body.seats); }
    if (body.max_devices !== undefined) { updates.push('max_devices = ?'); params.push(body.max_devices); }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
    if (body.organization !== undefined) { updates.push('organization = ?'); params.push(body.organization); }
    if (body.email !== undefined) { updates.push('email = ?'); params.push(body.email); }
    if (body.phone !== undefined) { updates.push('phone = ?'); params.push(body.phone); }
    if (body.hardware_binding !== undefined) { updates.push('hardware_binding = ?'); params.push(body.hardware_binding); }
    if (body.usb_binding !== undefined) { updates.push('usb_binding = ?'); params.push(body.usb_binding); }
    if (body.metadata !== undefined) { updates.push('metadata = ?'); params.push(JSON.stringify(body.metadata)); }
    if (updates.length === 0) {
      return c.json<ApiResponse<null>>({ success: false, error: 'No fields to update' }, 400);
    }
    params.push(id);
    db.prepare(`UPDATE licenses SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const updatedLicense = db.prepare('SELECT * FROM licenses WHERE id = ?').get(id) as License;
    return c.json<ApiResponse<License>>({ success: true, data: updatedLicense, message: 'License updated successfully' });
  } catch (error) {
    console.error('Update license error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

licensesRoutes.delete('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const existing = db.prepare('SELECT * FROM licenses WHERE id = ?').get(id) as License | undefined;
    if (!existing) {
      return c.json<ApiResponse<null>>({ success: false, error: 'License not found' }, 404);
    }
    db.prepare('DELETE FROM licenses WHERE id = ?').run(id);
    return c.json<ApiResponse<License>>({ success: true, data: existing, message: 'License deleted successfully' });
  } catch (error) {
    console.error('Delete license error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

licensesRoutes.post('/validate', async (c) => {
  try {
    const { license_key, hardware_fingerprint, device_info } = await c.req.json<{ license_key: string; hardware_fingerprint?: string; device_info?: Record<string, unknown> }>();
    if (!license_key) {
      return c.json<ValidationResponse>({ success: false, valid: false, error: 'License key is required' }, 400);
    }
    const license = db.prepare('SELECT * FROM licenses WHERE key = ? AND status = \'active\'').get(license_key) as License | undefined;
    if (!license) {
      return c.json<ValidationResponse>({ success: true, valid: false, error: 'Invalid or inactive license key' });
    }
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      db.prepare('UPDATE licenses SET status = ? WHERE id = ?').run('expired', license.id);
      return c.json<ValidationResponse>({ success: true, valid: false, error: 'License has expired', reason: 'expired' });
    }
    if (hardware_fingerprint && license.hardware_binding) {
      const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices WHERE license_id = ? AND status = \'active\'').get(license.id) as { count: number };
      if (deviceCount.count >= license.max_devices) {
        return c.json<ValidationResponse>({ success: true, valid: false, error: 'Maximum device limit reached', reason: 'device_limit_reached' });
      }
      const existingDevice = db.prepare('SELECT * FROM devices WHERE hardware_fingerprint = ? AND license_id = ?').get(hardware_fingerprint, license.id) as Device | undefined;
      if (!existingDevice) {
        const deviceId = uuidv4();
        const now = new Date().toISOString();
        db.prepare(`INSERT INTO devices (id, license_id, hardware_fingerprint, hostname, os, arch, cpu, memory, gpu, ip_address, status, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          deviceId, license.id, hardware_fingerprint, device_info?.hostname || 'unknown', device_info?.os || 'unknown',
          device_info?.arch || 'unknown', device_info?.cpu || 'unknown', device_info?.memory || 0,
          device_info?.gpu || null, device_info?.ip_address || null, 'active', now, now
        );
      }
    }
    const deviceId = hardware_fingerprint ? db.prepare('SELECT id FROM devices WHERE hardware_fingerprint = ?').get(hardware_fingerprint)?.id : null;
    db.prepare(`INSERT INTO activation_logs (id, license_id, device_id, action, ip_address, user_agent, success, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), license.id, deviceId || null, 'validate',
      c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip'),
      c.req.header('user-agent'), true, new Date().toISOString()
    );
    return c.json<ValidationResponse>({ success: true, valid: true, license });
  } catch (error) {
    console.error('Validate license error:', error);
    return c.json<ValidationResponse>({ success: false, valid: false, error: 'Internal server error' }, 500);
  }
});

licensesRoutes.get('/validate/:key', (c) => {
  try {
    const key = c.req.param('key');
    const license = db.prepare('SELECT * FROM licenses WHERE key = ? AND status = \'active\'').get(key) as License | undefined;
    if (!license) {
      return c.json<ValidationResponse>({ success: true, valid: false, error: 'Invalid or inactive license key' });
    }
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return c.json<ValidationResponse>({ success: true, valid: false, error: 'License has expired', reason: 'expired' });
    }
    return c.json<ValidationResponse>({ success: true, valid: true, license });
  } catch (error) {
    console.error('Quick validate error:', error);
    return c.json<ValidationResponse>({ success: false, valid: false, error: 'Internal server error' }, 500);
  }
});

export default licensesRoutes;
