// User Model
export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth DTOs
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
}

// Priority Levels
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Task Status
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

// Sub-task Item inside a Task Checklist
export interface IChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

// Main Task Model
export interface ITask {
  _id?: string;
  id?: string;
  userId?: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  tags: string[];
  dueDate?: string;
  estimatedMinutes?: number;
  checklist: IChecklistItem[];
  createdAt?: string;
  updatedAt?: string;
}

// Schedule Event Model (Calendar / Time-block)
export interface IScheduleEvent {
  _id?: string;
  id?: string;
  userId?: string;
  title: string;
  description?: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  color?: string;
  category?: 'WORK' | 'PERSONAL' | 'STUDY' | 'HEALTH' | 'MEETING';
  taskId?: string;   // Associated task ID if any
  isRecurring?: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  createdAt?: string;
  updatedAt?: string;
}

// DTOs for Creation & Updates
export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  tags?: string[];
  dueDate?: string;
  estimatedMinutes?: number;
  checklist?: Array<{ title: string; completed?: boolean }>;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {}

export interface CreateScheduleEventDto {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  color?: string;
  category?: 'WORK' | 'PERSONAL' | 'STUDY' | 'HEALTH' | 'MEETING';
  taskId?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface UpdateScheduleEventDto extends Partial<CreateScheduleEventDto> {}

// Analytics Summary DTO
export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionRate: number;
  totalSubItems: number;
  completedSubItems: number;
  upcomingEventsCount: number;
  highPriorityTasksCount: number;
}

// Standard API Response Format
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
