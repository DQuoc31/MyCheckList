import React, { useState, useMemo, useRef } from 'react';
import { IHabitTracker } from '@mychecklist/shared';
import { 
  Flame, 
  ChevronDown, 
  Target, 
  TrendingUp, 
  Award, 
  BarChart2, 
  Zap, 
  Activity,
  CheckCircle2,
  ChevronUp
} from 'lucide-react';

interface HabitContributionHeatmapProps {
  habit: IHabitTracker;
  selectedDate?: string;
  onSelectDate?: (dateStr: string) => void;
  defaultColorTheme?: 'github' | 'habit';
}

interface CellData {
  dateStr: string;
  date: Date;
  value: number;
  target: number;
  percentage: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export const HabitContributionHeatmap: React.FC<HabitContributionHeatmapProps> = ({
  habit,
  selectedDate,
  onSelectDate,
  defaultColorTheme = 'github'
}) => {
  const [colorTheme, setColorTheme] = useState<'github' | 'habit'>(defaultColorTheme);
  const [showSettings, setShowSettings] = useState(false);
  const [showDetailedInsights, setShowDetailedInsights] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{
    data: CellData;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Parse habit history into map for fast O(1) lookup
  const historyMap = useMemo(() => {
    const map = new Map<string, number>();
    if (habit.history) {
      habit.history.forEach(h => {
        map.set(h.date, (map.get(h.date) || 0) + h.value);
      });
    }
    return map;
  }, [habit.history]);

  // Today in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Compute 53 weeks (columns) x 7 days (rows) and extensive summary statistics
  const { 
    weeks, 
    monthLabels, 
    stats, 
    dayOfWeekBreakdown, 
    monthlyBreakdown,
    bestDayOfWeek,
    bestMonth 
  } = useMemo(() => {
    const now = new Date();
    // End date is the end of the current week (Saturday, index 6)
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - currentDayOfWeek));
    endOfWeek.setHours(23, 59, 59, 999);

    // Start date is 52 weeks before the start of the endOfWeek (53 weeks total = 371 days)
    const startDate = new Date(endOfWeek);
    startDate.setDate(endOfWeek.getDate() - (53 * 7 - 1));
    startDate.setHours(0, 0, 0, 0);

    const calculatedWeeks: CellData[][] = [];
    const months: Array<{ label: string; colIndex: number }> = [];

    let totalContributions = 0;
    let daysTargetMet = 0;
    let totalValueYear = 0;
    let activeDaysCount = 0;
    let longestStreak = 0;
    let currentTempStreak = 0;
    let pastYearTotalDays = 0;

    // Day of week trackers: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dowDays = [
      { name: 'Chủ Nhật', short: 'CN', totalLogs: 0, metLogs: 0, totalVal: 0, count: 0 },
      { name: 'Thứ Hai', short: 'T2', totalLogs: 0, metLogs: 0, totalVal: 0, count: 0 },
      { name: 'Thứ Ba', short: 'T3', totalLogs: 0, metLogs: 0, totalVal: 0, count: 0 },
      { name: 'Thứ Tư', short: 'T4', totalLogs: 0, metLogs: 0, totalVal: 0, count: 0 },
      { name: 'Thứ Năm', short: 'T5', totalLogs: 0, metLogs: 0, totalVal: 0, count: 0 },
      { name: 'Thứ Sáu', short: 'T6', totalLogs: 0, metLogs: 0, totalVal: 0, count: 0 },
      { name: 'Thứ Bảy', short: 'T7', totalLogs: 0, metLogs: 0, totalVal: 0, count: 0 }
    ];

    // Monthly tracker (0 to 11)
    const monthStatsMap = new Map<number, { name: string; totalLogs: number; metDays: number; totalVal: number; totalDays: number }>();
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    for (let m = 0; m < 12; m++) {
      monthStatsMap.set(m, { name: monthNames[m], totalLogs: 0, metDays: 0, totalVal: 0, totalDays: 0 });
    }

    let lastMonth = -1;

    for (let w = 0; w < 53; w++) {
      const weekCells: CellData[] = [];
      let weekFirstDayMonth = -1;

      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + (w * 7 + d));

        const y = cellDate.getFullYear();
        const m = String(cellDate.getMonth() + 1).padStart(2, '0');
        const day = String(cellDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;

        const isFuture = cellDate.getTime() > now.getTime();
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === selectedDate;

        const value = isFuture ? 0 : (historyMap.get(dateStr) || 0);
        const target = habit.dailyTarget || 1;
        const percentage = Math.round((value / target) * 100);

        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (!isFuture && value > 0) {
          if (percentage >= 100) level = 4;
          else if (percentage >= 66) level = 3;
          else if (percentage >= 33) level = 2;
          else level = 1;
        }

        // Stats accumulation
        if (!isFuture) {
          pastYearTotalDays++;
          const dayIndex = cellDate.getDay();
          const monthIndex = cellDate.getMonth();

          dowDays[dayIndex].count++;
          const mStat = monthStatsMap.get(monthIndex)!;
          mStat.totalDays++;

          if (value > 0) {
            totalContributions++;
            activeDaysCount++;
            totalValueYear += value;
            dowDays[dayIndex].totalLogs++;
            dowDays[dayIndex].totalVal += value;
            mStat.totalLogs++;
            mStat.totalVal += value;
          }
          if (percentage >= 100) {
            daysTargetMet++;
            currentTempStreak++;
            dowDays[dayIndex].metLogs++;
            mStat.metDays++;
            if (currentTempStreak > longestStreak) {
              longestStreak = currentTempStreak;
            }
          } else {
            currentTempStreak = 0;
          }
        }

        // Track month label
        if (d === 0) {
          weekFirstDayMonth = cellDate.getMonth();
        }

        weekCells.push({
          dateStr,
          date: cellDate,
          value,
          target,
          percentage,
          level,
          isFuture,
          isToday,
          isSelected
        });
      }

      // Check if a new month starts in this week
      if (weekFirstDayMonth !== -1 && weekFirstDayMonth !== lastMonth) {
        const shortMonths = [
          'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6',
          'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'
        ];
        months.push({
          label: shortMonths[weekFirstDayMonth],
          colIndex: w
        });
        lastMonth = weekFirstDayMonth;
      }

      calculatedWeeks.push(weekCells);
    }

