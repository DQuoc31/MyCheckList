import React, { useState, useMemo, useEffect } from 'react';
import { IScheduleEvent, ITask, Priority, TaskStatus } from '@mychecklist/shared';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3,
  ChevronLeft, 
  ChevronRight, 
  CalendarRange, 
  LayoutGrid, 
  Filter, 
  X, 
  AlertTriangle,
  Search,
  Repeat,
  Target,
  CheckSquare,
  Square,
  CheckCircle2,
  ListTodo,
  AlertCircle,
  Tag
} from 'lucide-react';
import { ScheduleAPI, TaskAPI } from '../services/api';

interface CalendarViewProps {
  events: IScheduleEvent[];
  tasks?: ITask[];
  onRefresh: () => void;
  showCreateModal: boolean;
  onCloseCreateModal: () => void;
}

type ViewMode = 'day' | 'week' | 'month';

const START_HOUR = 6;  // 06:00
const END_HOUR = 24;   // 24:00
const TOTAL_HOURS = END_HOUR - START_HOUR; // 18 hours
const HOUR_HEIGHT = 68; // Height in pixels for 1 hour

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  tasks = [],
  onRefresh,
  showCreateModal,
  onCloseCreateModal
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedWeekDay, setSelectedWeekDay] = useState<Date>(new Date());
  const [selectedMonthDay, setSelectedMonthDay] = useState<Date>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Live timer for current real-time clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // 10 seconds refresh
    return () => clearInterval(timer);
  }, []);

  // Synchronize selected day when currentDate changes
  useEffect(() => {
    setSelectedWeekDay(new Date(currentDate));
    setSelectedMonthDay(new Date(currentDate));
  }, [currentDate]);

  // Modal State (Create & Edit Schedule Event)
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IScheduleEvent | null>(null);
  const isModalVisible = showCreateModal || isLocalModalOpen;

  // Custom Delete Confirm Popup State
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<IScheduleEvent | null>(null);

  // Selected Task Detail Modal State
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<ITask | null>(null);

  // Form states for creating/editing event
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newCategory, setNewCategory] = useState<'WORK' | 'PERSONAL' | 'STUDY' | 'HEALTH' | 'MEETING'>('WORK');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'WEEKLY' | 'DAILY' | 'MONTHLY'>('WEEKLY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper for formatting local date YYYY-MM-DD
  const formatLocalDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getWeekdayNameFromDateStr = (dateStr: string): string => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return dayNames[dateObj.getDay()] || 'Thứ';
    } catch {
      return 'Thứ';
    }
  };

  const extractLocalTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${min}`;
    } catch {
      return '09:00';
    }
  };

  // Close modal handler
  const handleCloseModal = () => {
    setIsLocalModalOpen(false);
    setEditingEvent(null);
    onCloseCreateModal();
  };

  // Open Create Modal at a specific time slot
  const handleOpenCreateAtSlot = (date: Date, startHour?: number, startMinute: number = 0) => {
    setEditingEvent(null);
    setNewDate(formatLocalDate(date));
    setNewTitle('');
    setNewDesc('');
    setNewCategory('WORK');
    setIsRecurring(false);
    setRecurrencePattern('WEEKLY');

    if (startHour !== undefined) {
      const sh = String(startHour).padStart(2, '0');
      const sm = String(startMinute).padStart(2, '0');
      const eh = String(Math.min(23, startHour + 1)).padStart(2, '0');
      const em = String(startMinute).padStart(2, '0');
      setNewStartTime(`${sh}:${sm}`);
      setNewEndTime(`${eh}:${em}`);
    } else {
      const now = new Date();
      const currentH = now.getHours();
      const nextH = Math.min(23, currentH + 1);
      setNewStartTime(`${String(currentH).padStart(2, '0')}:00`);
      setNewEndTime(`${String(nextH).padStart(2, '0')}:00`);
    }
    setIsLocalModalOpen(true);
  };

  // Open Edit Modal for an existing event
  const handleOpenEditModal = (evt: IScheduleEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEvent(evt);
    setNewTitle(evt.title || '');
    setNewDesc(evt.description || '');
    setNewDate(formatLocalDate(new Date(evt.startTime)));
    setNewStartTime(extractLocalTime(evt.startTime));
    setNewEndTime(extractLocalTime(evt.endTime));
    setNewCategory(evt.category || 'WORK');
    setIsRecurring(Boolean(evt.isRecurring));
    setRecurrencePattern(evt.recurrencePattern || 'WEEKLY');
    setIsLocalModalOpen(true);
  };

  // Trigger delete confirmation popup
  const promptDeleteEvent = (evt: IScheduleEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTargetEvent(evt);
  };

  // Confirm delete handler
  const confirmDeleteEvent = async () => {
    if (!deleteTargetEvent) return;
    const eventId = deleteTargetEvent.id || deleteTargetEvent._id;
    if (!eventId) return;

    try {
      await ScheduleAPI.delete(eventId);
      if (editingEvent && (editingEvent.id === eventId || editingEvent._id === eventId)) {
        handleCloseModal();
      }
      setDeleteTargetEvent(null);
      onRefresh();
    } catch (err: any) {
      alert(`Lỗi xóa lịch trình: ${err.message}`);
    }
  };

  // Quick Duration helper
  const handleSetDuration = (minutes: number) => {
    try {
      const [sh, sm] = newStartTime.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = Math.min(23 * 60 + 59, startMinutes + minutes);
      const eh = Math.floor(endMinutes / 60);
      const em = endMinutes % 60;
      setNewEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Category Color Map
  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'WORK': return '#6366f1';     // Indigo
      case 'PERSONAL': return '#ec4899'; // Pink
      case 'STUDY': return '#8b5cf6';    // Purple
      case 'HEALTH': return '#10b981';   // Emerald Green
      case 'MEETING': return '#f59e0b';  // Amber
      default: return '#6366f1';
    }
  };

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'WORK': return 'Công việc';
      case 'PERSONAL': return 'Cá nhân';
      case 'STUDY': return 'Học tập';
      case 'HEALTH': return 'Sức khỏe';
      case 'MEETING': return 'Cuộc họp';
      default: return cat || 'Khác';
    }
  };

  // Priority Helpers for Tasks
  const getPriorityColor = (p?: Priority) => {
    switch (p) {
      case 'URGENT': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#3b82f6';
      default: return '#6366f1';
    }
  };

  const getPriorityLabel = (p?: Priority) => {
    switch (p) {
      case 'URGENT': return 'Khẩn cấp';
      case 'HIGH': return 'Cao';
      case 'MEDIUM': return 'Trung bình';
      case 'LOW': return 'Thấp';
      default: return 'Trung bình';
    }
  };

  const isTaskOverdue = (task: ITask) => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    try {
      return new Date(task.dueDate).getTime() < Date.now();
    } catch {
      return false;
    }
  };

  const getDeadlineUrgency = (task: ITask): 'OVERDUE' | 'DUE_SOON' | 'NORMAL' | 'NONE' => {
    if (!task.dueDate || task.status === 'COMPLETED') return 'NONE';
    try {
      const dueTime = new Date(task.dueDate).getTime();
      const diffMs = dueTime - Date.now();
      if (diffMs < 0) return 'OVERDUE';
      if (diffMs <= 24 * 60 * 60 * 1000) return 'DUE_SOON'; // Dưới 1 ngày (24 giờ)
      return 'NORMAL';
    } catch {
      return 'NONE';
    }
  };

  const formatRemainingTime = (dueDate: string): string => {
    try {
      const diffMs = new Date(dueDate).getTime() - Date.now();
      if (diffMs <= 0) return 'Đã quá hạn';
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours === 0) return `Còn ${minutes} phút`;
      if (hours < 24) return `Còn ${hours}h ${minutes}p`;
      const days = Math.floor(hours / 24);
      return `Còn ${days} ngày`;
    } catch {
      return '';
    }
  };

  // Resolve tasks that have a deadline on a specific day
  const resolveTaskDeadlinesForDay = (targetDay: Date, taskList: ITask[] = []): ITask[] => {
    return taskList.filter(t => {
      if (!t.dueDate) return false;
      try {
        const d = new Date(t.dueDate);
        return isSameDay(d, targetDay);
      } catch {
        return false;
      }
    });
  };

  // Toggle Task Completion from Calendar
  const handleToggleTaskStatus = async (task: ITask, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const taskId = task.id || task._id;
    if (!taskId) return;
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      await TaskAPI.update(taskId, { status: nextStatus });
      onRefresh();
    } catch (err: any) {
      alert(`Lỗi cập nhật trạng thái việc: ${err.message}`);
    }
  };

  // Date Navigation Helpers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter events by category
  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'ALL') return events;
    return events.filter(e => e.category === categoryFilter);
  }, [events, categoryFilter]);

  // Form Submit (Create or Update Schedule Event)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const [startH, startM] = newStartTime.split(':').map(Number);
      const [endH, endM] = newEndTime.split(':').map(Number);
      const [y, m, d] = newDate.split('-').map(Number);

      const startDate = new Date(y, m - 1, d, startH, startM, 0, 0);
      const endDate = new Date(y, m - 1, d, endH, endM, 0, 0);

      if (endDate <= startDate) {
        alert('Giờ kết thúc phải sau giờ bắt đầu!');
        setIsSubmitting(false);
        return;
      }

      if (editingEvent) {
        // Update existing event
        const eventId = editingEvent.id || editingEvent._id;
        if (!eventId) throw new Error('Không tìm thấy ID sự kiện');

        await ScheduleAPI.update(eventId, {
          title: newTitle.trim(),
          description: newDesc.trim(),
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          category: newCategory,
          color: getCategoryColor(newCategory),
          isRecurring,
          recurrencePattern: isRecurring ? recurrencePattern : undefined
        });
      } else {
        // Create new event
        await ScheduleAPI.create({
          title: newTitle.trim(),
          description: newDesc.trim(),
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          category: newCategory,
          color: getCategoryColor(newCategory),
          isRecurring,
          recurrencePattern: isRecurring ? recurrencePattern : undefined
        });
      }

      handleCloseModal();
      onRefresh();
    } catch (err: any) {
      alert(`Lỗi lưu lịch trình: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return isoString;
    }
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Header Title
  const getHeaderTitle = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    if (viewMode === 'month') {
      return `Tháng ${month}, Năm ${year}`;
    }
    if (viewMode === 'day') {
      const dayName = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][currentDate.getDay()];
      return `${dayName}, ${currentDate.getDate()}/${month}/${year}`;
    }
    // Week Title
    const dayOfWeek = currentDate.getDay(); // 0 is Sun
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + distanceToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return `Tuần từ ${monday.getDate()}/${monday.getMonth() + 1} - ${sunday.getDate()}/${sunday.getMonth() + 1}/${year}`;
  };

  // -------------------------------------------------------------
  // Resolve All Active & Recurring Events for a Target Day
  // -------------------------------------------------------------
  const resolveEventsForDay = (targetDay: Date, eventList: IScheduleEvent[]): IScheduleEvent[] => {
    const results: IScheduleEvent[] = [];
    const targetDayMidnight = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate()).getTime();

    eventList.forEach(evt => {
      try {
        const evtStart = new Date(evt.startTime);
        const evtEnd = new Date(evt.endTime);
        const evtStartMidnight = new Date(evtStart.getFullYear(), evtStart.getMonth(), evtStart.getDate()).getTime();

        // 1. Non-recurring event: exact calendar date match
        if (!evt.isRecurring) {
          if (isSameDay(evtStart, targetDay)) {
            results.push(evt);
          }
          return;
        }

        // 2. Recurring events: active only on or after the starting date
        if (targetDayMidnight < evtStartMidnight) {
          return;
        }

        const pattern = evt.recurrencePattern || 'WEEKLY';
        let isMatch = false;

        if (pattern === 'WEEKLY') {
          // Matches same day of week (e.g. Every Monday)
          isMatch = targetDay.getDay() === evtStart.getDay();
        } else if (pattern === 'DAILY') {
          // Matches every day
          isMatch = true;
        } else if (pattern === 'MONTHLY') {
          // Matches same day of month
          isMatch = targetDay.getDate() === evtStart.getDate();
        }

        if (isMatch) {
          const durationMs = Math.max(15 * 60 * 1000, evtEnd.getTime() - evtStart.getTime());
          const instanceStart = new Date(
            targetDay.getFullYear(),
            targetDay.getMonth(),
            targetDay.getDate(),
            evtStart.getHours(),
            evtStart.getMinutes(),
            evtStart.getSeconds()
          );
          const instanceEnd = new Date(instanceStart.getTime() + durationMs);

          results.push({
            ...evt,
            startTime: instanceStart.toISOString(),
            endTime: instanceEnd.toISOString()
          });
        }
      } catch {
        // Skip malformed dates
      }
    });

    return results;
  };

  // -------------------------------------------------------------
  // Calculate Time-Proportional Layout for a Day (Events + Task Deadlines)
  // -------------------------------------------------------------
  interface PositionedItem {
    type: 'EVENT' | 'TASK_DEADLINE';
    event?: IScheduleEvent;
    task?: ITask;
    startMinutes: number;
    endMinutes: number;
    top: number;
    height: number;
    left: number;
    width: number;
    startFormatted: string;
    endFormatted: string;
    durationMinutes: number;
  }

  const computeDayPositionedItems = (dayDate: Date): PositionedItem[] => {
    const dayEvts = resolveEventsForDay(dayDate, filteredEvents);
    const dayTasks = resolveTaskDeadlinesForDay(dayDate, tasks);

    if (dayEvts.length === 0 && dayTasks.length === 0) return [];

    const rawItems: Array<{
      type: 'EVENT' | 'TASK_DEADLINE';
      event?: IScheduleEvent;
      task?: ITask;
      startMinutes: number;
      endMinutes: number;
      top: number;
      height: number;
      durationMinutes: number;
      startFormatted: string;
      endFormatted: string;
    }> = [];

    // 1. Process Schedule Events
    dayEvts.forEach(evt => {
      const s = new Date(evt.startTime);
      const e = new Date(evt.endTime);
      let startMinutes = s.getHours() * 60 + s.getMinutes();
      let endMinutes = e.getHours() * 60 + e.getMinutes();

      if (endMinutes <= startMinutes) {
        endMinutes = startMinutes + 30;
      }

      const clampStart = Math.max(START_HOUR * 60, startMinutes);
      const clampEnd = Math.min(END_HOUR * 60, endMinutes);

      const offsetMin = Math.max(0, clampStart - START_HOUR * 60);
      const durationMin = Math.max(25, clampEnd - clampStart);

      const top = (offsetMin / 60) * HOUR_HEIGHT;
      const height = Math.max(34, (durationMin / 60) * HOUR_HEIGHT - 3);

      rawItems.push({
        type: 'EVENT',
        event: evt,
        startMinutes,
        endMinutes,
        top,
        height,
        durationMinutes: endMinutes - startMinutes,
        startFormatted: formatTime(evt.startTime),
        endFormatted: formatTime(evt.endTime)
      });
    });

    // 2. Process Task Deadlines on this day
    dayTasks.forEach(t => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      const startMinutes = d.getHours() * 60 + d.getMinutes();
      const durationEst = Math.max(25, t.estimatedMinutes || 30);
      const endMinutes = startMinutes + durationEst;

      const clampStart = Math.max(START_HOUR * 60, startMinutes);
      const clampEnd = Math.min(END_HOUR * 60, endMinutes);

      const offsetMin = Math.max(0, clampStart - START_HOUR * 60);
      const durationMin = Math.max(25, clampEnd - clampStart);

      const top = (offsetMin / 60) * HOUR_HEIGHT;
      const height = Math.max(36, (durationMin / 60) * HOUR_HEIGHT - 3);

      rawItems.push({
        type: 'TASK_DEADLINE',
        task: t,
        startMinutes,
        endMinutes,
        top,
        height,
        durationMinutes: durationEst,
        startFormatted: formatTime(t.dueDate),
        endFormatted: formatTime(new Date(d.getTime() + durationEst * 60000).toISOString())
      });
    });

    // Sort by startMinutes, then by duration descending
    rawItems.sort((a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes);

    // Compute overlapping column groups
    const positioned: PositionedItem[] = [];
    const columns: typeof rawItems[] = [];

    rawItems.forEach(item => {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastInCol = columns[c][columns[c].length - 1];
        if (lastInCol.endMinutes <= item.startMinutes) {
          columns[c].push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([item]);
      }
    });

    const totalCols = Math.max(1, columns.length);
    columns.forEach((colItems, colIdx) => {
      const colWidth = 100 / totalCols;
      const colLeft = colIdx * colWidth;

      colItems.forEach(item => {
        positioned.push({
          type: item.type,
          event: item.event,
          task: item.task,
          startMinutes: item.startMinutes,
          endMinutes: item.endMinutes,
          top: item.top,
          height: item.height,
          left: colLeft,
          width: colWidth,
          startFormatted: item.startFormatted,
          endFormatted: item.endFormatted,
          durationMinutes: item.durationMinutes
        });
      });
    });

    return positioned;
  };

  // Live Current Time Indicator calculations
  const isCurrentDateToday = isSameDay(currentDate, currentTime);
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentLiveTop = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const isCurrentLiveVisible = currentMinutes >= START_HOUR * 60 && currentMinutes <= END_HOUR * 60;
  const liveTimeString = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;

  // Tasks due on currently selected date
  const dayTaskDeadlines = resolveTaskDeadlinesForDay(currentDate, tasks);

  // -------------------------------------------------------------
  // 1. DAY VIEW (Time-Proportional Calendar Timeline + Task Deadlines)
  // -------------------------------------------------------------
  const renderDayView = () => {
    const positionedItems = computeDayPositionedItems(currentDate);
    const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR);

    const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const clickedTotalHours = START_HOUR + clickY / HOUR_HEIGHT;
      const hour = Math.floor(clickedTotalHours);
      const minutes = Math.floor((clickedTotalHours - hour) * 60);
      const roundedMinutes = minutes < 30 ? 0 : 30;

      handleOpenCreateAtSlot(currentDate, hour, roundedMinutes);
    };

    return (
      <div className="glass-card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
        {/* Banner Helper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          lineHeight: 1.4,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} style={{ color: '#818cf8', flexShrink: 0 }} />
            <span>
              Khung giờ tự động <strong>kéo dài theo thời lượng</strong>. Chạm vào khoảng trống bất kỳ để đặt lịch nhanh.
            </span>
          </div>

          {isCurrentDateToday && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
              Giờ hiện tại: {liveTimeString}
            </div>
          )}
        </div>

        {/* Day Task Deadlines Summary Strip (If any task deadline exists on this day) */}
        {dayTaskDeadlines.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.08))',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#fca5a5' }}>
                <Target size={15} style={{ color: '#ef4444' }} />
                <span>🎯 Hạn chót công việc trong ngày ({dayTaskDeadlines.length})</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Đã hiển thị trên dòng thời gian bên dưới
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {dayTaskDeadlines.map(t => {
                const taskId = t.id || t._id || '';
                const isOverdue = isTaskOverdue(t);
                const urgency = getDeadlineUrgency(t);
                const isDueSoon = urgency === 'DUE_SOON';
                const isDone = t.status === 'COMPLETED';
                const pColor = getPriorityColor(t.priority);

                return (
                  <div
                    key={taskId}
                    onClick={() => setSelectedTaskDetail(t)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      background: isDone 
                        ? 'rgba(16, 185, 129, 0.15)' 
                        : isOverdue 
                          ? 'rgba(239, 68, 68, 0.22)' 
                          : isDueSoon
                            ? 'rgba(245, 158, 11, 0.22)'
                            : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.4)' : isOverdue ? 'rgba(239, 68, 68, 0.5)' : isDueSoon ? 'rgba(245, 158, 11, 0.55)' : 'rgba(255, 255, 255, 0.12)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Nhấn để xem chi tiết việc cần làm"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleToggleTaskStatus(t, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: isDone ? '#10b981' : isDueSoon ? '#f59e0b' : 'var(--text-muted)'
                      }}
                      title={isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                    >
                      {isDone ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>

                    <span style={{
                      fontSize: '0.62rem',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      background: isDone ? 'rgba(16, 185, 129, 0.25)' : isOverdue ? 'rgba(239, 68, 68, 0.3)' : isDueSoon ? 'rgba(245, 158, 11, 0.35)' : `${pColor}33`,
                      color: isDone ? '#10b981' : isOverdue ? '#ef4444' : isDueSoon ? '#fbbf24' : pColor,
                      fontWeight: 700,
                      border: `1px solid ${isDone ? '#10b98155' : isOverdue ? '#ef444455' : isDueSoon ? '#f59e0b55' : `${pColor}55`}`
                    }}>
                      {isDueSoon ? '🔥 < 24h' : getPriorityLabel(t.priority)}
                    </span>

                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: isDone ? 'var(--text-muted)' : '#fff',
                      textDecoration: isDone ? 'line-through' : 'none',
                      maxWidth: '180px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {t.title}
                    </span>

                    <span style={{
                      fontSize: '0.72rem',
                      color: isOverdue ? '#f87171' : isDueSoon ? '#fbbf24' : 'var(--text-muted)',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      <Clock size={10} />
                      {t.dueDate ? formatTime(t.dueDate) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline Container */}
        <div style={{
          display: 'flex',
          position: 'relative',
          height: `${TOTAL_HOURS * HOUR_HEIGHT}px`,
          userSelect: 'none'
        }}>
          {/* Left Time Axis Labels */}
          <div style={{
            width: '52px',
            flexShrink: 0,
            position: 'relative',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {hours.map(hour => {
              const hourLabel = `${hour < 10 ? '0' + hour : hour}:00`;
              return (
                <div
                  key={hour}
                  style={{
                    position: 'absolute',
                    top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
                    width: '100%',
                    transform: 'translateY(-50%)',
                    textAlign: 'right',
                    paddingRight: '8px',
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                    fontWeight: 600
                  }}
                >
                  {hourLabel}
                </div>
              );
            })}
          </div>

          {/* Right Grid & Events Canvas */}
          <div
            onClick={handleGridClick}
            style={{
              flex: 1,
              position: 'relative',
              cursor: 'crosshair',
              background: 'rgba(255, 255, 255, 0.01)'
            }}
          >
            {/* Hour Grid Lines */}
            {hours.map(hour => {
              const topPos = (hour - START_HOUR) * HOUR_HEIGHT;
              return (
                <React.Fragment key={hour}>
                  {/* Full hour line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${topPos}px`,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      pointerEvents: 'none'
                    }}
                  />
                  {/* Half-hour dashed guide line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${topPos + HOUR_HEIGHT / 2}px`,
                      left: 0,
                      right: 0,
                      height: '1px',
                      borderTop: '1px dashed rgba(255, 255, 255, 0.03)',
                      pointerEvents: 'none'
                    }}
                  />
                </React.Fragment>
              );
            })}

            {/* Current Live Time Red Line with Time Badge (if today) */}
            {isCurrentDateToday && isCurrentLiveVisible && (
              <div
                style={{
                  position: 'absolute',
                  top: `${currentLiveTop}px`,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: '#ef4444',
                  zIndex: 25,
                  pointerEvents: 'none',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.9)'
                }}
              >
                {/* Live time indicator badge directly on the line */}
                <div style={{
                  position: 'absolute',
                  left: '0px',
                  top: '-11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  padding: '1px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.25)',
                  pointerEvents: 'auto'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    display: 'inline-block',
                    boxShadow: '0 0 4px #ffffff'
                  }} />
                  <span>{liveTimeString}</span>
                </div>
              </div>
            )}

            {/* Proportional Event & Task Deadline Cards */}
            {positionedItems.map(item => {
              if (item.type === 'EVENT' && item.event) {
                const evt = item.event;
                const evtId = evt.id || evt._id || '';
                const color = evt.color || getCategoryColor(evt.category);
                const isShort = item.height < 55;

                return (
                  <div
                    key={`evt-${evtId}`}
                    onClick={(e) => handleOpenEditModal(evt, e)}
                    style={{
                      position: 'absolute',
                      top: `${item.top}px`,
                      height: `${item.height}px`,
                      left: `calc(${item.left}% + 3px)`,
                      width: `calc(${item.width}% - 6px)`,
                      borderRadius: '8px',
                      background: `linear-gradient(135deg, ${color}18, #ffffff)`,
                      borderLeft: `4px solid ${color}`,
                      borderTop: '1px solid var(--border-color)',
                      borderRight: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)',
                      padding: isShort ? '3px 8px' : '6px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      boxShadow: 'var(--shadow-card)',
                      zIndex: 10,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    className="schedule-event-block"
                    title="Nhấn để chỉnh sửa lịch trình này"
                  >
                    {/* Top Header Row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      gap: '0.4rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, flex: 1 }}>
                        <span style={{
                          fontSize: '0.62rem',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: color,
                          color: '#fff',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {getCategoryLabel(evt.category)}
                        </span>
                        {evt.isRecurring && (
                          <span style={{
                            fontSize: '0.62rem',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            background: 'rgba(21, 128, 61, 0.15)',
                            color: 'var(--accent-primary)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            flexShrink: 0
                          }} title={evt.recurrencePattern === 'DAILY' ? 'Lặp hằng ngày' : evt.recurrencePattern === 'MONTHLY' ? 'Lặp hằng tháng' : 'Lặp hằng tuần'}>
                            <Repeat size={9} />
                            {evt.recurrencePattern === 'DAILY' ? 'Ngày' : evt.recurrencePattern === 'MONTHLY' ? 'Tháng' : 'Tuần'}
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {evt.title}
                        </span>
                      </div>

                      {/* Action Buttons: Top-Right */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          flexShrink: 0,
                          background: 'var(--bg-secondary)',
                          borderRadius: '6px',
                          padding: '1px 3px',
                          border: '1px solid var(--border-color)'
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          className="btn-icon"
                          style={{ padding: '2px', color: '#cbd5e1', borderRadius: '4px' }}
                          onClick={(e) => handleOpenEditModal(evt, e)}
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ padding: '2px', color: '#f87171', borderRadius: '4px' }}
                          onClick={(e) => promptDeleteEvent(evt, e)}
                          title="Xóa lịch trình"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      marginTop: isShort ? '0px' : '3px'
                    }}>
                      <Clock size={10} style={{ color }} />
                      <span>{item.startFormatted} - {item.endFormatted} ({item.durationMinutes}p)</span>
                    </div>

                    {/* Description / Notes */}
                    {evt.description && item.height >= 70 && (
                      <p style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.65)',
                        margin: '2px 0 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: Math.max(1, Math.floor((item.height - 55) / 16)),
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {evt.description}
                      </p>
                    )}
                  </div>
                );
              }

              // Render Task Deadline Item
              if (item.type === 'TASK_DEADLINE' && item.task) {
                const task = item.task;
                const taskId = task.id || task._id || '';
                const isOverdue = isTaskOverdue(task);
                const urgency = getDeadlineUrgency(task);
                const isDueSoon = urgency === 'DUE_SOON';
                const isDone = task.status === 'COMPLETED';
                const pColor = getPriorityColor(task.priority);
                const isShort = item.height < 55;

                return (
                  <div
                    key={`task-${taskId}`}
                    onClick={() => setSelectedTaskDetail(task)}
                    style={{
                      position: 'absolute',
                      top: `${item.top}px`,
                      height: `${item.height}px`,
                      left: `calc(${item.left}% + 3px)`,
                      width: `calc(${item.width}% - 6px)`,
                      borderRadius: '8px',
                      background: isDone 
                        ? 'linear-gradient(135deg, rgba(21, 128, 61, 0.08), #ffffff)'
                        : isOverdue 
                          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), #ffffff)'
                          : isDueSoon
                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), #ffffff)'
                            : 'linear-gradient(135deg, rgba(21, 128, 61, 0.08), #ffffff)',
                      borderLeft: `4px solid ${isDone ? '#10b981' : isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : pColor}`,
                      borderTop: '1px solid var(--border-color)',
                      borderRight: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)',
                      padding: isShort ? '3px 8px' : '6px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      boxShadow: 'var(--shadow-card)',
                      zIndex: 12,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    className="schedule-event-block"
                    title="🎯 Hạn chót công việc - Nhấn để xem chi tiết"
                  >
                    {/* Top Header Row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      gap: '0.4rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, flex: 1 }}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleTaskStatus(task, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: isDone ? '#10b981' : isOverdue ? '#ef4444' : isDueSoon ? '#d97706' : 'var(--text-muted)',
                            flexShrink: 0
                          }}
                          title={isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                        >
                          {isDone ? <CheckSquare size={14} /> : <Square size={14} />}
                        </button>

                        <span style={{
                          fontSize: '0.62rem',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: isDone ? '#10b981' : isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : 'var(--accent-primary)',
                          color: '#fff',
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <Target size={9} />
                          {isDone ? 'ĐÃ XONG' : isOverdue ? 'QUÁ HẠN' : isDueSoon ? 'GẤP < 24H' : 'HẠN CHÓT'}
                        </span>

                        <span style={{
                          fontSize: '0.62rem',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          background: `${pColor}33`,
                          color: pColor,
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          {getPriorityLabel(task.priority)}
                        </span>

                        <span style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {task.title}
                        </span>
                      </div>
                    </div>

                    {/* Time & Subtask Info */}
                    <div style={{
                      fontSize: '0.72rem',
                      color: isOverdue ? '#fca5a5' : isDueSoon ? '#fde68a' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginTop: isShort ? '0px' : '3px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} style={{ color: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : pColor }} />
                        Hạn: {item.startFormatted}
                        {isDueSoon && (
                          <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                            ({formatRemainingTime(task.dueDate!)})
                          </span>
                        )}
                      </span>

                      {task.checklist && task.checklist.length > 0 && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          • {task.checklist.filter(c => c.completed).length}/{task.checklist.length} việc con
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 2. WEEK VIEW (Responsive: Desktop 7-Cols Grid, Mobile 7-Day Strip + Event/Task List)
  // -------------------------------------------------------------
  const renderWeekView = () => {
    const dayOfWeek = currentDate.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + distanceToMonday);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const today = new Date();

    const selectedDayEvents = resolveEventsForDay(selectedWeekDay, filteredEvents);
    selectedDayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const selectedDayTasks = resolveTaskDeadlinesForDay(selectedWeekDay, tasks);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        {/* Mobile View: 7-Day Strip Selector & Selected Day Detail List */}
        <div className="show-on-mobile" style={{ display: 'none', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
          {/* 7-Day Strip */}
          <div className="glass-card" style={{ padding: '0.65rem 0.5rem', width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center' }}>
              {weekDays.map((day, idx) => {
                const isToday = isSameDay(day, today);
                const isSelected = isSameDay(day, selectedWeekDay);
                const dayEvts = resolveEventsForDay(day, filteredEvents);
                const dayTks = resolveTaskDeadlinesForDay(day, tasks);
                const totalCount = dayEvts.length + dayTks.length;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedWeekDay(day)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.45rem 0.15rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected 
                        ? '1.5px solid var(--accent-primary)' 
                        : isToday 
                          ? '1px solid rgba(99, 102, 241, 0.4)' 
                          : '1px solid transparent',
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2))' 
                        : isToday 
                          ? 'rgba(99, 102, 241, 0.08)' 
                          : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isSelected ? '#818cf8' : 'var(--text-muted)' }}>
                      {dayLabels[idx]}
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: isSelected || isToday ? 700 : 500,
                      color: isSelected ? '#fff' : isToday ? '#818cf8' : 'var(--text-main)',
                      marginTop: '2px'
                    }}>
                      {day.getDate()}
                    </span>
                    {/* Event & Task count dots */}
                    <div style={{ height: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginTop: '3px' }}>
                      {dayEvts.length > 0 && (
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: isSelected ? 'var(--accent-primary)' : '#818cf8',
                          boxShadow: '0 0 6px rgba(99, 102, 241, 0.8)'
                        }} />
                      )}
                      {dayTks.length > 0 && (
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)'
                        }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Event & Task List */}
          <div className="glass-card" style={{ padding: '1rem', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                  {['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][selectedWeekDay.getDay()]}, {selectedWeekDay.getDate()}/{selectedWeekDay.getMonth() + 1}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedDayEvents.length} lịch trình • {selectedDayTasks.length} hạn chót
                </p>
              </div>
              <button
                onClick={() => handleOpenCreateAtSlot(selectedWeekDay)}
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                <Plus size={14} /> Thêm Lịch
              </button>
            </div>

            {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <p style={{ marginBottom: '0.75rem' }}>Chưa có lịch trình hoặc hạn chót nào cho ngày này.</p>
                <button
                  onClick={() => handleOpenCreateAtSlot(selectedWeekDay)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                >
                  <Plus size={14} /> Đặt lịch ngay
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* 1. Task Deadlines */}
                {selectedDayTasks.map(t => {
                  const taskId = t.id || t._id || '';
                  const isOverdue = isTaskOverdue(t);
                  const urgency = getDeadlineUrgency(t);
                  const isDueSoon = urgency === 'DUE_SOON';
                  const isDone = t.status === 'COMPLETED';
                  const pColor = getPriorityColor(t.priority);

                  return (
                    <div
                      key={`mob-task-${taskId}`}
                      onClick={() => setSelectedTaskDetail(t)}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: isDone 
                          ? 'rgba(21, 128, 61, 0.08)' 
                          : isOverdue 
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), #ffffff)' 
                            : isDueSoon
                              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), #ffffff)'
                              : 'linear-gradient(135deg, rgba(21, 128, 61, 0.08), #ffffff)',
                        borderLeft: `4px solid ${isDone ? '#10b981' : isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : pColor}`,
                        borderTop: isDueSoon ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-color)',
                        borderRight: '1px solid var(--border-color)',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: isDone ? '#10b981' : isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : 'var(--accent-primary)',
                            color: '#fff',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            <Target size={9} /> {isDone ? 'ĐÃ XONG' : isOverdue ? 'QUÁ HẠN' : isDueSoon ? 'GẤP < 24H' : 'HẠN CHÓT'}
                          </span>
                          <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: `${pColor}33`, color: pColor, fontWeight: 700 }}>
                            {getPriorityLabel(t.priority)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: isOverdue ? '#fca5a5' : isDueSoon ? '#fbbf24' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Clock size={11} /> Hạn: {t.dueDate ? formatTime(t.dueDate) : ''}
                            {isDueSoon && <span style={{ fontWeight: 700 }}>({formatRemainingTime(t.dueDate!)})</span>}
                          </span>
                        </div>
                        <h5 style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          wordBreak: 'break-word'
                        }}>
                          {t.title}
                        </h5>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleToggleTaskStatus(t, e)}
                        className="btn-icon"
                        style={{ color: isDone ? '#10b981' : 'var(--text-muted)', padding: '0.35rem' }}
                        title={isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                      >
                        {isDone ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </div>
                  );
                })}

                {/* 2. Schedule Events */}
                {selectedDayEvents.map(evt => {
                  const evtId = evt.id || evt._id || '';
                  const color = evt.color || getCategoryColor(evt.category);
                  return (
                    <div
                      key={`mob-evt-${evtId}`}
                      onClick={(e) => handleOpenEditModal(evt, e)}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: `linear-gradient(135deg, ${color}15, #ffffff)`,
                        borderLeft: `4px solid ${color}`,
                        borderTop: '1px solid var(--border-color)',
                        borderRight: '1px solid var(--border-color)',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: color, color: '#fff', fontWeight: 700 }}>
                            {getCategoryLabel(evt.category)}
                          </span>
                          {evt.isRecurring && (
                            <span style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '4px', background: 'rgba(21, 128, 61, 0.15)', color: 'var(--accent-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Repeat size={9} /> {evt.recurrencePattern === 'DAILY' ? 'Ngày' : evt.recurrencePattern === 'MONTHLY' ? 'Tháng' : 'Tuần'}
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Clock size={11} /> {formatTime(evt.startTime)} - {formatTime(evt.endTime)}
                          </span>
                        </div>
                        <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-word' }}>
                          {evt.title}
                        </h5>
                        {evt.description && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', wordBreak: 'break-word' }}>
                            {evt.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEditModal(evt, e)}
                          className="btn-icon"
                          style={{ padding: '0.35rem' }}
                          title="Sửa"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={(e) => promptDeleteEvent(evt, e)}
                          className="btn-icon"
                          style={{ color: '#f87171', padding: '0.35rem' }}
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Desktop View: Full 7-column table */}
        <div className="hide-on-mobile glass-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))', gap: '0.75rem', minWidth: '950px' }}>
            {weekDays.map((day, idx) => {
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, currentDate);
              const dayEvents = resolveEventsForDay(day, filteredEvents);
              dayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
              const dayTasks = resolveTaskDeadlinesForDay(day, tasks);

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenCreateAtSlot(day)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: isToday 
                      ? 'rgba(99, 102, 241, 0.08)' 
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isToday 
                      ? '1px solid rgba(99, 102, 241, 0.5)' 
                      : isSelected 
                        ? '1px solid rgba(255, 255, 255, 0.25)' 
                        : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    minHeight: '520px',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease, background 0.15s ease'
                  }}
                  className="calendar-week-col"
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentDate(day);
                      setViewMode('day');
                    }}
                    style={{
                      textAlign: 'center',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer'
                    }}
                    title="Nhấn để mở chế độ xem ngày chi tiết"
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isToday ? '#818cf8' : 'var(--text-muted)' }}>
                      {dayLabels[idx]}
                    </div>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      margin: '0.25rem auto 0',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      background: isToday ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                      color: isToday ? '#fff' : 'var(--text-main)',
                      boxShadow: isToday ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none'
                    }}>
                      {day.getDate()}
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {/* Task Deadlines in Week Column */}
                    {dayTasks.map(t => {
                      const taskId = t.id || t._id || '';
                      const isOverdue = isTaskOverdue(t);
                      const urgency = getDeadlineUrgency(t);
                      const isDueSoon = urgency === 'DUE_SOON';
                      const isDone = t.status === 'COMPLETED';
                      const pColor = getPriorityColor(t.priority);

                      return (
                        <div
                          key={`desk-task-${taskId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskDetail(t);
                          }}
                          style={{
                            padding: '0.45rem 0.55rem',
                            borderRadius: '6px',
                            background: isDone 
                              ? 'rgba(21, 128, 61, 0.08)' 
                              : isOverdue 
                                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), #ffffff)' 
                                : isDueSoon
                                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), #ffffff)'
                                  : 'linear-gradient(135deg, rgba(21, 128, 61, 0.08), #ffffff)',
                            borderLeft: `3.5px solid ${isDone ? '#10b981' : isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : pColor}`,
                            borderTop: isDueSoon ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-color)',
                            borderRight: '1px solid var(--border-color)',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                            boxShadow: isDueSoon ? '0 2px 8px rgba(245, 158, 11, 0.15)' : 'var(--shadow-card)',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          className="schedule-week-event-card"
                          title={`🎯 Hạn chót: ${t.title} (${t.dueDate ? formatTime(t.dueDate) : ''}) - Nhấn để xem chi tiết`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: isOverdue ? '#ef4444' : isDueSoon ? '#d97706' : 'var(--accent-primary)', fontWeight: 700 }}>
                              <Target size={10} style={{ color: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : 'var(--accent-primary)', flexShrink: 0 }} />
                              <span>{isDueSoon ? '🔥 ' : ''}{t.dueDate ? formatTime(t.dueDate) : 'Hạn chót'}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleToggleTaskStatus(t, e)}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isDone ? '#10b981' : isDueSoon ? '#fbbf24' : 'var(--text-muted)' }}
                              title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu đã xong'}
                            >
                              {isDone ? <CheckSquare size={12} /> : <Square size={12} />}
                            </button>
                          </div>

                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                            textDecoration: isDone ? 'line-through' : 'none',
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {t.title}
                          </div>
                        </div>
                      );
                    })}

                    {/* Schedule Events in Week Column */}
                    {dayEvents.map(evt => {
                      const evtId = evt.id || evt._id || '';
                      const color = evt.color || getCategoryColor(evt.category);
                      return (
                        <div
                          key={`desk-evt-${evtId}`}
                          onClick={(e) => handleOpenEditModal(evt, e)}
                          style={{
                            padding: '0.45rem 0.55rem',
                            borderRadius: '6px',
                            background: `linear-gradient(135deg, ${color}15, #ffffff)`,
                            borderLeft: `3.5px solid ${color}`,
                            borderTop: '1px solid var(--border-color)',
                            borderRight: '1px solid var(--border-color)',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                            boxShadow: 'var(--shadow-card)',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          className="schedule-week-event-card"
                          title={`${evt.title} (${formatTime(evt.startTime)} - ${formatTime(evt.endTime)}) - Nhấn để sửa`}
                        >
                          {/* Top row: Time + Recurring icon & Hover Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              <Clock size={10} style={{ color, flexShrink: 0 }} />
                              <span>{formatTime(evt.startTime)} - {formatTime(evt.endTime)}</span>
                              {evt.isRecurring && (
                                <span title="Lặp lại tự động" style={{ display: 'inline-flex' }}>
                                  <Repeat size={9} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                </span>
                              )}
                            </div>

                            {/* Hover actions */}
                            <div className="week-card-actions" style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={e => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleOpenEditModal(evt, e)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                title="Sửa"
                              >
                                <Edit3 size={11} />
                              </button>
                              <button
                                onClick={(e) => promptDeleteEvent(evt, e)}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '1px' }}
                                title="Xóa"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Title */}
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {evt.title}
                          </div>
                        </div>
                      );
                    })}

                    {dayEvents.length === 0 && dayTasks.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem 0', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.2)' }}>
                        <div>+ Nhấn đặt lịch</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 3. MONTH VIEW (Responsive: 100% width on mobile + selected date event/task sheet)
  // -------------------------------------------------------------
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() + distanceToMonday);

    const calendarDays = Array.from({ length: 35 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });

    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const today = new Date();

    const selectedDayEvents = resolveEventsForDay(selectedMonthDay, filteredEvents);
    selectedDayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const selectedDayTasks = resolveTaskDeadlinesForDay(selectedMonthDay, tasks);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        {/* Month Grid Card (Fits 100% on all screens) */}
        <div className="glass-card" style={{ padding: '0.85rem 0.65rem', width: '100%' }}>
          {/* Day Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            {dayLabels.map((lbl, idx) => (
              <div key={idx} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.2rem 0' }}>
                {lbl}
              </div>
            ))}
          </div>

          {/* Month 7-Cols Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
            {calendarDays.map((day, idx) => {
              const isCurrentMonth = day.getMonth() === month;
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedMonthDay);
              const dayEvents = resolveEventsForDay(day, filteredEvents);
              const dayTasks = resolveTaskDeadlinesForDay(day, tasks);
              const totalItems = dayEvents.length + dayTasks.length;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedMonthDay(day);
                    setCurrentDate(day);
                    setViewMode('day');
                  }}
                  style={{
                    minHeight: '52px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected 
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2))' 
                      : isToday 
                        ? 'rgba(99, 102, 241, 0.1)' 
                        : isCurrentMonth 
                          ? 'rgba(255, 255, 255, 0.02)' 
                          : 'rgba(0, 0, 0, 0.2)',
                    border: isSelected 
                      ? '1.5px solid var(--accent-primary)' 
                      : isToday 
                        ? '1px solid rgba(99, 102, 241, 0.5)' 
                        : '1px solid var(--border-color)',
                    padding: '0.35rem 0.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    opacity: isCurrentMonth ? 1 : 0.4,
                    transition: 'all 0.15s ease'
                  }}
                  className="calendar-month-cell"
                >
                  {/* Date number */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: isToday || isSelected ? 700 : 500,
                      background: isSelected ? 'var(--accent-primary)' : isToday ? '#6366f1' : 'transparent',
                      color: isSelected || isToday ? '#fff' : isCurrentMonth ? 'var(--text-main)' : 'var(--text-dim)'
                    }}>
                      {day.getDate()}
                    </span>

                    {/* Desktop badge */}
                    {totalItems > 0 && (
                      <span className="hide-on-mobile" style={{ fontSize: '0.62rem', padding: '1px 4px', borderRadius: '4px', background: dayTasks.length > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(99, 102, 241, 0.2)', color: dayTasks.length > 0 ? '#fca5a5' : '#818cf8', fontWeight: 600 }}>
                        {totalItems}
                      </span>
                    )}
                  </div>

                  {/* Desktop Previews: Task Deadlines & Events */}
                  <div className="hide-on-mobile" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    {dayTasks.slice(0, 1).map(t => {
                      const taskId = t.id || t._id || '';
                      return (
                        <div
                          key={`month-task-${taskId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskDetail(t);
                          }}
                          style={{
                            fontSize: '0.65rem',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            background: 'rgba(239, 68, 68, 0.25)',
                            borderLeft: '2px solid #ef4444',
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title={`🎯 Hạn chót: ${t.title}`}
                        >
                          <Target size={8} style={{ color: '#f87171', flexShrink: 0 }} />
                          <span>{t.dueDate ? formatTime(t.dueDate) : ''} {t.title}</span>
                        </div>
                      );
                    })}

                    {dayEvents.slice(0, dayTasks.length > 0 ? 1 : 2).map(evt => {
                      const evtId = evt.id || evt._id || '';
                      const color = evt.color || getCategoryColor(evt.category);
                      return (
                        <div
                          key={`month-evt-${evtId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(evt, e);
                          }}
                          style={{
                            fontSize: '0.65rem',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            background: `${color}33`,
                            borderLeft: `2px solid ${color}`,
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title={`${formatTime(evt.startTime)} - ${evt.title}`}
                        >
                          {evt.isRecurring && <Repeat size={8} style={{ color: '#c4b5fd', flexShrink: 0 }} />}
                          <span>{formatTime(evt.startTime)} {evt.title}</span>
                        </div>
                      );
                    })}

                    {totalItems > 2 && (
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        +{totalItems - 2} mốc
                      </div>
                    )}
                  </div>

                  {/* Mobile colorful dots */}
                  <div className="show-on-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginTop: 'auto' }}>
                    {dayTasks.length > 0 && (
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444' }} />
                    )}
                    {dayEvents.slice(0, 2).map((evt, i) => (
                      <span 
                        key={i} 
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: evt.color || getCategoryColor(evt.category)
                        }} 
                      />
                    ))}
                    {totalItems > 3 && (
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)', lineHeight: 1 }}>+</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Detail Sheet below Month Grid */}
        <div className="glass-card show-on-mobile" style={{ padding: '1rem', width: '100%', display: 'none', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                {['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][selectedMonthDay.getDay()]}, {selectedMonthDay.getDate()}/{selectedMonthDay.getMonth() + 1}/{selectedMonthDay.getFullYear()}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {selectedDayEvents.length} lịch trình • {selectedDayTasks.length} hạn chót
              </p>
            </div>
            <button
              onClick={() => handleOpenCreateAtSlot(selectedMonthDay)}
              className="btn btn-primary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              <Plus size={14} /> Thêm Lịch
            </button>
          </div>

          {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>Chưa có lịch trình hoặc hạn chót nào vào ngày này.</p>
              <button
                onClick={() => handleOpenCreateAtSlot(selectedMonthDay)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                <Plus size={14} /> Đặt lịch ngay
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Task Deadlines in Month Mobile Sheet */}
              {selectedDayTasks.map(t => {
                const taskId = t.id || t._id || '';
                const isOverdue = isTaskOverdue(t);
                const isDone = t.status === 'COMPLETED';
                const pColor = getPriorityColor(t.priority);

                return (
                  <div
                    key={`month-mob-task-${taskId}`}
                    onClick={() => setSelectedTaskDetail(t)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: isDone 
                        ? 'rgba(21, 128, 61, 0.08)' 
                        : isOverdue 
                          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), #ffffff)' 
                          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), #ffffff)',
                      borderLeft: `4px solid ${isDone ? '#10b981' : isOverdue ? '#ef4444' : pColor}`,
                      borderTop: '1px solid var(--border-color)',
                      borderRight: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: isDone ? '#10b981' : isOverdue ? '#ef4444' : '#f59e0b',
                          color: '#fff',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <Target size={9} /> {isDone ? 'ĐÃ XONG' : isOverdue ? 'QUÁ HẠN' : 'HẠN CHÓT'}
                        </span>
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: `${pColor}33`, color: pColor, fontWeight: 700 }}>
                          {getPriorityLabel(t.priority)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={11} /> Hạn: {t.dueDate ? formatTime(t.dueDate) : ''}
                        </span>
                      </div>
                      <h5 style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        wordBreak: 'break-word'
                      }}>
                        {t.title}
                      </h5>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleToggleTaskStatus(t, e)}
                      className="btn-icon"
                      style={{ color: isDone ? '#10b981' : 'var(--text-muted)', padding: '0.35rem' }}
                      title={isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                    >
                      {isDone ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </div>
                );
              })}

              {/* Schedule Events in Month Mobile Sheet */}
              {selectedDayEvents.map(evt => {
                const evtId = evt.id || evt._id || '';
                const color = evt.color || getCategoryColor(evt.category);
                return (
                  <div
                    key={`month-mob-evt-${evtId}`}
                    onClick={(e) => handleOpenEditModal(evt, e)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: `linear-gradient(135deg, ${color}15, #ffffff)`,
                      borderLeft: `4px solid ${color}`,
                      borderTop: '1px solid var(--border-color)',
                      borderRight: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: color, color: '#fff', fontWeight: 700 }}>
                          {getCategoryLabel(evt.category)}
                        </span>
                        {evt.isRecurring && (
                          <span style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '4px', background: 'rgba(21, 128, 61, 0.15)', color: 'var(--accent-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Repeat size={9} /> {evt.recurrencePattern === 'DAILY' ? 'Ngày' : evt.recurrencePattern === 'MONTHLY' ? 'Tháng' : 'Tuần'}
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={11} /> {formatTime(evt.startTime)} - {formatTime(evt.endTime)}
                        </span>
                      </div>
                      <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-word' }}>
                        {evt.title}
                      </h5>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEditModal(evt, e)}
                        className="btn-icon"
                        style={{ padding: '0.35rem' }}
                        title="Sửa"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={(e) => promptDeleteEvent(evt, e)}
                        className="btn-icon"
                        style={{ color: '#f87171', padding: '0.35rem' }}
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const suggestedTemplates = [
    { title: 'Họp nhóm đồ án', cat: 'MEETING' as const },
    { title: 'Tập gym / Thể dục', cat: 'HEALTH' as const },
    { title: 'Học bài / Nghiên cứu', cat: 'STUDY' as const },
    { title: 'Code tính năng mới', cat: 'WORK' as const },
    { title: 'Ăn trưa / Nghỉ ngơi', cat: 'PERSONAL' as const },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <style>{`
        .schedule-event-block:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
        }
        .schedule-week-event-card {
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .schedule-week-event-card .week-card-actions {
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .schedule-week-event-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
        }
        .schedule-week-event-card:hover .week-card-actions {
          opacity: 1;
        }
        .calendar-week-col:hover {
          background: rgba(99, 102, 241, 0.06) !important;
          border-color: rgba(99, 102, 241, 0.3) !important;
        }
        .calendar-month-cell:hover {
          border-color: rgba(99, 102, 241, 0.4) !important;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Top Controls: Clean 2-Row Responsive Toolbar */}
      <div className="calendar-toolbar-container">
        {/* Row 1: Date Navigator & Title */}
        <div className="calendar-nav-row">
          <div className="calendar-nav-pill">
            <button
              onClick={handlePrev}
              className="btn-icon"
              title="Khoảng trước"
              style={{ padding: '0.35rem' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleToday}
              className="calendar-today-btn"
            >
              Hôm nay
            </button>
            <button
              onClick={handleNext}
              className="btn-icon"
              title="Khoảng tiếp theo"
              style={{ padding: '0.35rem' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="calendar-date-search-wrapper" title="Nhập hoặc chọn ngày để nhảy đến lịch trình">
            <Search size={14} className="calendar-search-icon" />
            <input
              type="date"
              className="calendar-date-input"
              value={formatLocalDate(currentDate)}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                    const targetDate = new Date(y, m - 1, d);
                    setCurrentDate(targetDate);
                    setViewMode('day');
                  }
                }
              }}
              aria-label="Tìm kiếm ngày"
            />
          </div>

          <h2 className="calendar-title-text">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* Row 2: View Mode Switcher + Category Filter + Add Event CTA */}
        <div className="calendar-actions-row">
          {/* View Mode Segment Switcher */}
          <div className="calendar-segment-control">
            <button
              onClick={() => setViewMode('day')}
              className={`calendar-segment-btn ${viewMode === 'day' ? 'active' : ''}`}
            >
              <CalendarIcon size={14} /> <span>Ngày</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`calendar-segment-btn ${viewMode === 'week' ? 'active' : ''}`}
            >
              <CalendarRange size={14} /> <span>Tuần</span>
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`calendar-segment-btn ${viewMode === 'month' ? 'active' : ''}`}
            >
              <LayoutGrid size={14} /> <span>Tháng</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="calendar-filter-wrapper">
            <Filter size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-input calendar-filter-select"
            >
              <option value="ALL">Tất cả danh mục</option>
              <option value="WORK">Công việc</option>
              <option value="MEETING">Cuộc họp</option>
              <option value="STUDY">Học tập</option>
              <option value="PERSONAL">Cá nhân</option>
              <option value="HEALTH">Sức khỏe</option>
            </select>
          </div>

          {/* Add Button */}
          <button
            onClick={() => handleOpenCreateAtSlot(currentDate)}
            className="btn btn-primary calendar-add-btn"
          >
            <Plus size={15} /> <span>Thêm Lịch</span>
          </button>
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}

      {/* Modal: Create & Edit Schedule Event */}
      {isModalVisible && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: editingEvent 
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.2))' 
                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                  border: `1px solid ${editingEvent ? 'rgba(245, 158, 11, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: editingEvent ? '#f59e0b' : '#818cf8'
                }}>
                  {editingEvent ? <Edit3 size={18} /> : <Clock size={18} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 700, margin: 0 }}>
                    {editingEvent ? 'Chỉnh Sửa Lịch Trình' : 'Thêm Khung Giờ Lịch Trình'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    {newStartTime} - {newEndTime}, Ngày {newDate}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="btn-icon"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Quick Template Chips (Only on Create mode) */}
              {!editingEvent && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Gợi ý nhanh
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {suggestedTemplates.map((tpl, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => {
                          setNewTitle(tpl.title);
                          setNewCategory(tpl.cat);
                        }}
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {tpl.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Tiêu đề sự kiện *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Họp review tiến độ đồ án"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Note / Description */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Ghi chú / Mô tả
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Mục tiêu, địa điểm hoặc link tài liệu..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>

              {/* Date Input */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Ngày diễn ra *
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  required
                />
              </div>

              {/* Time inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Giờ bắt đầu *
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Giờ kết thúc *
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Quick Duration Buttons */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Chọn nhanh thời lượng
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {[15, 30, 45, 60, 90, 120, 180].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => handleSetDuration(mins)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        color: '#818cf8',
                        cursor: 'pointer'
                      }}
                    >
                      {mins < 60 ? `${mins}p` : `${mins / 60}h`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Phân loại sự kiện
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.4rem' }}>
                  {(['WORK', 'MEETING', 'STUDY', 'PERSONAL', 'HEALTH'] as const).map(cat => {
                    const isSelected = newCategory === cat;
                    const color = getCategoryColor(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setNewCategory(cat)}
                        style={{
                          padding: '0.4rem 0.5rem',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${color}` : '1px solid var(--border-color)',
                          background: isSelected ? `${color}22` : 'rgba(255, 255, 255, 0.03)',
                          color: isSelected ? '#fff' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                        {getCategoryLabel(cat)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recurring Schedule Option */}
              <div style={{
                background: isRecurring ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: isRecurring ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.75rem 0.85rem',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isRecurring ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isRecurring ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isRecurring ? '#a78bfa' : 'var(--text-muted)',
                      flexShrink: 0
                    }}>
                      <Repeat size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                        Lặp lại lịch trình tự động
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                        {isRecurring 
                          ? (recurrencePattern === 'WEEKLY' 
                              ? `Tự động lặp vào mỗi ${getWeekdayNameFromDateStr(newDate)} hằng tuần`
                              : recurrencePattern === 'DAILY'
                                ? 'Tự động lặp vào tất cả các ngày'
                                : `Tự động lặp vào ngày ${newDate.split('-')[2] || ''} hằng tháng`)
                          : 'Sự kiện diễn ra duy nhất vào ngày đã chọn'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label style={{ position: 'relative', display: 'inline-block', width: '42px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={e => setIsRecurring(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: isRecurring ? '#8b5cf6' : 'rgba(255, 255, 255, 0.15)',
                      transition: 'all .25s ease',
                      borderRadius: '24px',
                      boxShadow: isRecurring ? '0 0 10px rgba(139, 92, 246, 0.5)' : 'none'
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: isRecurring ? '21px' : '3px',
                        bottom: '3px',
                        backgroundColor: '#fff',
                        transition: 'all .25s ease',
                        borderRadius: '50%',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                      }} />
                    </span>
                  </label>
                </div>

                {isRecurring && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Chu kỳ lặp lại
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => setRecurrencePattern('WEEKLY')}
                        style={{
                          padding: '0.45rem 0.35rem',
                          borderRadius: '6px',
                          border: recurrencePattern === 'WEEKLY' ? '1.5px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: recurrencePattern === 'WEEKLY' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                          color: recurrencePattern === 'WEEKLY' ? '#fff' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        📅 Hằng tuần ({getWeekdayNameFromDateStr(newDate)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecurrencePattern('DAILY')}
                        style={{
                          padding: '0.45rem 0.35rem',
                          borderRadius: '6px',
                          border: recurrencePattern === 'DAILY' ? '1.5px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: recurrencePattern === 'DAILY' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                          color: recurrencePattern === 'DAILY' ? '#fff' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        🔁 Hằng ngày
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecurrencePattern('MONTHLY')}
                        style={{
                          padding: '0.45rem 0.35rem',
                          borderRadius: '6px',
                          border: recurrencePattern === 'MONTHLY' ? '1.5px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: recurrencePattern === 'MONTHLY' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                          color: recurrencePattern === 'MONTHLY' ? '#fff' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        📆 Hằng tháng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                {editingEvent ? (
                  <button
                    type="button"
                    className="btn"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      fontSize: '0.825rem'
                    }}
                    onClick={(e) => promptDeleteEvent(editingEvent, e)}
                  >
                    <Trash2 size={14} /> Xóa sự kiện
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang lưu...' : (editingEvent ? 'Cập Nhật' : 'Lưu Lịch Trình')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Popup (Replaces native browser confirm) */}
      {deleteTargetEvent && (
        <div className="modal-overlay" onClick={() => setDeleteTargetEvent(null)} style={{ zIndex: 1100 }}>
          <div
            className="modal-card"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '430px',
              textAlign: 'center',
              padding: '1.75rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 700, marginBottom: '0.6rem' }}>
              Xác nhận xóa lịch trình?
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa sự kiện <strong style={{ color: '#fff' }}>"{deleteTargetEvent.title}"</strong> ({formatTime(deleteTargetEvent.startTime)} - {formatTime(deleteTargetEvent.endTime)})? Hành động này không thể hoàn tác.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minWidth: '110px' }}
                onClick={() => setDeleteTargetEvent(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{
                  minWidth: '130px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  fontWeight: 600,
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
                }}
                onClick={confirmDeleteEvent}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Task Detail Modal (Opened from any calendar task card) */}
      {selectedTaskDetail && (
        <div className="modal-overlay" onClick={() => setSelectedTaskDetail(null)} style={{ zIndex: 1100 }}>
          <div
            className="modal-card"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444'
                }}>
                  <Target size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, margin: 0 }}>
                    Chi Tiết Hạn Chót Công Việc
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Hạn: {selectedTaskDetail.dueDate ? new Date(selectedTaskDetail.dueDate).toLocaleString('vi-VN') : 'Chưa đặt'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="btn-icon"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Task Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Title & Status */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: `${getPriorityColor(selectedTaskDetail.priority)}33`,
                    color: getPriorityColor(selectedTaskDetail.priority),
                    fontWeight: 700,
                    border: `1px solid ${getPriorityColor(selectedTaskDetail.priority)}66`
                  }}>
                    Độ ưu tiên: {getPriorityLabel(selectedTaskDetail.priority)}
                  </span>

                  <span style={{
                    fontSize: '0.68rem',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: selectedTaskDetail.status === 'COMPLETED' 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : isTaskOverdue(selectedTaskDetail) 
                        ? 'rgba(239, 68, 68, 0.2)' 
                        : getDeadlineUrgency(selectedTaskDetail) === 'DUE_SOON'
                          ? 'rgba(245, 158, 11, 0.25)'
                          : 'rgba(99, 102, 241, 0.2)',
                    color: selectedTaskDetail.status === 'COMPLETED' 
                      ? '#10b981' 
                      : isTaskOverdue(selectedTaskDetail) 
                        ? '#ef4444' 
                        : getDeadlineUrgency(selectedTaskDetail) === 'DUE_SOON'
                          ? '#fbbf24'
                          : '#818cf8',
                    fontWeight: 700
                  }}>
                    {selectedTaskDetail.status === 'COMPLETED' 
                      ? '✓ Đã hoàn thành' 
                      : isTaskOverdue(selectedTaskDetail) 
                        ? '⚠️ Đã quá hạn (Lưu trữ)' 
                        : getDeadlineUrgency(selectedTaskDetail) === 'DUE_SOON'
                          ? `🔥 Hạn chót < 24h (${formatRemainingTime(selectedTaskDetail.dueDate!)})`
                          : selectedTaskDetail.status === 'IN_PROGRESS' 
                            ? '⚡ Đang thực hiện' 
                            : '📋 Cần làm'}
                  </span>
                </div>

                <h4 style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: selectedTaskDetail.status === 'COMPLETED' ? 'var(--text-muted)' : '#fff',
                  textDecoration: selectedTaskDetail.status === 'COMPLETED' ? 'line-through' : 'none',
                  margin: 0
                }}>
                  {selectedTaskDetail.title}
                </h4>

                {selectedTaskDetail.description && (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-dim)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                    {selectedTaskDetail.description}
                  </p>
                )}
              </div>

              {/* Tags */}
              {selectedTaskDetail.tags && selectedTaskDetail.tags.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Thẻ phân loại
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {selectedTaskDetail.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-main)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtask checklist */}
              {selectedTaskDetail.checklist && selectedTaskDetail.checklist.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Danh sách việc con ({selectedTaskDetail.checklist.filter(c => c.completed).length}/{selectedTaskDetail.checklist.length})
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {selectedTaskDetail.checklist.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={async () => {
                          const taskId = selectedTaskDetail.id || selectedTaskDetail._id;
                          if (!taskId) return;
                          try {
                            const updated = await TaskAPI.toggleSubTask(taskId, sub.id);
                            setSelectedTaskDetail(updated);
                            onRefresh();
                          } catch (err: any) {
                            alert(`Lỗi cập nhật việc con: ${err.message}`);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ color: sub.completed ? '#10b981' : 'var(--text-muted)', display: 'flex' }}>
                          {sub.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                        </span>
                        <span style={{
                          fontSize: '0.8rem',
                          color: sub.completed ? 'var(--text-muted)' : '#fff',
                          textDecoration: sub.completed ? 'line-through' : 'none'
                        }}>
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.85rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                marginTop: '0.5rem'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedTaskDetail(null)}
                >
                  Đóng
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    await handleToggleTaskStatus(selectedTaskDetail);
                    setSelectedTaskDetail(prev => prev ? { ...prev, status: prev.status === 'COMPLETED' ? 'TODO' : 'COMPLETED' } : null);
                  }}
                  style={{
                    background: selectedTaskDetail.status === 'COMPLETED' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#fff'
                  }}
                >
                  {selectedTaskDetail.status === 'COMPLETED' ? 'Đánh dấu chưa xong' : '✓ Đánh dấu hoàn thành'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
