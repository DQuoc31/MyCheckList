import React, { useState, useMemo } from 'react';
import { IHabitTracker, CreateHabitDto, UpdateHabitDto, HabitFrequency } from '@mychecklist/shared';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  CheckCircle2, 
  Droplets, 
  Moon, 
  Dumbbell, 
  BookOpen, 
  Coffee, 
  Footprints, 
  Heart, 
  Sparkles,
  Zap,
  TrendingUp,
  Target,
  Edit3,
  AlertTriangle,
  X,
  LayoutGrid,
  Calendar,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  Clock,
  Repeat
} from 'lucide-react';
import { HabitAPI } from '../services/api';
import { HabitContributionHeatmap } from './HabitContributionHeatmap';

interface HabitsViewProps {
  habits: IHabitTracker[];
  onRefresh: () => void;
  showCreateModal: boolean;
  onCloseCreateModal: () => void;
}

// Icon dictionary
const HABIT_ICONS: Record<string, any> = {
  water: Droplets,
  moon: Moon,
  dumbbell: Dumbbell,
  book: BookOpen,
  coffee: Coffee,
  footprints: Footprints,
  heart: Heart,
  sparkles: Sparkles,
  zap: Zap
};

// Day definitions (0 = Sunday, 1 = Monday, ...)
const DAY_OPTIONS = [
  { day: 1, label: 'T2', name: 'Thứ 2' },
  { day: 2, label: 'T3', name: 'Thứ 3' },
  { day: 3, label: 'T4', name: 'Thứ 4' },
  { day: 4, label: 'T5', name: 'Thứ 5' },
  { day: 5, label: 'T6', name: 'Thứ 6' },
  { day: 6, label: 'T7', name: 'Thứ 7' },
  { day: 0, label: 'CN', name: 'Chủ nhật' }
];

export const formatFrequencySummary = (habit: IHabitTracker): string => {
  const freq = habit.frequency || 'DAILY';
  if (freq === 'DAILY') return 'Hàng ngày';
  if (freq === 'WEEKLY_TARGET') return `${habit.weeklyTarget || 3} lần / tuần`;
  if (freq === 'WEEKLY_DAYS') {
    const days = habit.targetDays || [0, 1, 2, 3, 4, 5, 6];
    if (days.length === 7) return 'Cả tuần (7 ngày)';
    if (days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d))) return 'T2 - T6 (Ngày đi làm)';
    if (days.length === 2 && [0, 6].every(d => days.includes(d))) return 'Cuối tuần (T7, CN)';
    
    // Sort Monday (1) -> Sunday (0)
    const sorted = [...days].sort((a, b) => {
      const ordA = a === 0 ? 7 : a;
      const ordB = b === 0 ? 7 : b;
      return ordA - ordB;
    });
    return sorted.map(d => DAY_OPTIONS.find(o => o.day === d)?.label || `T${d}`).join(', ');
  }
  return 'Hàng ngày';
};

export const isHabitScheduledForDate = (habit: IHabitTracker, date: Date): boolean => {
  const freq = habit.frequency || 'DAILY';
  if (freq === 'DAILY' || freq === 'WEEKLY_TARGET') return true;
  if (freq === 'WEEKLY_DAYS') {
    const dayOfWeek = date.getDay();
    const days = habit.targetDays || [0, 1, 2, 3, 4, 5, 6];
    return days.includes(dayOfWeek);
  }
  return true;
};

