import type { Ref } from 'vue';
import type { 
  License, 
  Device, 
  AdminUser as User, 
  AIModel as Model, 
  DashboardStats as Stats,
  ApiResponse, 
  PaginatedResponse 
} from '@/types';

export interface ApiOptions {
  params?: Record<string, string | number | boolean>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface UseApiReturn {
  get: <T>(url: string, options?: ApiOptions) => Promise<ApiResponse<T>>;
  post: <T>(url: string, body?: Record<string, unknown>, options?: ApiOptions) => Promise<ApiResponse<T>>;
  put: <T>(url: string, body?: Record<string, unknown>, options?: ApiOptions) => Promise<ApiResponse<T>>;
  patch: <T>(url: string, body?: Record<string, unknown>, options?: ApiOptions) => Promise<ApiResponse<T>>;
  delete: <T>(url: string, options?: ApiOptions) => Promise<ApiResponse<T>>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  clearError: () => void;
}

export function useApi(): UseApiReturn {
  const config = useRuntimeConfig();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const getToken = (): string | null => {
    if (process.client) {
      return localStorage.getItem('maynd-admin-token');
    }
    return null;
  };

  const clearError = () => {
    error.value = null;
  };

  const request = async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    try {
      isLoading.value = true;
      clearError();

      const baseUrl = config.public.apiBase || 'http://localhost:3001/api';
      const fullUrl = `${baseUrl}${url}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      const token = getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const fetchOptions: RequestInit = {
        method,
        headers,
      };

      if (method !== 'GET' && options.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      if (options.params) {
        const searchParams = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        fullUrl += '?' + searchParams.toString();
      }

      const response = await $fetch<T>(fullUrl, fetchOptions);
      
      return {
        success: true,
        data: response,
        message: 'Success',
      };
    } catch (err: any) {
      const message = err.data?.message || err.message || 'An error occurred';
      error.value = message;
      
      return {
        success: false,
        data: null,
        message,
      };
    } finally {
      isLoading.value = false;
    }
  };

  return {
    get: <T>(url: string, options?: ApiOptions) => request<T>('GET', url, options),
    post: <T>(url: string, body?: Record<string, unknown>, options?: ApiOptions) => 
      request<T>('POST', url, { ...options, body }),
    put: <T>(url: string, body?: Record<string, unknown>, options?: ApiOptions) => 
      request<T>('PUT', url, { ...options, body }),
    patch: <T>(url: string, body?: Record<string, unknown>, options?: ApiOptions) => 
      request<T>('PATCH', url, { ...options, body }),
    delete: <T>(url: string, options?: ApiOptions) => request<T>('DELETE', url, options),
    isLoading,
    error,
    clearError,
  };
}

// Specific API hooks for admin
export function useLicensesApi() {
  const { get, post, put, delete: del, ...rest } = useApi();

  return {
    getLicenses: (params?: { page?: number; limit?: number; status?: string; search?: string }) => 
      get<PaginatedResponse<License>>('/licenses', { params }),
    getLicenseById: (id: string) => get<License>(`/licenses/${id}`),
    createLicense: (data: Partial<License>) => post<License>('/licenses', data),
    updateLicense: (id: string, data: Partial<License>) => put<License>(`/licenses/${id}`, data),
    deleteLicense: (id: string) => del<License>(`/licenses/${id}`),
    ...rest,
  };
}

export function useDevicesApi() {
  const { get, post, put, delete: del, ...rest } = useApi();

  return {
    getDevices: (params?: { page?: number; limit?: number; status?: string; search?: string }) => 
      get<PaginatedResponse<Device>>('/devices', { params }),
    getDeviceById: (id: string) => get<Device>(`/devices/${id}`),
    createDevice: (data: Partial<Device>) => post<Device>('/devices', data),
    updateDevice: (id: string, data: Partial<Device>) => put<Device>(`/devices/${id}`, data),
    deleteDevice: (id: string) => del<Device>(`/devices/${id}`),
    ...rest,
  };
}

export function useUsersApi() {
  const { get, post, put, delete: del, ...rest } = useApi();

  return {
    getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) => 
      get<PaginatedResponse<User>>('/users', { params }),
    getUserById: (id: string) => get<User>(`/users/${id}`),
    createUser: (data: Partial<User>) => post<User>('/users', data),
    updateUser: (id: string, data: Partial<User>) => put<User>(`/users/${id}`, data),
    deleteUser: (id: string) => del<User>(`/users/${id}`),
    ...rest,
  };
}

export function useModelsApi() {
  const { get, post, put, delete: del, ...rest } = useApi();

  return {
    getModels: (params?: { page?: number; limit?: number; search?: string }) => 
      get<PaginatedResponse<Model>>('/models', { params }),
    getModelById: (id: string) => get<Model>(`/models/${id}`),
    createModel: (data: Partial<Model>) => post<Model>('/models', data),
    updateModel: (id: string, data: Partial<Model>) => put<Model>(`/models/${id}`, data),
    deleteModel: (id: string) => del<Model>(`/models/${id}`),
    ...rest,
  };
}

export function useStatsApi() {
  const { get, ...rest } = useApi();

  return {
    getStats: () => get<Stats>('/stats'),
    ...rest,
  };
}

export function useAuthApi() {
  const { post, ...rest } = useApi();

  return {
    login: (credentials: { username: string; password: string }) => 
      post<{ token: string; user: User }>('/auth/login', credentials),
    logout: () => {
      if (process.client) {
        localStorage.removeItem('maynd-admin-token');
        localStorage.removeItem('maynd-admin-user');
      }
      return Promise.resolve({ success: true, data: null, message: 'Logged out' });
    },
    ...rest,
  };
}