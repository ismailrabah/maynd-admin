// Maynd.ma Admin API - Statistics Routes
import { Hono } from 'hono';
import { db } from '../db/sqlite';
import type { ApiResponse, DashboardStats } from '../types';

const statsRoutes = new Hono();

statsRoutes.get('/', (c) => {
  try {
    const totalLicenses = db.prepare('SELECT COUNT(*) as count FROM licenses').get() as { count: number };
    const activeLicenses = db.prepare("SELECT COUNT(*) as count FROM licenses WHERE status = 'active'").get() as { count: number };
    const expiredLicenses = db.prepare("SELECT COUNT(*) as count FROM licenses WHERE status = 'expired'").get() as { count: number };
    const totalDevices = db.prepare('SELECT COUNT(*) as count FROM devices').get() as { count: number };
    const activeDevices = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'active'").get() as { count: number };
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
    const totalModels = db.prepare('SELECT COUNT(*) as count FROM models').get() as { count: number };
    const recentActivations = db.prepare(`SELECT COUNT(*) as count FROM activation_logs WHERE action = 'activate' AND created_at >= datetime('now', '-7 days')`).get() as { count: number };
    const licensesByType = db.prepare('SELECT type, COUNT(*) as count FROM licenses GROUP BY type').all() as Array<{ type: string; count: number }>;
    const licensesByStatus = db.prepare('SELECT status, COUNT(*) as count FROM licenses GROUP BY status').all() as Array<{ status: string; count: number }>;
    const devicesByOS = db.prepare('SELECT os, COUNT(*) as count FROM devices GROUP BY os ORDER BY count DESC LIMIT 5').all() as Array<{ os: string; count: number }>;
    const stats: DashboardStats & { licenses_by_type: Array<{ type: string; count: number }>; licenses_by_status: Array<{ status: string; count: number }>; devices_by_os: Array<{ os: string; count: number }> } = {
      total_licenses: totalLicenses.count,
      active_licenses: activeLicenses.count,
      expired_licenses: expiredLicenses.count,
      total_devices: totalDevices.count,
      active_devices: activeDevices.count,
      total_users: totalUsers.count,
      total_models: totalModels.count,
      recent_activations: recentActivations.count,
      licenses_by_type: licensesByType,
      licenses_by_status: licensesByStatus,
      devices_by_os: devicesByOS
    };
    return c.json<ApiResponse<typeof stats>>({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

statsRoutes.get('/activations', (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30');
    const activations = db.prepare(`SELECT date(created_at) as date, action, COUNT(*) as count FROM activation_logs WHERE created_at >= datetime('now', ? || ' days') GROUP BY date, action ORDER BY date`).all(`-${days}`) as Array<{ date: string; action: string; count: number }>;
    return c.json<ApiResponse<typeof activations>>({ success: true, data: activations });
  } catch (error) {
    console.error('Get activations error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

statsRoutes.get('/licenses-over-time', (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30');
    const licenses = db.prepare(`SELECT date(created_at) as date, type, COUNT(*) as count FROM licenses WHERE created_at >= datetime('now', ? || ' days') GROUP BY date, type ORDER BY date`).all(`-${days}`) as Array<{ date: string; type: string; count: number }>;
    return c.json<ApiResponse<typeof licenses>>({ success: true, data: licenses });
  } catch (error) {
    console.error('Get licenses over time error:', error);
    return c.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, 500);
  }
});

export default statsRoutes;
