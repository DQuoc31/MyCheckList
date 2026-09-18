import React, { useState, useMemo } from 'react';
import { IScheduleEvent } from '@mychecklist/shared';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { ScheduleAPI } from '../services/api';

interface CalendarViewProps {
  events: IScheduleEvent[];
  onRefresh: () => void;
  showCreateModal: boolean;
  onCloseCreateModal: () => void;
}

type ViewMode = 'day' | 'week' | 'month';

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onRefresh,
  showCreateModal,
  onCloseCreateModal
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Form states for creating/editing event
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newCategory, setNewCategory] = useState<'WORK' | 'PERSONAL' | 'STUDY' | 'HEALTH' | 'MEETING'>('WORK');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Form Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const [startH, startM] = newStartTime.split(':').map(Number);
      const [endH, endM] = newEndTime.split(':').map(Number);

      const [y, m, d] = newDate.split('-').map(Number);

      const startDate = new Date(y, m - 1, d, startH, startM, 0, 0);
      const endDate = new Date(y, m - 1, d, endH, endM, 0, 0);

      await ScheduleAPI.create({
        title: newTitle.trim(),
        description: newDesc.trim(),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        category: newCategory,
        color: getCategoryColor(newCategory)
      });

      setNewTitle('');
      setNewDesc('');
      onCloseCreateModal();
      onRefresh();
    } catch (err: any) {
      alert(`Lỗi tạo lịch trình: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa lịch trình này?')) return;
    try {
      await ScheduleAPI.delete(id);
      onRefresh();
    } catch (err: any) {
      console.error(err);
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

  // Open modal with pre-selected date
  const openModalForDate = (date: Date) => {
    setNewDate(date.toISOString().split('T')[0]);
    // trigger open create modal through parent or local state
  };

  // -------------------------------------------------------------
  // VIEW RENDERERS
  // -------------------------------------------------------------

  // Title Label
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

  // 1. DAY VIEW
  const renderDayView = () => {
    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00
    const dayEvents = filteredEvents.filter(evt => {
      try {
        return isSameDay(new Date(evt.startTime), currentDate);
      } catch {
        return false;
      }
    });

    return (
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {hours.map(hour => {
            const hourLabel = `${hour < 10 ? '0' + hour : hour}:00`;
            const matchingEvents = dayEvents.filter(evt => {
              try {
                return new Date(evt.startTime).getHours() === hour;
              } catch {
                return false;
              }
            });

            return (
              <div
                key={hour}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '0.75rem 0',
                  borderBottom: '1px dashed rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ width: '60px', fontSize: '0.825rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {hourLabel}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {matchingEvents.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.15)', fontStyle: 'italic', padding: '0.2rem 0' }}>
                      (Trống)
                    </div>
                  ) : (
                    matchingEvents.map(evt => {
                      const evtId = evt.id || evt._id || '';
                      return (
                        <div
                          key={evtId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            background: `linear-gradient(90deg, ${evt.color || '#6366f1'}22, rgba(0,0,0,0.3))`,
                            borderLeft: `4px solid ${evt.color || '#6366f1'}`,
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            borderRight: '1px solid rgba(255,255,255,0.06)',
                            borderBottom: '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: evt.color || '#6366f1', color: '#fff', fontWeight: 600 }}>
                                {getCategoryLabel(evt.category)}
                              </span>
                              <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>
                                {evt.title}
                              </h4>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Clock size={13} />
                              <span>{formatTime(evt.startTime)} - {formatTime(evt.endTime)}</span>
                              {evt.description && <span>• {evt.description}</span>}
                            </div>
                          </div>

                          <button className="btn-icon" style={{ color: 'var(--accent-danger)' }} onClick={(e) => handleDeleteEvent(evtId, e)}>
                            <Trash2 size={16} />
                          </button>
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

  // 2. WEEK VIEW
  const renderWeekView = () => {
    // Calculate 7 days of the current week (Monday to Sunday)
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))', gap: '0.75rem', minWidth: '980px' }}>
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

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: isToday 
                    ? 'rgba(99, 102, 241, 0.08)' 
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isToday 
                    ? '1px solid rgba(99, 102, 241, 0.4)' 
                    : isSelected 
                      ? '1px solid rgba(255, 255, 255, 0.2)' 
                      : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  minHeight: '480px',
                  padding: '0.75rem'
                }}
              >
                {/* Column Header */}
                <div 
                  onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                  style={{
                    textAlign: 'center',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer'
                  }}
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
                    <div style={{ textAlign: 'center', padding: '1rem 0', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.15)' }}>
                      Trống
                    </div>
                  ) : (
                    dayEvents.map(evt => {
                      const evtId = evt.id || evt._id || '';
                      return (
                        <div
                          key={evtId}
                          style={{
                            padding: '0.55rem 0.65rem',
                            borderRadius: '8px',
                            background: `linear-gradient(135deg, ${evt.color || '#6366f1'}33, rgba(0, 0, 0, 0.4))`,
                            borderLeft: `3px solid ${evt.color || '#6366f1'}`,
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            borderRight: '1px solid rgba(255,255,255,0.05)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: evt.color || '#6366f1', color: '#fff', fontWeight: 600 }}>
                              {getCategoryLabel(evt.category)}
                            </span>
                            <button
                              onClick={(e) => handleDeleteEvent(evtId, e)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.4)',
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', wordBreak: 'break-word' }}>
                            {evt.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={10} />
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

  // 3. MONTH VIEW
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    // Start date on the calendar grid
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() + distanceToMonday);

    // Generate 35 or 42 grid cells
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
                onClick={() => {
                  setCurrentDate(day);
                  setViewMode('day');
                }}
                style={{
                  minHeight: '100px',
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
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
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

                  {dayEvents.length > 0 && (
                    <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 600 }}>
                      {dayEvents.length} mốc
                    </span>
                  )}
                </div>

                {/* Event previews in month cell */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                  {dayEvents.slice(0, 2).map(evt => {
                    const evtId = evt.id || evt._id || '';
                    return (
                      <div
                        key={evtId}
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          background: `${evt.color || '#6366f1'}33`,
                          borderLeft: `2px solid ${evt.color || '#6366f1'}`,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {formatTime(evt.startTime)} {evt.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      +{dayEvents.length - 2} sự kiện khác
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}

      {/* Modal Create Schedule Event */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={onCloseCreateModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.25rem', fontWeight: 700 }}>
              Thêm Khung Giờ Lịch Trình
            </h3>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Ghi chú / Mô tả
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Mục tiêu hoặc link tài liệu..."
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Giờ bắt đầu
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
                    Giờ kết thúc
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

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Phân loại sự kiện
                </label>
                <select
                  className="form-input"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                >
                  <option value="WORK">Công việc (Work)</option>
                  <option value="MEETING">Cuộc họp (Meeting)</option>
                  <option value="STUDY">Học tập (Study)</option>
                  <option value="PERSONAL">Cá nhân (Personal)</option>
                  <option value="HEALTH">Sức khỏe (Health)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onCloseCreateModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Đặt Lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
