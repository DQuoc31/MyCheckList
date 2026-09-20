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
  AuthResponse,
  IHabitTracker,
  CreateHabitDto,
  UpdateHabitDto,
  LogHabitEntryDto,
  ITransaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  FinanceSummary,
  ComprehensiveAnalytics
} from '@mychecklist/shared';

const envBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const API_BASE = envBaseUrl ? `${envBaseUrl.replace(/\/$/, '')}/api` : '/api';
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

export const HabitAPI = {
  getAll: () => fetchJSON<IHabitTracker[]>('/habits'),
  create: (dto: CreateHabitDto) => fetchJSON<IHabitTracker>('/habits', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateHabitDto) => fetchJSON<IHabitTracker>(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  logEntry: (id: string, dto: LogHabitEntryDto) => fetchJSON<IHabitTracker>(`/habits/${id}/log`, { method: 'POST', body: JSON.stringify(dto) }),
  resetEntry: (id: string, date?: string) => fetchJSON<IHabitTracker>(`/habits/${id}/reset${date ? `?date=${date}` : ''}`, { method: 'DELETE' }),
  delete: (id: string) => fetchJSON<{ message: string }>(`/habits/${id}`, { method: 'DELETE' })
};

export const TransactionAPI = {
  getAll: (params?: { date?: string; timeSlot?: string; type?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.timeSlot) query.append('timeSlot', params.timeSlot);
    if (params?.type) query.append('type', params.type);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString();
    return fetchJSON<ITransaction[]>(`/transactions${qs ? `?${qs}` : ''}`);
  },
  getSummary: (params?: { date?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString();
    return fetchJSON<FinanceSummary>(`/transactions/summary${qs ? `?${qs}` : ''}`);
  },
  create: (dto: CreateTransactionDto) => fetchJSON<ITransaction>('/transactions', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateTransactionDto) => fetchJSON<ITransaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) => fetchJSON<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' })
};

export const AnalyticsAPI = {
  getSummary: () => fetchJSON<ComprehensiveAnalytics & AnalyticsSummary>('/analytics')
};
