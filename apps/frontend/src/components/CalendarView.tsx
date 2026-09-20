import React, { useState, useMemo } from 'react';
import { IScheduleEvent } from '@mychecklist/shared';
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
  AlertTriangle
} from 'lucide-react';
import { ScheduleAPI } from '../services/api';

interface CalendarViewProps {
  events: IScheduleEvent[];
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
  onRefresh,
  showCreateModal,
  onCloseCreateModal
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal State (Create & Edit)
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IScheduleEvent | null>(null);
  const isModalVisible = showCreateModal || isLocalModalOpen;

  // Custom Delete Confirm Popup State
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<IScheduleEvent | null>(null);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper for formatting local date YYYY-MM-DD
  const formatLocalDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
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

  // Form Submit (Create or Update)
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
          color: getCategoryColor(newCategory)
        });
      } else {
        // Create new event
        await ScheduleAPI.create({
          title: newTitle.trim(),
          description: newDesc.trim(),
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          category: newCategory,
          color: getCategoryColor(newCategory)
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
  // Calculate Time-Proportional Layout for a Day's Events
  // -------------------------------------------------------------
  interface PositionedEvent {
    event: IScheduleEvent;
    top: number;
    height: number;
    left: number;
    width: number;
    startFormatted: string;
    endFormatted: string;
    durationMinutes: number;
  }

  const computeDayPositionedEvents = (dayDate: Date): PositionedEvent[] => {
    const dayEvts = filteredEvents.filter(evt => {
      try {
        return isSameDay(new Date(evt.startTime), dayDate);
      } catch {
        return false;
      }
    });

    if (dayEvts.length === 0) return [];

    // Convert events into minute bounds
    const parsed = dayEvts.map(evt => {
      const s = new Date(evt.startTime);
      const e = new Date(evt.endTime);
      let startMinutes = s.getHours() * 60 + s.getMinutes();
      let endMinutes = e.getHours() * 60 + e.getMinutes();

      if (endMinutes <= startMinutes) {
        endMinutes = startMinutes + 30;
      }

      // Clamp to visible range
      const clampStart = Math.max(START_HOUR * 60, startMinutes);
      const clampEnd = Math.min(END_HOUR * 60, endMinutes);

      const offsetMin = Math.max(0, clampStart - START_HOUR * 60);
      const durationMin = Math.max(25, clampEnd - clampStart);

      const top = (offsetMin / 60) * HOUR_HEIGHT;
      const height = Math.max(34, (durationMin / 60) * HOUR_HEIGHT - 3);

      return {
        event: evt,
        startMinutes,
        endMinutes,
        top,
        height,
        durationMinutes: endMinutes - startMinutes,
        startFormatted: formatTime(evt.startTime),
        endFormatted: formatTime(evt.endTime)
      };
    });

    // Sort by startMinutes, then by duration descending
    parsed.sort((a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes);

    // Compute overlapping column groups
    const positioned: PositionedEvent[] = [];
    const columns: typeof parsed[] = [];

    parsed.forEach(item => {
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
    columns.forEach((colEvents, colIdx) => {
      const colWidth = 100 / totalCols;
      const colLeft = colIdx * colWidth;

      colEvents.forEach(item => {
        positioned.push({
          event: item.event,
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

  // Live Current Time Indicator
  const now = new Date();
  const isCurrentDateToday = isSameDay(currentDate, now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentLiveTop = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const isCurrentLiveVisible = currentMinutes >= START_HOUR * 60 && currentMinutes <= END_HOUR * 60;

  // -------------------------------------------------------------
  // 1. DAY VIEW (Time-Proportional Calendar Timeline)
  // -------------------------------------------------------------
  const renderDayView = () => {
    const positionedEvents = computeDayPositionedEvents(currentDate);
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
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        {/* Banner Helper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Clock size={16} style={{ color: '#818cf8' }} />
            <span>
              Card lịch trình tự động <strong>kéo dài theo thời lượng thực tế</strong>. Nhấn vào card để chỉnh sửa hoặc nhấn vào khoảng trống để tạo mới.
            </span>
          </div>
          <button
            onClick={() => handleOpenCreateAtSlot(currentDate)}
            className="btn btn-primary"
            style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem', whiteSpace: 'nowrap' }}
          >
            <Plus size={15} /> Thêm Lịch Trình
          </button>
        </div>

        {/* Timeline Container */}
        <div style={{
          display: 'flex',
          position: 'relative',
          height: `${TOTAL_HOURS * HOUR_HEIGHT}px`,
          userSelect: 'none'
        }}>
          {/* Left Time Axis Labels */}
          <div style={{
            width: '65px',
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
                    paddingRight: '12px',
                    fontSize: '0.75rem',
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

            {/* Current Live Time Red Line (if today) */}
            {isCurrentDateToday && isCurrentLiveVisible && (
              <div
                style={{
                  position: 'absolute',
                  top: `${currentLiveTop}px`,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: '#ef4444',
                  zIndex: 20,
                  pointerEvents: 'none',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: '-5px',
                  top: '-4px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#ef4444'
                }} />
              </div>
            )}

            {/* Proportional Event Cards */}
            {positionedEvents.map(({ event: evt, top, height, left, width, startFormatted, endFormatted, durationMinutes }) => {
              const evtId = evt.id || evt._id || '';
              const color = evt.color || getCategoryColor(evt.category);
              const isShort = height < 55;

              return (
                <div
                  key={evtId}
                  onClick={(e) => handleOpenEditModal(evt, e)}
                  style={{
                    position: 'absolute',
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `calc(${left}% + 4px)`,
                    width: `calc(${width}% - 8px)`,
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${color}33, rgba(15, 23, 42, 0.94))`,
                    borderLeft: `4px solid ${color}`,
                    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: isShort ? '4px 10px' : '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                    zIndex: 10,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  className="schedule-event-block"
                  title="Nhấn để chỉnh sửa lịch trình này"
                >
                  {/* Top Header Row: Category Badge & Title on Left, Action Buttons at Top-Right */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '1px 6px',
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
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: '#fff',
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
                        gap: '0.25rem',
                        flexShrink: 0,
                        background: 'rgba(0, 0, 0, 0.35)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '6px',
                        padding: '2px 4px',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        className="btn-icon"
                        style={{ padding: '3px', color: '#cbd5e1', borderRadius: '4px' }}
                        onClick={(e) => handleOpenEditModal(evt, e)}
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ padding: '3px', color: '#f87171', borderRadius: '4px' }}
                        onClick={(e) => promptDeleteEvent(evt, e)}
                        title="Xóa lịch trình"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginTop: isShort ? '0px' : '4px'
                  }}>
                    <Clock size={11} style={{ color }} />
                    <span>{startFormatted} - {endFormatted} ({durationMinutes} phút)</span>
                  </div>

                  {/* Description / Notes (if height permits) */}
                  {evt.description && height >= 75 && (
                    <p style={{
                      fontSize: '0.725rem',
                      color: 'rgba(255, 255, 255, 0.65)',
                      margin: '4px 0 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: Math.max(1, Math.floor((height - 65) / 18)),
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {evt.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 2. WEEK VIEW
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

    return (
      <div className="glass-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(150px, 1fr))', gap: '0.75rem', minWidth: '1050px' }}>
          {weekDays.map((day, idx) => {
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, currentDate);
            const dayEvents = filteredEvents.filter(evt => {
              try {
                return isSameDay(new Date(evt.startTime), day);
              } catch {
                return false;
              }
            });

            dayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

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
                {/* Column Header */}
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

                {/* Events list in this day */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {dayEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.2)' }}>
                      <div>+ Nhấn đặt lịch</div>
                    </div>
                  ) : (
                    dayEvents.map(evt => {
                      const evtId = evt.id || evt._id || '';
                      const color = evt.color || getCategoryColor(evt.category);
                      return (
                        <div
                          key={evtId}
                          onClick={(e) => handleOpenEditModal(evt, e)}
                          style={{
                            padding: '0.6rem 0.7rem',
                            borderRadius: '8px',
                            background: `linear-gradient(135deg, ${color}33, rgba(15, 23, 42, 0.7))`,
                            borderLeft: `3px solid ${color}`,
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            borderRight: '1px solid rgba(255,255,255,0.05)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            cursor: 'pointer'
                          }}
                          className="schedule-week-event-card"
                          title="Nhấn để chỉnh sửa"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: color, color: '#fff', fontWeight: 700 }}>
                              {getCategoryLabel(evt.category)}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={e => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleOpenEditModal(evt, e)}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '2px' }}
                                title="Sửa"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={(e) => promptDeleteEvent(evt, e)}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                title="Xóa"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#fff', wordBreak: 'break-word' }}>
                            {evt.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={10} style={{ color }} />
                            <span>{formatTime(evt.startTime)} - {formatTime(evt.endTime)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 3. MONTH VIEW
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

    const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const today = new Date();

    return (
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        {/* Day Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>
          {dayLabels.map((lbl, idx) => (
            <div key={idx} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.4rem 0' }}>
              {lbl}
            </div>
          ))}
        </div>

        {/* Month Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === month;
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, currentDate);
            const dayEvents = filteredEvents.filter(evt => {
              try {
                return isSameDay(new Date(evt.startTime), day);
              } catch {
                return false;
              }
            });

            return (
              <div
                key={idx}
                onClick={() => handleOpenCreateAtSlot(day)}
                style={{
                  minHeight: '105px',
                  borderRadius: 'var(--radius-md)',
                  background: isToday 
                    ? 'rgba(99, 102, 241, 0.12)' 
                    : isCurrentMonth 
                      ? 'rgba(255, 255, 255, 0.02)' 
                      : 'rgba(0, 0, 0, 0.2)',
                  border: isToday 
                    ? '1px solid rgba(99, 102, 241, 0.5)' 
                    : isSelected 
                      ? '1px solid rgba(255, 255, 255, 0.3)' 
                      : '1px solid var(--border-color)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  opacity: isCurrentMonth ? 1 : 0.4,
                  transition: 'all 0.15s ease'
                }}
                className="calendar-month-cell"
              >
                {/* Date number */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: isToday ? 700 : 500,
                    background: isToday ? '#6366f1' : 'transparent',
                    color: isToday ? '#fff' : isCurrentMonth ? 'var(--text-main)' : 'var(--text-dim)'
                  }}>
                    {day.getDate()}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {dayEvents.length > 0 && (
                      <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 600 }}>
                        {dayEvents.length} mốc
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentDate(day);
                        setViewMode('day');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        padding: '1px 4px'
                      }}
                      title="Xem chi tiết ngày"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>

                {/* Event previews in month cell */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                  {dayEvents.slice(0, 3).map(evt => {
                    const evtId = evt.id || evt._id || '';
                    const color = evt.color || getCategoryColor(evt.category);
                    return (
                      <div
                        key={evtId}
                        onClick={(e) => handleOpenEditModal(evt, e)}
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          background: `${color}33`,
                          borderLeft: `2px solid ${color}`,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer'
                        }}
                        title={`${formatTime(evt.startTime)} - ${evt.title}`}
                      >
                        {formatTime(evt.startTime)} {evt.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      +{dayEvents.length - 3} sự kiện
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
        .schedule-week-event-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;
        }
        .calendar-week-col:hover {
          background: rgba(99, 102, 241, 0.06) !important;
          border-color: rgba(99, 102, 241, 0.3) !important;
        }
        .calendar-month-cell:hover {
          border-color: rgba(99, 102, 241, 0.4) !important;
          transform: translateY(-2px);
        }
      `}</style>

      {/* Top Controls: Title, View Switcher, Date Navigator, Category Filter */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.5rem 0'
      }}>
        {/* Left: View Title & Date Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '2px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={handlePrev}
              className="btn-icon"
              title="Khoảng trước"
              style={{ padding: '0.4rem' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleToday}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.4rem 0.75rem',
                cursor: 'pointer'
              }}
            >
              Hôm nay
            </button>
            <button
              onClick={handleNext}
              className="btn-icon"
              title="Khoảng tiếp theo"
              style={{ padding: '0.4rem' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            {getHeaderTitle()}
          </h2>
        </div>

        {/* Right: View Mode Toggle & Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: '36px' }}
            >
              <option value="ALL">Tất cả danh mục</option>
              <option value="WORK">Công việc</option>
              <option value="MEETING">Cuộc họp</option>
              <option value="STUDY">Học tập</option>
              <option value="PERSONAL">Cá nhân</option>
              <option value="HEALTH">Sức khỏe</option>
            </select>
          </div>

          {/* View Mode Buttons */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setViewMode('day')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'day' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                color: viewMode === 'day' ? '#fff' : 'var(--text-muted)'
              }}
            >
              <CalendarIcon size={14} /> Ngày
            </button>
            <button
              onClick={() => setViewMode('week')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'week' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                color: viewMode === 'week' ? '#fff' : 'var(--text-muted)'
              }}
            >
              <CalendarRange size={14} /> Tuần
            </button>
            <button
              onClick={() => setViewMode('month')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'month' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                color: viewMode === 'month' ? '#fff' : 'var(--text-muted)'
              }}
            >
              <LayoutGrid size={14} /> Tháng
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateAtSlot(currentDate)}
            className="btn btn-primary"
            style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem' }}
          >
            <Plus size={15} /> Thêm Lịch
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
    </div>
  );
};
