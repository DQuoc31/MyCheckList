import { 
  ITask, 
  IScheduleEvent, 
  CreateTaskDto, 
  UpdateTaskDto, 
  CreateScheduleEventDto, 
  UpdateScheduleEventDto, 
  AnalyticsSummary,
  ApiResponse,
  IUser,
  LoginDto,
  RegisterDto,
  AuthResponse
} from '@mychecklist/shared';

const API_BASE = '/api';
const TOKEN_KEY = 'mychecklist_auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    // Only invoke global logout callback if it is a protected route with an invalid/expired token
    const isAuthRoute = url.startsWith('/auth/login') || url.startsWith('/auth/register');
    if (onUnauthorizedCallback && !isAuthRoute && token) {
      onUnauthorizedCallback();
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
  }

  const data: ApiResponse<T> = await res.json();
  if (!data.success) {
    throw new Error(data.error || data.message || 'API request failed');
  }
  return data.data as T;
}

export const AuthAPI = {
  login: (dto: LoginDto) => fetchJSON<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(dto) }),
  register: (dto: RegisterDto) => fetchJSON<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(dto) }),
  getMe: () => fetchJSON<IUser>('/auth/me')
};

export const TaskAPI = {
  getAll: () => fetchJSON<ITask[]>('/tasks'),
  getById: (id: string) => fetchJSON<ITask>(`/tasks/${id}`),
  create: (dto: CreateTaskDto) => fetchJSON<ITask>('/tasks', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateTaskDto) => fetchJSON<ITask>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  toggleSubTask: (id: string, subId: string) => fetchJSON<ITask>(`/tasks/${id}/checklist/${subId}/toggle`, { method: 'PATCH' }),
  delete: (id: string) => fetchJSON<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' })
};

export const ScheduleAPI = {
  getAll: () => fetchJSON<IScheduleEvent[]>('/schedule'),
  create: (dto: CreateScheduleEventDto) => fetchJSON<IScheduleEvent>('/schedule', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateScheduleEventDto) => fetchJSON<IScheduleEvent>(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) => fetchJSON<{ message: string }>(`/schedule/${id}`, { method: 'DELETE' })
};

export const AnalyticsAPI = {
  getSummary: () => fetchJSON<AnalyticsSummary>('/analytics')
};
