// Maynd.ma Admin API - Type Definitions (Client)

export interface License {
  id: string;
  key: string;
  product: 'maynd-desktop';
  type: 'trial' | 'pro' | 'enterprise';
  seats: number;
  max_devices: number;
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  customer_id: string;
  organization: string;
  email: string;
  phone: string | null;
  created_at: string;
  expires_at: string | null;
  hardware_binding: boolean;
  usb_binding: boolean;
  metadata: Record<string, unknown>;
}

export interface LicenseCreationInput {
  product: 'maynd-desktop';
  type: 'trial' | 'pro' | 'enterprise';
  seats: number;
  max_devices: number;
  customer_id: string;
  organization: string;
  email: string;
  phone?: string;
  hardware_binding: boolean;
  usb_binding: boolean;
  expires_in_days?: number;
  metadata?: Record<string, unknown>;
}

export interface Device {
  id: string;
  license_id: string;
  hardware_fingerprint: string;
  hostname: string;
  os: string;
  arch: string;
  cpu: string;
  memory: number;
  gpu: string | null;
  ip_address: string | null;
  last_seen: string;
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
}

export interface DeviceRegistrationInput {
  license_key: string;
  hardware_fingerprint: string;
  hostname: string;
  os: string;
  arch: string;
  cpu: string;
  memory: number;
  gpu?: string;
  ip_address?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'superadmin' | 'admin' | 'support';
  status: 'active' | 'inactive';
  created_at: string;
  last_login: string | null;
}

export interface UserCreationInput {
  username: string;
  email: string;
  password: string;
  role: 'superadmin' | 'admin' | 'support';
}

export interface AIModel {
  id: string;
  name: string;
  filename: string;
  size: number;
  parameters: number;
  quant: string;
  type: 'llm' | 'embedding';
  url: string;
  status: 'available' | 'deprecated' | 'beta';
  created_at: string;
}

export interface ModelCreationInput {
  name: string;
  filename: string;
  size: number;
  parameters: number;
  quant: string;
  type: 'llm' | 'embedding';
  url: string;
  status?: 'available' | 'deprecated' | 'beta';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ValidationResponse {
  success: boolean;
  valid: boolean;
  license?: License;
  device?: Device;
  error?: string;
  reason?: string;
}

export interface AuthToken {
  token: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface DashboardStats {
  total_licenses: number;
  active_licenses: number;
  expired_licenses: number;
  total_devices: number;
  active_devices: number;
  total_users: number;
  total_models: number;
  recent_activations: number;
}

export type LicenseType = 'trial' | 'pro' | 'enterprise';
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'suspended';
export type DeviceStatus = 'active' | 'inactive' | 'blocked';
export type UserRole = 'superadmin' | 'admin' | 'support';
export type UserStatus = 'active' | 'inactive';
export type ModelType = 'llm' | 'embedding';
export type ModelStatus = 'available' | 'deprecated' | 'beta';