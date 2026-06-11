import type { Ref } from 'vue';
import type {
  License,
  LicenseCreationInput,
  Device,
  DeviceRegistrationInput,
  AdminUser,
  UserCreationInput,
  AIModel,
  ModelCreationInput,
  ApiResponse,
  PaginatedResponse,
  DashboardStats
} from '~/types';

const config = useRuntimeConfig();
const apiBase = config.public.apiBase || '/api';

interface FetchOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  [key: string]: string | number | undefined;
}

export function useApi() {
  const getToken = () => localStorage.getItem('maynd-admin-token');

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  });

  const fetchWrapper = async <T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
    try {
      const response = await $fetch<ApiResponse<T>>(url, {
        ...options,
        headers: { ...headers(), ...options?.headers }
      });
      return response;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Dashboard Stats
  const getStats = async (): Promise<ApiResponse<DashboardStats>> => {
    return fetchWrapper<DashboardStats>(`${apiBase}/stats`);
  };

  // Licenses API
  const getLicenses = async (options: FetchOptions = {}): Promise<ApiResponse<PaginatedResponse<License>>> => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    return fetchWrapper<PaginatedResponse<License>>(`${apiBase}/licenses?${params.toString()}`);
  };

  const getLicenseById = async (id: string): Promise<ApiResponse<License & { devices?: Device[] }>> => {
    return fetchWrapper<License & { devices?: Device[] }>(`${apiBase}/licenses/${id}`);
  };

  const createLicense = async (data: LicenseCreationInput): Promise<ApiResponse<License>> => {
    return fetchWrapper<License>(`${apiBase}/licenses`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  const updateLicense = async (id: string, data: Partial<LicenseCreationInput>): Promise<ApiResponse<License>> => {
    return fetchWrapper<License>(`${apiBase}/licenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  };

  const deleteLicense = async (id: string): Promise<ApiResponse<License>> => {
    return fetchWrapper<License>(`${apiBase}/licenses/${id}`, {
      method: 'DELETE'
    });
  };

  const validateLicense = async (key: string, hardwareFingerprint?: string): Promise<ApiResponse<{ valid: boolean; license?: License; error?: string; reason?: string }>> => {
    return fetchWrapper<{ valid: boolean; license?: License; error?: string; reason?: string }>(`${apiBase}/licenses/validate`, {
      method: 'POST',
      body: JSON.stringify({ license_key: key, hardware_fingerprint: hardwareFingerprint })
    });
  };

  // Devices API
  const getDevices = async (options: FetchOptions = {}): Promise<ApiResponse<PaginatedResponse<Device>>> => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    return fetchWrapper<PaginatedResponse<Device>>(`${apiBase}/devices?${params.toString()}`);
  };

  const getDeviceById = async (id: string): Promise<ApiResponse<Device>> => {
    return fetchWrapper<Device>(`${apiBase}/devices/${id}`);
  };

  const registerDevice = async (data: DeviceRegistrationInput): Promise<ApiResponse<Device>> => {
    return fetchWrapper<Device>(`${apiBase}/devices/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  const updateDevice = async (id: string, data: Partial<Device>): Promise<ApiResponse<Device>> => {
    return fetchWrapper<Device>(`${apiBase}/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  };

  const deleteDevice = async (id: string): Promise<ApiResponse<Device>> => {
    return fetchWrapper<Device>(`${apiBase}/devices/${id}`, {
      method: 'DELETE'
    });
  };

  // Users API
  const getUsers = async (options: FetchOptions = {}): Promise<ApiResponse<PaginatedResponse<AdminUser>>> => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    return fetchWrapper<PaginatedResponse<AdminUser>>(`${apiBase}/users?${params.toString()}`);
  };

  const getUserById = async (id: string): Promise<ApiResponse<AdminUser>> => {
    return fetchWrapper<AdminUser>(`${apiBase}/users/${id}`);
  };

  const createUser = async (data: UserCreationInput): Promise<ApiResponse<AdminUser>> => {
    return fetchWrapper<AdminUser>(`${apiBase}/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  const updateUser = async (id: string, data: Partial<UserCreationInput & { status?: string }>): Promise<ApiResponse<AdminUser>> => {
    return fetchWrapper<AdminUser>(`${apiBase}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  };

  const deleteUser = async (id: string): Promise<ApiResponse<AdminUser>> => {
    return fetchWrapper<AdminUser>(`${apiBase}/users/${id}`, {
      method: 'DELETE'
    });
  };

  // Models API
  const getModels = async (options: FetchOptions = {}): Promise<ApiResponse<PaginatedResponse<AIModel>>> => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    return fetchWrapper<PaginatedResponse<AIModel>>(`${apiBase}/models?${params.toString()}`);
  };

  const getModelById = async (id: string): Promise<ApiResponse<AIModel>> => {
    return fetchWrapper<AIModel>(`${apiBase}/models/${id}`);
  };

  const createModel = async (data: ModelCreationInput): Promise<ApiResponse<AIModel>> => {
    return fetchWrapper<AIModel>(`${apiBase}/models`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  const updateModel = async (id: string, data: Partial<ModelCreationInput & { status?: string }>): Promise<ApiResponse<AIModel>> => {
    return fetchWrapper<AIModel>(`${apiBase}/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  };

  const deleteModel = async (id: string): Promise<ApiResponse<AIModel>> => {
    return fetchWrapper<AIModel>(`${apiBase}/models/${id}`, {
      method: 'DELETE'
    });
  };

  return {
    getStats,
    // Licenses
    getLicenses,
    getLicenseById,
    createLicense,
    updateLicense,
    deleteLicense,
    validateLicense,
    // Devices
    getDevices,
    getDeviceById,
    registerDevice,
    updateDevice,
    deleteDevice,
    // Users
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    // Models
    getModels,
    getModelById,
    createModel,
    updateModel,
    deleteModel
  };
}