// Ready-to-use habit templates
const HABIT_PRESETS: Array<{
  title: string;
  unit: string;
  dailyTarget: number;
  frequency?: HabitFrequency;
  targetDays?: number[];
  weeklyTarget?: number;
  icon: string;
  color: string;
  quickOptions: number[];
  description: string;
}> = [
  {
    title: 'Uống nước mỗi ngày',
    unit: 'ml',
    dailyTarget: 2000,
    frequency: 'DAILY',
    icon: 'water',
    color: '#06b6d4',
    quickOptions: [250, 500],
    description: 'Duy trì đủ nước cho cơ thể và trí não tỉnh táo'
  },
  {
    title: 'Tập gym / Thể thao 3 buổi',
    unit: 'phút',
    dailyTarget: 45,
    frequency: 'WEEKLY_TARGET',
    weeklyTarget: 3,
    icon: 'dumbbell',
    color: '#10b981',
    quickOptions: [15, 45],
    description: 'Rèn luyện thể lực 3 buổi mỗi tuần'
  },
  {
    title: 'Đi làm đúng giờ',
    unit: 'lần',
    dailyTarget: 1,
    frequency: 'WEEKLY_DAYS',
    targetDays: [1, 2, 3, 4, 5],
    icon: 'zap',
    color: '#3b82f6',
    quickOptions: [1],
    description: 'Duy trì thói quen chuẩn giờ các ngày làm việc T2-T6'
  },
  {
    title: 'Ngủ đủ giấc',
    unit: 'giờ',
    dailyTarget: 8,
    frequency: 'DAILY',
    icon: 'moon',
    color: '#8b5cf6',
    quickOptions: [0.5, 1],
    description: 'Nạp lại năng lượng và phục hồi cơ thể'
  },
  {
    title: 'Đọc sách phát triển',
    unit: 'trang',
    dailyTarget: 20,
    frequency: 'DAILY',
    icon: 'book',
    color: '#f59e0b',
    quickOptions: [5, 10],
    description: 'Mở rộng kiến thức và duy trì thói quen đọc'
  },
  {
    title: 'Dọn dẹp nhà cuối tuần',
    unit: 'lần',
    dailyTarget: 1,
    frequency: 'WEEKLY_DAYS',
    targetDays: [6, 0],
    icon: 'sparkles',
    color: '#ec4899',
    quickOptions: [1],
    description: 'Sắp xếp gọn gàng không gian sống mỗi cuối tuần'
  }
];

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onRefresh,
  showCreateModal,
  onCloseCreateModal
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Custom Create Form States
  const [title, setTitle] = useState('');
  const [unit, setUnit] = useState('lần');
  const [dailyTarget, setDailyTarget] = useState<number>(1);
  const [frequency, setFrequency] = useState<HabitFrequency>('DAILY');
  const [targetDays, setTargetDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(3);
  const [icon, setIcon] = useState('sparkles');
  const [color, setColor] = useState('#6366f1');
  const [quickOptionsInput, setQuickOptionsInput] = useState('1, 2');
  const [submitting, setSubmitting] = useState(false);

  // Collapse / Shrink Habit Cards & Labels State
  const [collapsedHabitIds, setCollapsedHabitIds] = useState<Set<string>>(new Set());
  const [isCompactLabels, setIsCompactLabels] = useState<boolean>(false);

  const toggleHabitCollapse = (id: string) => {
    setCollapsedHabitIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllCollapse = () => {
    if (collapsedHabitIds.size === habits.length && habits.length > 0) {
      setCollapsedHabitIds(new Set());
    } else {
      setCollapsedHabitIds(new Set(habits.map(h => (h.id || h._id || '') as string)));
    }
  };

  // Custom Log Modal States (Popup replacing window.prompt)
  const [customLogHabit, setCustomLogHabit] = useState<IHabitTracker | null>(null);
  const [customLogAmount, setCustomLogAmount] = useState<string>('1');
  const [customLogMode, setCustomLogMode] = useState<'add' | 'set'>('add');
  const [customLogError, setCustomLogError] = useState<string>('');
  const [customLogSubmitting, setCustomLogSubmitting] = useState(false);

  // Edit Habit & Target States
  const [editingHabit, setEditingHabit] = useState<IHabitTracker | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUnit, setEditUnit] = useState('lần');
  const [editDailyTarget, setEditDailyTarget] = useState<number>(1);
  const [editFrequency, setEditFrequency] = useState<HabitFrequency>('DAILY');
  const [editTargetDays, setEditTargetDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [editWeeklyTarget, setEditWeeklyTarget] = useState<number>(3);
  const [editIcon, setEditIcon] = useState('sparkles');
  const [editColor, setEditColor] = useState('#6366f1');
  const [editQuickOptionsInput, setEditQuickOptionsInput] = useState('1, 2');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Confirmation Modal Dialog State (replacing window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const openCustomLogModal = (habit: IHabitTracker) => {
    setCustomLogHabit(habit);
    setCustomLogAmount('1');
    setCustomLogMode('add');
    setCustomLogError('');
  };

  const handleCustomLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLogHabit || (!customLogHabit.id && !customLogHabit._id)) return;
    const num = parseFloat(customLogAmount);
    if (isNaN(num) || (customLogMode === 'add' && num <= 0) || (customLogMode === 'set' && num < 0)) {
      setCustomLogError('Vui lòng nhập số lượng hợp lệ (> 0)');
      return;
    }
    try {
      setCustomLogSubmitting(true);
      setCustomLogError('');
      await HabitAPI.logEntry((customLogHabit.id || customLogHabit._id)!, {
        date: selectedDateStr,
        value: num,
        mode: customLogMode
      });
      setCustomLogHabit(null);
      onRefresh();
    } catch (err: any) {
      setCustomLogError(err.message || 'Lỗi khi cập nhật thói quen');
    } finally {
      setCustomLogSubmitting(false);
    }
  };

  const openEditModal = (habit: IHabitTracker) => {
    setEditingHabit(habit);
    setEditTitle(habit.title);
    setEditUnit(habit.unit);
    setEditDailyTarget(habit.dailyTarget);
    setEditFrequency(habit.frequency || 'DAILY');
    setEditTargetDays(Array.isArray(habit.targetDays) && habit.targetDays.length > 0 ? habit.targetDays : [1, 2, 3, 4, 5]);
    setEditWeeklyTarget(habit.weeklyTarget || 3);
    setEditIcon(habit.icon || 'sparkles');
    setEditColor(habit.color || '#6366f1');
    setEditQuickOptionsInput((habit.quickOptions || []).join(', '));
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || (!editingHabit.id && !editingHabit._id)) return;
    if (!editTitle.trim()) {
      setEditError('Tên thói quen không được để trống');
      return;
    }
    const numTarget = Number(editDailyTarget);
    if (isNaN(numTarget) || numTarget <= 0) {
      setEditError('Mục tiêu hàng ngày phải lớn hơn 0');
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError('');
      const parsedQuick = editQuickOptionsInput
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => !isNaN(n) && n > 0);

      const dto: UpdateHabitDto = {
        title: editTitle.trim(),
        unit: editUnit.trim() || 'lần',
        dailyTarget: numTarget,
        frequency: editFrequency,
        targetDays: editFrequency === 'WEEKLY_DAYS' ? editTargetDays : undefined,
        weeklyTarget: editFrequency === 'WEEKLY_TARGET' ? editWeeklyTarget : undefined,
        icon: editIcon,
        color: editColor,
        quickOptions: parsedQuick.length > 0 ? parsedQuick : [1, 5]
      };

      await HabitAPI.update((editingHabit.id || editingHabit._id)!, dto);
      setEditingHabit(null);
      onRefresh();
    } catch (err: any) {
      setEditError(err.message || 'Lỗi khi cập nhật thói quen');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Selected date string in YYYY-MM-DD
  const selectedDateStr = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    );
  }, [selectedDate]);

  // Date Navigator
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Helper: Get habit value for selected date
  const getHabitValueForDate = (habit: IHabitTracker, dateStr: string): number => {
    const entry = habit.history?.find(h => h.date === dateStr);
    return entry ? entry.value : 0;
  };

  // Helper: Calculate streak
  const calculateStreak = (habit: IHabitTracker): number => {
    if (!habit.history || habit.history.length === 0) return 0;
    const historyMap = new Map<string, number>();
    habit.history.forEach(h => historyMap.set(h.date, h.value));

    let streak = 0;
    const cur = new Date();

    while (true) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;

      const val = historyMap.get(key) || 0;
      if (val >= habit.dailyTarget) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // Quick log action
  const handleQuickLog = async (habitId: string, delta: number) => {
    try {
      await HabitAPI.logEntry(habitId, {
        date: selectedDateStr,
        value: delta,
        mode: 'add'
      });
      onRefresh();
    } catch (err: any) {
      alert(`Lỗi ghi nhận: ${err.message}`);
    }
  };

  // Reset day action using popup confirmation modal
  const handleResetDay = (habit: IHabitTracker) => {
    const habitId = habit.id || habit._id!;
    setConfirmDialog({
      isOpen: true,
      title: 'Đặt Lại Tiêu Thụ',
      message: `Bạn có chắc muốn đặt lại lượng tiêu thụ của "${habit.title}" vào ngày ${selectedDateStr} về 0?`,
      confirmText: 'Đặt Lại Về 0',
      confirmVariant: 'warning',
      onConfirm: async () => {
        try {
          await HabitAPI.resetEntry(habitId, selectedDateStr);
          setConfirmDialog(null);
          onRefresh();
        } catch (err: any) {
          alert(`Lỗi: ${err.message}`);
        }
      }
    });
  };

  // Delete habit action using popup confirmation modal
  const handleDeleteHabit = (habit: IHabitTracker) => {
    const habitId = habit.id || habit._id!;
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Thói Quen',
      message: `Bạn có chắc muốn xóa thói quen "${habit.title}"? Toàn bộ lịch sử ghi nhận sẽ bị xóa vĩnh viễn khỏi hệ thống.`,
      confirmText: 'Xóa Vĩnh Viễn',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await HabitAPI.delete(habitId);
          setConfirmDialog(null);
          onRefresh();
        } catch (err: any) {
          alert(`Lỗi: ${err.message}`);
        }
      }
    });
  };

  // Create Habit Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const parsedQuick = quickOptionsInput
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => !isNaN(n) && n > 0);

      const dto: CreateHabitDto = {
        title: title.trim(),
        unit: unit.trim() || 'lần',
        dailyTarget: Number(dailyTarget) || 1,
        frequency,
        targetDays: frequency === 'WEEKLY_DAYS' ? targetDays : undefined,
        weeklyTarget: frequency === 'WEEKLY_TARGET' ? weeklyTarget : undefined,
        icon,
        color,
        quickOptions: parsedQuick.length > 0 ? parsedQuick : [1, 5]
      };

      await HabitAPI.create(dto);
      setTitle('');
      setFrequency('DAILY');
      setTargetDays([1, 2, 3, 4, 5]);
      setWeeklyTarget(3);
      onCloseCreateModal();
      onRefresh();
    } catch (err: any) {
      alert(`Lỗi tạo thói quen: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Preset Selection
  const applyPreset = (preset: typeof HABIT_PRESETS[0]) => {
    setTitle(preset.title);
    setUnit(preset.unit);
    setDailyTarget(preset.dailyTarget);
    setFrequency(preset.frequency || 'DAILY');
    setTargetDays(preset.targetDays || [1, 2, 3, 4, 5]);
    setWeeklyTarget(preset.weeklyTarget || 3);
    setIcon(preset.icon);
    setColor(preset.color);
    setQuickOptionsInput(preset.quickOptions.join(', '));
  };

  // Helper: Calculate weekly progress for a habit
  const getWeeklyProgress = (habit: IHabitTracker, targetDate: Date) => {
    const d = new Date(targetDate);
    const day = d.getDay();
    const diffToMonday = (day === 0 ? 7 : day) - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diffToMonday);

    let completedDaysCount = 0;
    let totalValueThisWeek = 0;

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const dayStr = String(cur.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${dayStr}`;

      const val = getHabitValueForDate(habit, key);
      totalValueThisWeek += val;
      if (val >= habit.dailyTarget) {
        completedDaysCount++;
      }
    }

    const target = habit.weeklyTarget || 3;
    return {
      completedDaysCount,
      totalValueThisWeek,
      target,
      isMet: completedDaysCount >= target,
      percent: Math.min(100, Math.round((completedDaysCount / target) * 100))
    };
  };

  // Summary Metrics
  const scheduledTodayHabits = habits.filter(h => isHabitScheduledForDate(h, selectedDate));
  const completedHabitsCount = habits.filter(h => getHabitValueForDate(h, selectedDateStr) >= h.dailyTarget).length;
  const totalHabitsCount = habits.length;
  const completionRate = totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header & Date Navigation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.5rem 0'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Theo Dõi Thói Quen & Tiêu Thụ
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Quản lý tần suất và lượng tiêu thụ hàng ngày (uống nước, giấc ngủ, tập luyện, đọc sách...)
          </p>
        </div>

        {/* Toolbar Controls: Compact Label Toggle & Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Global View & Label Size Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setIsCompactLabels(!isCompactLabels)}
              className="btn btn-secondary"
              style={{
                padding: '0.4rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: isCompactLabels ? 'rgba(21, 128, 61, 0.12)' : '#ffffff',
                borderColor: isCompactLabels ? 'rgba(21, 128, 61, 0.35)' : 'var(--border-color)',
                color: isCompactLabels ? 'var(--accent-primary)' : 'var(--text-muted)'
              }}
              title="Chuyển đổi kích thước nhãn tiêu đề thói quen"
            >
              {isCompactLabels ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{isCompactLabels ? 'Nhãn thu nhỏ' : 'Nhãn tiêu chuẩn'}</span>
            </button>

            {habits.length > 0 && (
              <button
                type="button"
                onClick={toggleAllCollapse}
                className="btn btn-secondary"
                style={{
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)'
                }}
                title="Thu gọn hoặc mở rộng toàn bộ bảng tổng kết"
              >
                {collapsedHabitIds.size === habits.length ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                <span>{collapsedHabitIds.size === habits.length ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}</span>
              </button>
            )}
          </div>

          {/* Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '10px', padding: '2px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <button onClick={handlePrevDay} className="btn-icon" title="Ngày hôm trước" style={{ padding: '0.4rem' }}>
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleToday}
              style={{
                background: isToday ? 'linear-gradient(135deg, #15803d, #14532d)' : 'none',
                border: 'none',
                color: isToday ? '#fff' : 'var(--text-main)',
                fontSize: '0.825rem',
                fontWeight: 700,
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {isToday ? 'Hôm nay' : 'Về Hôm nay'}
            </button>
            <button onClick={handleNextDay} className="btn-icon" title="Ngày tiếp theo" style={{ padding: '0.4rem' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '10px',
            background: '#f1f5f3',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-main)',
            fontWeight: 700
          }}>
            {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(22, 163, 74, 0.12)',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Mục tiêu hoàn thành
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {completedHabitsCount} / {totalHabitsCount}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(21, 128, 61, 0.12)',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Tỷ lệ hoàn thành
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {completionRate}%
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(217, 119, 6, 0.12)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Chuỗi Streak cao nhất
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {habits.length > 0 ? Math.max(...habits.map(calculateStreak), 0) : 0} ngày liên tiếp
            </div>
          </div>
        </div>
      </div>

      {/* Habits Cards List */}
      {habits.length === 0 ? (
        <div className="glass-card" style={{
          textAlign: 'center',
          padding: '3.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(21, 128, 61, 0.12)',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Target size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: 800 }}>
            Chưa có thói quen hoặc hoạt động nào
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Bắt đầu theo dõi lượng nước uống, giấc ngủ, tập luyện hoặc các thói quen hàng ngày ngay bây giờ!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isCompactLabels ? '1rem' : '1.5rem' }}>
          {habits.map(habit => {
            const habitId = (habit.id || habit._id || '') as string;
            const currentValue = getHabitValueForDate(habit, selectedDateStr);
            const percent = Math.min(100, Math.round((currentValue / habit.dailyTarget) * 100));
            const isCompleted = currentValue >= habit.dailyTarget;
            const streak = calculateStreak(habit);
            const IconComponent = HABIT_ICONS[habit.icon || 'sparkles'] || Sparkles;
            const habitColor = habit.color || '#15803d';
            const isCollapsed = collapsedHabitIds.has(habitId);

            return (
              <div
                key={habitId}
                className="glass-card"
                style={{
                  padding: isCollapsed 
                    ? (isCompactLabels ? '0.75rem 1rem' : '1rem 1.25rem') 
                    : (isCompactLabels ? '1rem 1.25rem' : '1.5rem'),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isCollapsed ? '0' : (isCompactLabels ? '0.85rem' : '1.25rem'),
                  position: 'relative',
                  border: isCompleted 
                    ? `1px solid ${habitColor}55` 
                    : '1px solid var(--border-color)',
                  boxShadow: isCompleted 
                    ? `0 8px 30px ${habitColor}18` 
                    : 'var(--shadow-card)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Habit Controls Top Header */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: isCompactLabels ? '0.75rem' : '1.25rem',
                  paddingBottom: isCollapsed ? '0' : (isCompactLabels ? '0.75rem' : '1rem'),
                  borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)'
                }}>
                  {/* Habit Info & Icon with Compact Label Support */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: isCompactLabels ? '0.6rem' : '0.85rem', minWidth: '200px' }}>
                    <div style={{
                      width: isCompactLabels ? '36px' : '46px',
                      height: isCompactLabels ? '36px' : '46px',
                      borderRadius: isCompactLabels ? '10px' : '14px',
                      background: `linear-gradient(135deg, ${habitColor}33, ${habitColor}11)`,
                      border: `1px solid ${habitColor}44`,
                      color: habitColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 15px ${habitColor}22`,
                      flexShrink: 0
                    }}>
                      <IconComponent size={isCompactLabels ? 18 : 24} color={habitColor} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <h4 style={{
                          fontSize: isCompactLabels ? '0.98rem' : '1.15rem',
                          fontWeight: 800,
                          color: 'var(--text-main)',
                          lineHeight: 1.2
                        }}>
                          {habit.title}
                        </h4>
                        {streak > 0 && (
                          <span style={{
                            fontSize: isCompactLabels ? '0.65rem' : '0.72rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '9999px',
                            background: 'rgba(217, 119, 6, 0.12)',
                            border: '1px solid rgba(217, 119, 6, 0.3)',
                            color: '#b45309',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            <Flame size={isCompactLabels ? 10 : 12} /> {streak} ngày
                          </span>
                        )}
                        <span style={{
                          fontSize: isCompactLabels ? '0.65rem' : '0.72rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          color: '#4f46e5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Repeat size={isCompactLabels ? 10 : 12} /> {formatFrequencySummary(habit)}
                        </span>
                      </div>
                      <div style={{ fontSize: isCompactLabels ? '0.72rem' : '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Mục tiêu: <strong style={{ color: 'var(--text-main)' }}>{habit.dailyTarget} {habit.unit}</strong>/ngày
                      </div>
                      {/* Weekly frequency hints & stats */}
                      {habit.frequency === 'WEEKLY_TARGET' && (() => {
                        const wStats = getWeeklyProgress(habit, selectedDate);
                        return (
                          <div style={{
                            fontSize: isCompactLabels ? '0.7rem' : '0.75rem',
                            color: wStats.isMet ? '#16a34a' : 'var(--text-muted)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '0.2rem'
                          }}>
                            <Target size={12} color={wStats.isMet ? '#16a34a' : habitColor} />
                            <span>Tuần này: <strong>{wStats.completedDaysCount}/{wStats.target}</strong> lần {wStats.isMet && '✅'}</span>
                          </div>
                        );
                      })()}
                      {habit.frequency === 'WEEKLY_DAYS' && !isHabitScheduledForDate(habit, selectedDate) && (
                        <div style={{
                          fontSize: isCompactLabels ? '0.68rem' : '0.73rem',
                          color: '#d97706',
                          background: 'rgba(217, 119, 6, 0.08)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          marginTop: '0.2rem'
                        }}>
                          <span>☕ Ngày nghỉ theo lịch</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Day's Progress Indicator */}
                  <div style={{ flex: '1 1 200px', maxWidth: '320px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                      <div style={{ fontSize: isCompactLabels ? '0.74rem' : '0.8rem', color: 'var(--text-muted)' }}>
                        {selectedDateStr === todayStr ? 'Hôm nay' : selectedDateStr}:
                      </div>
                      <div style={{ fontSize: isCompactLabels ? '0.78rem' : '0.85rem', fontWeight: 700, color: isCompleted ? '#10b981' : habitColor }}>
                        {currentValue} / {habit.dailyTarget} {habit.unit} ({percent}%)
                      </div>
                    </div>
                    <div className="progress-container" style={{ height: isCompactLabels ? '5px' : '7px', background: 'rgba(20, 83, 45, 0.1)' }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percent}%`,
                          background: isCompleted ? `linear-gradient(90deg, ${habitColor}, #16a34a)` : habitColor,
                          boxShadow: `0 0 10px ${habitColor}44`
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Add & Management Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    {(habit.quickOptions || [1, 5]).map((optionVal, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickLog(habitId, optionVal)}
                        className="btn btn-secondary"
                        style={{
                          padding: isCompactLabels ? '0.35rem 0.6rem' : '0.45rem 0.75rem',
                          fontSize: isCompactLabels ? '0.74rem' : '0.8rem',
                          fontWeight: 600,
                          background: '#ffffff',
                          borderColor: 'var(--border-color)'
                        }}
                      >
                        +{optionVal} {habit.unit}
                      </button>
                    ))}

                    <button
                      onClick={() => openCustomLogModal(habit)}
                      className="btn btn-secondary"
                      style={{
                        padding: isCompactLabels ? '0.35rem 0.6rem' : '0.45rem 0.75rem',
                        fontSize: isCompactLabels ? '0.74rem' : '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)'
                      }}
                      title="Nhập số lượng tùy ý"
                    >
                      Tùy chỉnh...
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.25rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.45rem' }}>
                      <button
                        onClick={() => openEditModal(habit)}
                        title="Chỉnh sửa mục tiêu & thói quen"
                        className="btn-icon"
                        style={{ color: 'var(--text-muted)', padding: '0.35rem' }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleResetDay(habit)}
                        title="Đặt lại ngày này về 0"
                        className="btn-icon"
                        style={{ color: 'var(--text-dim)', padding: '0.35rem' }}
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit)}
                        title="Xóa thói quen"
                        className="btn-icon"
                        style={{ color: 'var(--accent-danger)', padding: '0.35rem' }}
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Per-habit Collapse / Expand Toggle Button */}
                      <button
                        onClick={() => toggleHabitCollapse(habitId)}
                        title={isCollapsed ? 'Mở rộng bảng tổng kết 1 năm' : 'Thu nhỏ bảng tổng kết'}
                        className="btn-icon"
                        style={{
                          color: isCollapsed ? 'var(--accent-primary)' : 'var(--text-muted)',
                          padding: '0.35rem',
                          background: isCollapsed ? 'rgba(21, 128, 61, 0.12)' : 'transparent',
                          borderRadius: '6px'
                        }}
                      >
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Individual Contribution Summary Table / Heatmap for this Habit */}
                {!isCollapsed && (
                  <HabitContributionHeatmap
                    habit={habit}
                    selectedDate={selectedDateStr}
                    onSelectDate={(dateStr) => {
                      const [y, m, d] = dateStr.split('-').map(Number);
                      setSelectedDate(new Date(y, m - 1, d));
                    }}
                    defaultColorTheme="github"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create New Habit */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={onCloseCreateModal}>
          <div 
            className="modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: 800, marginBottom: '0.5rem' }}>
              Thêm Thói Quen & Hoạt Động Mới
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Chọn một mẫu có sẵn hoặc tùy chỉnh hoạt động theo nhu cầu của bạn
            </p>

            {/* Presets Gallery */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                Mẫu nhanh gợi ý:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                {HABIT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      background: '#f8faf9',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ color: p.color }}>●</span>
                    <span style={{ fontWeight: 600 }}>{p.title.split(' ')[0]}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>({p.dailyTarget} {p.unit})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Tên hoạt động / thói quen *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Uống nước, Ngủ đủ giấc, Đọc sách..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Đơn vị tính *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ml, giờ, phút, ly, trang, km..."
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Mục tiêu mỗi ngày *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    className="form-input"
                    value={dailyTarget}
                    onChange={e => setDailyTarget(parseFloat(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>

              {/* Frequency Schedule Selector */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.85rem'
              }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.55rem', fontWeight: 700 }}>
                  <Repeat size={14} color="var(--accent-primary)" />
                  <span>Tần suất thực hiện *</span>
                </label>

                {/* 3 Main Frequency Options */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', marginBottom: '0.75rem' }}>
                  {[
                    { id: 'DAILY', label: '🔄 Hàng ngày', desc: 'Mỗi ngày' },
                    { id: 'WEEKLY_DAYS', label: '📅 Thứ trong tuần', desc: 'Chọn ngày cụ thể' },
                    { id: 'WEEKLY_TARGET', label: '🎯 Số lần / tuần', desc: 'Mục tiêu tuần' }
                  ].map(opt => {
                    const isSelected = frequency === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFrequency(opt.id as HabitFrequency)}
                        style={{
                          padding: '0.5rem 0.4rem',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(21, 128, 61, 0.08)' : 'var(--bg-main)',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          textAlign: 'center'
                        }}
                      >
                        <span>{opt.label}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-view when WEEKLY_DAYS is selected */}
                {frequency === 'WEEKLY_DAYS' && (
                  <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '0.65rem', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Chọn ngày thực hiện:
                      </span>
                      {/* Quick day presets */}
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {[
                          { label: 'Cả tuần', days: [0, 1, 2, 3, 4, 5, 6] },
                          { label: 'T2 - T6', days: [1, 2, 3, 4, 5] },
                          { label: 'T7, CN', days: [6, 0] },
                          { label: 'T2, T4, T6, CN', days: [1, 3, 5, 0] }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setTargetDays(preset.days)}
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 7 Days Toggle Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem' }}>
                      {DAY_OPTIONS.map(opt => {
                        const isDaySelected = targetDays.includes(opt.day);
                        return (
                          <button
                            key={opt.day}
                            type="button"
                            onClick={() => {
                              if (isDaySelected) {
                                if (targetDays.length > 1) {
                                  setTargetDays(targetDays.filter(d => d !== opt.day));
                                }
                              } else {
                                setTargetDays([...targetDays, opt.day]);
                              }
                            }}
                            style={{
                              padding: '0.45rem 0',
                              borderRadius: '6px',
                              border: isDaySelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                              background: isDaySelected ? 'var(--accent-primary)' : 'var(--bg-card)',
                              color: isDaySelected ? '#ffffff' : 'var(--text-main)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                            title={opt.name}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-view when WEEKLY_TARGET is selected */}
                {frequency === 'WEEKLY_TARGET' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.02)', padding: '0.65rem', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Mục tiêu hoàn thành:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setWeeklyTarget(prev => Math.max(1, prev - 1))}
                        style={{
                          padding: '0.2rem 0.45rem',
                          borderRadius: '4px 0 0 4px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={weeklyTarget}
                        onChange={e => setWeeklyTarget(Math.min(7, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                        style={{
                          width: '40px',
                          textAlign: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '0.2rem',
                          borderTop: '1px solid var(--border-color)',
                          borderBottom: '1px solid var(--border-color)',
                          borderLeft: 'none',
                          borderRight: 'none',
                          outline: 'none',
                          background: 'var(--bg-main)',
                          color: 'var(--text-main)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setWeeklyTarget(prev => Math.min(7, prev + 1))}
                        style={{
                          padding: '0.2rem 0.45rem',
                          borderRadius: '0 4px 4px 0',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        +
                      </button>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      lần / tuần (T2 - CN)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Tùy chọn nạp nhanh (cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: 250, 500 hoặc 1, 2"
                  value={quickOptionsInput}
                  onChange={e => setQuickOptionsInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Icon đại diện
                  </label>
                  <select
                    className="form-input"
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                  >
                    <option value="water">💧 Nước (Water)</option>
                    <option value="moon">🌙 Giấc ngủ (Moon)</option>
                    <option value="dumbbell">🏃 Thể dục (Dumbbell)</option>
                    <option value="book">📖 Sách (Book)</option>
                    <option value="coffee">☕ Cà phê / Trà (Coffee)</option>
                    <option value="footprints">🚶 Đi bộ (Footprints)</option>
                    <option value="heart">❤️ Sức khỏe (Heart)</option>
                    <option value="sparkles">✨ Năng lượng (Sparkles)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Màu sắc chủ đạo
                  </label>
                  <input
                    type="color"
                    className="form-input"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    style={{ height: '42px', padding: '4px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onCloseCreateModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang tạo...' : 'Tạo Thói Quen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Custom Value Input Popup (Replacing window.prompt) */}
      {customLogHabit && (
        <div className="modal-overlay" onClick={() => setCustomLogHabit(null)}>
          <div 
            className="modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '440px', padding: '1.5rem' }}
          >
            {(() => {
              const ModalIcon = HABIT_ICONS[customLogHabit.icon || 'sparkles'] || Sparkles;
              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      background: `${customLogHabit.color || '#6366f1'}22`,
                      color: customLogHabit.color || '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ModalIcon size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>
                        Nhập Tiêu Thụ Tùy Chỉnh
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {customLogHabit.title} &bull; Mục tiêu: {customLogHabit.dailyTarget} {customLogHabit.unit}/ngày
                      </p>
                    </div>
                  </div>

                  <button onClick={() => setCustomLogHabit(null)} className="btn-icon">
                    <X size={18} />
                  </button>
                </div>
              );
            })()}

            {customLogError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-danger)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                marginBottom: '0.85rem'
              }}>
                {customLogError}
              </div>
            )}

            <form onSubmit={handleCustomLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Mode switch: Nạp thêm vs Đặt giá trị */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(20, 83, 45, 0.06)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                <button
                  type="button"
                  onClick={() => setCustomLogMode('add')}
                  style={{
                    padding: '0.45rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: customLogMode === 'add' ? 'var(--accent-primary)' : 'transparent',
                    color: customLogMode === 'add' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ➕ Nạp Thêm
                </button>
                <button
                  type="button"
                  onClick={() => setCustomLogMode('set')}
                  style={{
                    padding: '0.45rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: customLogMode === 'set' ? 'var(--accent-primary-hover)' : 'transparent',
                    color: customLogMode === 'set' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ✏️ Đặt Trực Tiếp
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 500 }}>
                  {customLogMode === 'add' ? `Số lượng ${customLogHabit.unit} muốn nạp thêm:` : `Tổng số lượng ${customLogHabit.unit} của ngày:`}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={customLogAmount}
                    onChange={e => setCustomLogAmount(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '1.25rem', fontWeight: 700, paddingRight: '4.5rem' }}
                    autoFocus
                    required
                  />
                  <span style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    {customLogHabit.unit}
                  </span>
                </div>
              </div>

              {/* Quick suggestion chips */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[1, 5, 10, 50, 100, 250, 500].filter(val => {
                  // Filter sensible values based on dailyTarget
                  if (customLogHabit.dailyTarget >= 500) return val >= 50;
                  if (customLogHabit.dailyTarget >= 50) return val >= 5 && val <= 100;
                  return val <= 10;
                }).map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      if (customLogMode === 'add') {
                        setCustomLogAmount(String(val));
                      } else {
                        const cur = getHabitValueForDate(customLogHabit, selectedDateStr);
                        setCustomLogAmount(String(cur + val));
                      }
                    }}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '999px',
                      background: 'rgba(20, 83, 45, 0.06)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    +{val} {customLogHabit.unit}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCustomLogHabit(null)}
                  disabled={customLogSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={customLogSubmitting}
                >
                  {customLogSubmitting ? 'Đang lưu...' : 'Xác Nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Habit & Target */}
      {editingHabit && (
        <div className="modal-overlay" onClick={() => setEditingHabit(null)}>
          <div 
            className="modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  Chỉnh Sửa Mục Tiêu & Thói Quen
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Thay đổi mục tiêu hàng ngày hoặc cấu hình hoạt động
                </p>
              </div>
              <button onClick={() => setEditingHabit(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-danger)',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Tên thói quen *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Uống nước, Đọc sách..."
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                />
              </div>

              {/* Target & Unit Highlight Box */}
              <div style={{ background: 'rgba(21, 128, 61, 0.06)', border: '1px solid rgba(21, 128, 61, 0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                      🎯 Mục tiêu mỗi ngày *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      className="form-input"
                      style={{ fontSize: '1.15rem', fontWeight: 700 }}
                      value={editDailyTarget}
                      onChange={e => setEditDailyTarget(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Đơn vị tính *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ml, trang, ly, phút..."
                      value={editUnit}
                      onChange={e => setEditUnit(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Frequency Schedule Selector */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.85rem'
              }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.55rem', fontWeight: 700 }}>
                  <Repeat size={14} color="var(--accent-primary)" />
                  <span>Tần suất thực hiện *</span>
                </label>

                {/* 3 Main Frequency Options */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', marginBottom: '0.75rem' }}>
                  {[
                    { id: 'DAILY', label: '🔄 Hàng ngày', desc: 'Mỗi ngày' },
                    { id: 'WEEKLY_DAYS', label: '📅 Thứ trong tuần', desc: 'Chọn ngày cụ thể' },
                    { id: 'WEEKLY_TARGET', label: '🎯 Số lần / tuần', desc: 'Mục tiêu tuần' }
                  ].map(opt => {
                    const isSelected = editFrequency === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEditFrequency(opt.id as HabitFrequency)}
                        style={{
                          padding: '0.5rem 0.4rem',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(21, 128, 61, 0.08)' : 'var(--bg-main)',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          textAlign: 'center'
                        }}
                      >
                        <span>{opt.label}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-view when WEEKLY_DAYS is selected */}
                {editFrequency === 'WEEKLY_DAYS' && (
                  <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '0.65rem', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Chọn ngày thực hiện:
                      </span>
                      {/* Quick day presets */}
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {[
                          { label: 'Cả tuần', days: [0, 1, 2, 3, 4, 5, 6] },
                          { label: 'T2 - T6', days: [1, 2, 3, 4, 5] },
                          { label: 'T7, CN', days: [6, 0] },
                          { label: 'T2, T4, T6, CN', days: [1, 3, 5, 0] }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setEditTargetDays(preset.days)}
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 7 Days Toggle Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem' }}>
                      {DAY_OPTIONS.map(opt => {
                        const isDaySelected = editTargetDays.includes(opt.day);
                        return (
                          <button
                            key={opt.day}
                            type="button"
                            onClick={() => {
                              if (isDaySelected) {
                                if (editTargetDays.length > 1) {
                                  setEditTargetDays(editTargetDays.filter(d => d !== opt.day));
                                }
                              } else {
                                setEditTargetDays([...editTargetDays, opt.day]);
                              }
                            }}
                            style={{
                              padding: '0.45rem 0',
                              borderRadius: '6px',
                              border: isDaySelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                              background: isDaySelected ? 'var(--accent-primary)' : 'var(--bg-card)',
                              color: isDaySelected ? '#ffffff' : 'var(--text-main)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                            title={opt.name}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-view when WEEKLY_TARGET is selected */}
                {editFrequency === 'WEEKLY_TARGET' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.02)', padding: '0.65rem', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Mục tiêu hoàn thành:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setEditWeeklyTarget(prev => Math.max(1, prev - 1))}
                        style={{
                          padding: '0.2rem 0.45rem',
                          borderRadius: '4px 0 0 4px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={editWeeklyTarget}
                        onChange={e => setEditWeeklyTarget(Math.min(7, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                        style={{
                          width: '40px',
                          textAlign: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '0.2rem',
                          borderTop: '1px solid var(--border-color)',
                          borderBottom: '1px solid var(--border-color)',
                          borderLeft: 'none',
                          borderRight: 'none',
                          outline: 'none',
                          background: 'var(--bg-main)',
                          color: 'var(--text-main)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditWeeklyTarget(prev => Math.min(7, prev + 1))}
                        style={{
                          padding: '0.2rem 0.45rem',
                          borderRadius: '0 4px 4px 0',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        +
                      </button>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      lần / tuần (T2 - CN)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Tùy chọn nạp nhanh (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: 250, 500 hoặc 5, 10"
                  value={editQuickOptionsInput}
                  onChange={e => setEditQuickOptionsInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Icon đại diện
                  </label>
                  <select
                    className="form-input"
                    value={editIcon}
                    onChange={e => setEditIcon(e.target.value)}
                  >
                    <option value="water">💧 Nước (Water)</option>
                    <option value="moon">🌙 Giấc ngủ (Moon)</option>
                    <option value="dumbbell">🏃 Thể dục (Dumbbell)</option>
                    <option value="book">📖 Sách (Book)</option>
                    <option value="coffee">☕ Cà phê / Trà (Coffee)</option>
                    <option value="footprints">🚶 Đi bộ (Footprints)</option>
                    <option value="heart">❤️ Sức khỏe (Heart)</option>
                    <option value="sparkles">✨ Năng lượng (Sparkles)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Màu sắc chủ đạo
                  </label>
                  <input
                    type="color"
                    className="form-input"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    style={{ height: '42px', padding: '4px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingHabit(null)}
                  disabled={editSubmitting}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmation Dialog (Replacing window.confirm) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div 
            className="modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: confirmDialog.confirmVariant === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: confirmDialog.confirmVariant === 'danger' ? 'var(--accent-danger)' : 'var(--accent-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={26} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {confirmDialog.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {confirmDialog.message}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setConfirmDialog(null)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  className={`btn ${confirmDialog.confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                  style={{ flex: 1 }}
                  onClick={() => confirmDialog.onConfirm()}
                >
                  {confirmDialog.confirmText || 'Xác Nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