    // Current Streak calculation
    let currentStreak = 0;
    const checkDate = new Date(now);
    while (true) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      const val = historyMap.get(key) || 0;
      if (val >= (habit.dailyTarget || 1)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today is not logged yet, check yesterday before stopping
        if (key === todayStr && currentStreak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          if ((historyMap.get(yKey) || 0) >= (habit.dailyTarget || 1)) {
            continue;
          }
        }
        break;
      }
    }

    // Find best Day of Week
    let bestDow = dowDays[1]; // default T2
    let maxDowMetRate = -1;
    dowDays.forEach(d => {
      const rate = d.count > 0 ? (d.metLogs / d.count) : 0;
      if (rate > maxDowMetRate || (rate === maxDowMetRate && d.totalLogs > bestDow.totalLogs)) {
        maxDowMetRate = rate;
        bestDow = d;
      }
    });

    // Find best Month
    let bestM = monthStatsMap.get(0)!;
    let maxMMetRate = -1;
    monthStatsMap.forEach(m => {
      const rate = m.totalDays > 0 ? (m.metDays / m.totalDays) : 0;
      if (rate > maxMMetRate || (rate === maxMMetRate && m.totalVal > bestM.totalVal)) {
        maxMMetRate = rate;
        bestM = m;
      }
    });

    // Averages
    const avgDailyActive = activeDaysCount > 0 ? Math.round(totalValueYear / activeDaysCount) : 0;
    const avgDailyAll = pastYearTotalDays > 0 ? Math.round(totalValueYear / pastYearTotalDays) : 0;
    const completionRate = pastYearTotalDays > 0 ? Math.round((daysTargetMet / pastYearTotalDays) * 100) : 0;
    const activeConsistencyRate = activeDaysCount > 0 ? Math.round((daysTargetMet / activeDaysCount) * 100) : 0;

    return {
      weeks: calculatedWeeks,
      monthLabels: months,
      stats: {
        totalContributions,
        daysTargetMet,
        totalValueYear,
        activeDaysCount,
        longestStreak,
        currentStreak,
        avgDailyActive,
        avgDailyAll,
        completionRate,
        activeConsistencyRate,
        pastYearTotalDays
      },
      dayOfWeekBreakdown: dowDays,
      monthlyBreakdown: Array.from(monthStatsMap.values()),
      bestDayOfWeek: bestDow,
      bestMonth: bestM
    };
  }, [habit.history, habit.dailyTarget, historyMap, todayStr, selectedDate]);

  // Color generator based on selected theme tailored for light & deep dark green
  const getCellColor = (level: 0 | 1 | 2 | 3 | 4) => {
    if (colorTheme === 'habit' && habit.color) {
      const base = habit.color;
      switch (level) {
        case 0: return '#ebf3ed';
        case 1: return `${base}44`; // 27%
        case 2: return `${base}88`; // 53%
        case 3: return `${base}cc`; // 80%
        case 4: return base;        // 100%
      }
    }

    // High contrast Forest Emerald Color Scale (0 to 4)
    switch (level) {
      case 0: return '#ebf3ed'; // Soft empty cell
      case 1: return '#86efac'; // Light emerald (1-32%)
      case 2: return '#22c55e'; // Vibrant green (33-65%)
      case 3: return '#15803d'; // Deep forest green (66-99%)
      case 4: return '#14532d'; // Rich dark emerald (100%+)
    }
  };

  const handleCellMouseEnter = (cell: CellData, e: React.MouseEvent<HTMLDivElement>) => {
    if (cell.isFuture) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    setHoveredCell({
      data: cell,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top
    });
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
  };

  const handleCellClick = (cell: CellData) => {
    if (cell.isFuture) return;
    if (onSelectDate) {
      onSelectDate(cell.dateStr);
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-card)',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header: Total Contributions & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingBottom: '0.65rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
            <strong style={{ color: 'var(--accent-primary)', fontSize: '1.15rem', fontWeight: 800 }}>
              {stats.totalContributions}
            </strong>{' '}
            lần ghi nhận trong 1 năm qua
          </span>
          <span style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '999px',
            background: stats.daysTargetMet > 0 ? 'rgba(21, 128, 61, 0.1)' : 'var(--bg-secondary)',
            color: stats.daysTargetMet > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            border: `1px solid ${stats.daysTargetMet > 0 ? 'rgba(21, 128, 61, 0.25)' : 'var(--border-color)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <CheckCircle2 size={14} /> {stats.daysTargetMet} ngày đạt 100% mục tiêu
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Detailed Insights Toggle Button */}
          <button
            type="button"
            onClick={() => setShowDetailedInsights(!showDetailedInsights)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: showDetailedInsights ? 'rgba(21, 128, 61, 0.12)' : 'var(--bg-secondary)',
              border: `1px solid ${showDetailedInsights ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              color: showDetailedInsights ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart2 size={14} />
            <span>{showDetailedInsights ? 'Thu gọn phân tích' : 'Chi tiết thống kê'}</span>
            {showDetailedInsights ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Theme Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span>Màu sắc</span>
              <ChevronDown size={13} />
            </button>

            {showSettings && (
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem',
                  minWidth: '210px',
                  zIndex: 30,
                  boxShadow: 'var(--shadow-popover)'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', padding: '0 0.4rem' }}>
                  Bảng màu hiển thị:
                </div>
                <button
                  type="button"
                  onClick={() => { setColorTheme('github'); setShowSettings(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.45rem 0.5rem',
                    background: colorTheme === 'github' ? 'rgba(21, 128, 61, 0.1)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: colorTheme === 'github' ? 'var(--accent-primary)' : 'var(--text-main)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#15803d' }} />
                  <span>Xanh lá Rừng (Mặc định)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setColorTheme('habit'); setShowSettings(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.45rem 0.5rem',
                    background: colorTheme === 'habit' ? 'rgba(21, 128, 61, 0.1)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: colorTheme === 'habit' ? (habit.color || 'var(--accent-primary)') : 'var(--text-main)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginTop: '2px'
                  }}
                >
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: habit.color || 'var(--accent-primary)' }} />
                  <span>Màu chủ đạo thói quen</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🌟 Summary Metrics Grid (5 Highlighted Summary Cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.65rem'
      }}>
        {/* Metric 1: Target Completion Rate */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
            <Target size={12} color="var(--accent-primary)" /> Tỷ Lệ Đạt Mục Tiêu
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {stats.completionRate}%
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            {stats.daysTargetMet}/{stats.pastYearTotalDays} ngày năm qua
          </div>
        </div>

        {/* Metric 2: Longest & Current Streak */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
            <Flame size={12} color="var(--accent-warning)" /> Chuỗi Kỷ Lục
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', letterSpacing: '-0.02em' }}>
            {stats.longestStreak} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ngày</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            Hiện tại: <strong style={{ color: 'var(--text-main)' }}>{stats.currentStreak}</strong> ngày
          </div>
        </div>

        {/* Metric 3: Total Accumulated Amount */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
            <TrendingUp size={12} color="var(--accent-primary)" /> Tổng Tích Lũy Năm
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.02em' }}>
            {stats.totalValueYear.toLocaleString('vi-VN')} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{habit.unit}</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            Mục tiêu: {habit.dailyTarget} {habit.unit}/ngày
          </div>
        </div>

        {/* Metric 4: Daily Average */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
            <Zap size={12} color="#0284c7" /> Trung Bình Hoạt Động
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {stats.avgDailyActive.toLocaleString('vi-VN')} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{habit.unit}/ngày</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            {stats.activeDaysCount} ngày có hoạt động
          </div>
        </div>

        {/* Metric 5: Top Performance Day & Month */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
            <Award size={12} color="#db2777" /> Ngày Năng Suất Nhất
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {bestDayOfWeek.name}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            Đạt 100%: <strong style={{ color: 'var(--accent-primary)' }}>{bestDayOfWeek.metLogs}</strong> lần
          </div>
        </div>
      </div>

      {/* Heatmap Matrix with Scroll Container */}
      <div 
        style={{
          overflowX: 'auto',
          padding: '0.4rem 0',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div style={{ minWidth: '720px', display: 'inline-block' }}>
          
          {/* Top Month Labels Header */}
          <div style={{
            display: 'flex',
            position: 'relative',
            height: '18px',
            marginLeft: '32px', // Offset for Mon/Wed/Fri labels
            marginBottom: '4px'
          }}>
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${m.colIndex * 13}px`,
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap'
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid Layout: Left Weekday Labels + Heatmap Cells */}
          <div style={{ display: 'flex', gap: '6px' }}>
            
            {/* Weekday Row Labels (Mon, Wed, Fri) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '91px', // 7 rows * 10px + 6 gaps * 3.5px
              width: '26px',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              textAlign: 'right',
              paddingRight: '4px',
              userSelect: 'none',
              lineHeight: '10px'
            }}>
              <span style={{ marginTop: '13px' }}>T2</span>
              <span style={{ marginTop: '13px' }}>T4</span>
              <span style={{ marginTop: '13px' }}>T6</span>
            </div>

            {/* Weeks Columns (53 columns) */}
            <div style={{
              display: 'flex',
              gap: '3px'
            }}>
              {weeks.map((week, wIdx) => (
                <div 
                  key={wIdx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px'
                  }}
                >
                  {week.map((cell, dIdx) => {
                    const cellColor = getCellColor(cell.level);
                    const isHovered = hoveredCell?.data.dateStr === cell.dateStr;

                    return (
                      <div
                        key={dIdx}
                        onClick={() => handleCellClick(cell)}
                        onMouseEnter={e => handleCellMouseEnter(cell, e)}
                        onMouseLeave={handleCellMouseLeave}
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '2px',
                          backgroundColor: cellColor,
                          border: cell.isSelected 
                            ? '1.5px solid var(--accent-primary-hover)' 
                            : cell.isToday 
                              ? '1.5px solid var(--accent-primary)' 
                              : '1px solid rgba(20, 83, 45, 0.12)',
                          cursor: cell.isFuture ? 'default' : 'pointer',
                          opacity: cell.isFuture ? 0.3 : 1,
                          transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                          transition: 'transform 0.1s ease, outline 0.1s ease',
                          outline: isHovered ? '1.5px solid var(--accent-primary)' : 'none',
                          zIndex: isHovered ? 10 : 1,
                          boxShadow: cell.level === 4 && colorTheme === 'habit'
                            ? `0 0 6px ${habit.color}88`
                            : 'none'
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredCell && (
        <div
          style={{
            position: 'absolute',
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y - 48}px`,
            transform: 'translateX(-50%)',
            background: '#14532d',
            color: '#ffffff',
            border: '1px solid #166534',
            borderRadius: '6px',
            padding: '5px 9px',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            zIndex: 50,
            pointerEvents: 'none',
            boxShadow: 'var(--shadow-popover)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <div style={{ fontWeight: 600, color: '#f0fdf4' }}>
            {hoveredCell.data.value > 0 ? (
              <span>
                <strong>{hoveredCell.data.value.toLocaleString('vi-VN')} {habit.unit}</strong>{' '}
                ({hoveredCell.data.percentage}% mục tiêu)
              </span>
            ) : (
              <span style={{ color: '#bbf7d0' }}>Chưa có ghi nhận</span>
            )}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#86efac' }}>
            {hoveredCell.data.date.toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </div>
        </div>
      )}

      {/* Optional: Expanded In-Depth Breakdown (Day-of-Week & Monthly Analysis) */}
      {showDetailedInsights && (
        <div style={{
          background: 'rgba(20, 83, 45, 0.04)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginTop: '0.25rem'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} color="var(--accent-primary)" /> Bảng Phân Tích Chuyên Sâu Theo Chu Kỳ
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {/* Day of Week Consistency Bars */}
            <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                Hiệu suất theo Thứ trong tuần:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {dayOfWeekBreakdown.map((dow, idx) => {
                  const rate = dow.count > 0 ? Math.round((dow.metLogs / dow.count) * 100) : 0;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.74rem' }}>
                      <span style={{ width: '65px', color: 'var(--text-muted)' }}>{dow.name}</span>
                      <div style={{ flex: 1, background: 'var(--bg-secondary)', height: '6px', borderRadius: '999px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${rate}%`, 
                            height: '100%', 
                            background: rate >= 70 ? 'var(--accent-primary)' : rate >= 40 ? '#0284c7' : '#d97706',
                            borderRadius: '999px' 
                          }} 
                        />
                      </div>
                      <span style={{ width: '55px', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>
                        {dow.metLogs}n ({rate}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Total Volume Chart */}
            <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                Tổng lượng tiêu thụ theo Tháng:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem' }}>
                {monthlyBreakdown.map((m, idx) => {
                  const isTopMonth = m.name === bestMonth.name;
                  return (
                    <div 
                      key={idx} 
                      style={{
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isTopMonth ? 'rgba(21, 128, 61, 0.1)' : 'var(--bg-secondary)',
                        border: isTopMonth ? '1px solid rgba(21, 128, 61, 0.3)' : '1px solid var(--border-color)',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: isTopMonth ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                        {m.totalVal.toLocaleString('vi-VN')}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                        {m.metDays} ngày đạt
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer: Stats & Less/More Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        paddingTop: '0.2rem',
        fontSize: '0.74rem',
        color: 'var(--text-muted)'
      }}>
        {/* Left summary note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>
            Độ đều đặn khi hoạt động: <strong style={{ color: 'var(--accent-primary)' }}>{stats.activeConsistencyRate}%</strong> ngày đạt mục tiêu
          </span>
          <span>
            Bao phủ cả năm: <strong style={{ color: 'var(--text-main)' }}>{stats.activeDaysCount}/{stats.pastYearTotalDays} ngày</strong> ({Math.round((stats.activeDaysCount / (stats.pastYearTotalDays || 1)) * 100)}%)
          </span>
        </div>

        {/* Right Legend: Less [■][■][■][■][■] More */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Ít hơn</span>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center', margin: '0 2px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getCellColor(0), border: '1px solid rgba(20, 83, 45, 0.12)' }} title="0%" />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getCellColor(1) }} title="1% - 32%" />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getCellColor(2) }} title="33% - 65%" />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getCellColor(3) }} title="66% - 99%" />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getCellColor(4) }} title="100%+" />
          </div>
          <span>Nhiều hơn</span>
        </div>
      </div>
    </div>
  );
};
