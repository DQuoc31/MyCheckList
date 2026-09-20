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

// Habit Log Entry (Daily consumption/activity records)
export interface IHabitLogEntry {
  date: string; // YYYY-MM-DD
  value: number; // Consumption or frequency amount (e.g. 2000 ml, 8 hours, 3 times)
}

// Habit / Daily Activity Tracker Model
export interface IHabitTracker {
  _id?: string;
  id?: string;
  userId?: string;
  title: string;
  icon?: string; // water, moon, dumbbell, book, coffee, zap, heart, flame, etc.
  color?: string;
  unit: string; // ml, giờ, phút, ly, km, bước, lần, trang
  dailyTarget: number; // Target per day (e.g. 2000, 8, 30)
  quickOptions?: number[]; // Preset quick addition values, e.g. [250, 500] for water
  history: IHabitLogEntry[];
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

export interface CreateHabitDto {
  title: string;
  unit: string;
  dailyTarget: number;
  icon?: string;
  color?: string;
  quickOptions?: number[];
}

export interface UpdateHabitDto extends Partial<CreateHabitDto> {}

export interface LogHabitEntryDto {
  date?: string; // Defaults to today YYYY-MM-DD if omitted
  value: number;
  mode?: 'add' | 'set'; // 'add' increases value (default), 'set' overrides value
}

// Analytics Summary DTO (Tasks)
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

// Time of Day Slots for Transactions
export type TimeOfDaySlot = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export interface TimeSlotConfig {
  id: TimeOfDaySlot;
  label: string;
  timeRange: string;
  icon: string;
  color: string;
}

export const TIME_SLOTS: Record<TimeOfDaySlot, TimeSlotConfig> = {
  MORNING: {
    id: 'MORNING',
    label: 'Ca Sáng',
    timeRange: '05:00 - 11:00',
    icon: 'sunrise',
    color: '#f59e0b'
  },
  AFTERNOON: {
    id: 'AFTERNOON',
    label: 'Ca Trưa / Chiều',
    timeRange: '11:00 - 17:00',
    icon: 'sun',
    color: '#3b82f6'
  },
  EVENING: {
    id: 'EVENING',
    label: 'Ca Tối',
    timeRange: '17:00 - 22:00',
    icon: 'sunset',
    color: '#8b5cf6'
  },
  NIGHT: {
    id: 'NIGHT',
    label: 'Ca Đêm',
    timeRange: '22:00 - 05:00',
    icon: 'moon',
    color: '#6366f1'
  }
};

// Transaction Model (Thu / Chi)
export type TransactionType = 'EXPENSE' | 'INCOME';

export interface ITransaction {
  _id?: string;
  id?: string;
  userId?: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  timeSlot: TimeOfDaySlot;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionDto {
  title: string;
  amount: number;
  type: TransactionType;
  category?: string;
  timeSlot?: TimeOfDaySlot;
  date?: string;
  time?: string;
  note?: string;
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {}

export interface TimeSlotStat {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface CategoryStat {
  category: string;
  type: TransactionType;
  total: number;
  percentage: number;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  byTimeSlot: Record<TimeOfDaySlot, TimeSlotStat>;
  byCategory: CategoryStat[];
}

export interface HabitItemStat {
  id: string;
  title: string;
  unit: string;
  dailyTarget: number;
  todayValue: number;
  completionRate: number;
  totalLoggedDays: number;
  currentStreak: number;
}

export interface HabitAnalyticsSummary {
  totalHabits: number;
  todayCompletedCount: number;
  todayCompletionRate: number;
  totalLoggedEntries: number;
  habitsStats: HabitItemStat[];
}

export type AnalyticsCategory = 'TASKS' | 'HABITS' | 'FINANCES' | 'OVERVIEW';

export interface ComprehensiveAnalytics {
  tasks: AnalyticsSummary;
  finances: FinanceSummary;
  habits: HabitAnalyticsSummary;
}

// Standard API Response Format
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
