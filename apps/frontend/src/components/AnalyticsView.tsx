import React, { useState } from 'react';
import {
  ComprehensiveAnalytics,
  AnalyticsSummary,
  FinanceSummary,
  HabitAnalyticsSummary,
  TIME_SLOTS,
  TimeOfDaySlot
} from '@mychecklist/shared';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Flame,
  Target,
  Droplets,
  CheckSquare,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';

import { AnalyticsCategory } from '@mychecklist/shared';

interface AnalyticsViewProps {
  summary: (ComprehensiveAnalytics & AnalyticsSummary) | null;
  activeCategory?: AnalyticsCategory;
  onSelectCategory?: (category: AnalyticsCategory) => void;
}

const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const getSlotIcon = (slot: TimeOfDaySlot) => {
  switch (slot) {
    case 'MORNING': return Sunrise;
    case 'AFTERNOON': return Sun;
    case 'EVENING': return Sunset;
    case 'NIGHT': return Moon;
  }
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  summary,
  activeCategory: externalCategory,
  onSelectCategory
}) => {
  const [internalCategory, setInternalCategory] = useState<AnalyticsCategory>('TASKS');
  const activeCategory = externalCategory ?? internalCategory;

  const handleCategoryChange = (cat: AnalyticsCategory) => {
    setInternalCategory(cat);
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
  };

  if (!summary) {
    return (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p>Đang tổng hợp dữ liệu thống kê đa chuyên mục...</p>
      </div>
    );
  }

  // Normalize data structures
  const taskData: AnalyticsSummary = summary.tasks || {
    totalTasks: summary.totalTasks || 0,
    completedTasks: summary.completedTasks || 0,
    inProgressTasks: summary.inProgressTasks || 0,
    todoTasks: summary.todoTasks || 0,
    completionRate: summary.completionRate || 0,
    totalSubItems: summary.totalSubItems || 0,
    completedSubItems: summary.completedSubItems || 0,
    upcomingEventsCount: summary.upcomingEventsCount || 0,
    highPriorityTasksCount: summary.highPriorityTasksCount || 0
  };

  const financeData: FinanceSummary = summary.finances || {
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    transactionCount: 0,
    byTimeSlot: {
      MORNING: { income: 0, expense: 0, balance: 0, count: 0 },
      AFTERNOON: { income: 0, expense: 0, balance: 0, count: 0 },
      EVENING: { income: 0, expense: 0, balance: 0, count: 0 },
      NIGHT: { income: 0, expense: 0, balance: 0, count: 0 }
    },
    byCategory: []
  };

  const habitData: HabitAnalyticsSummary = summary.habits || {
    totalHabits: 0,
    todayCompletedCount: 0,
    todayCompletionRate: 0,
    totalLoggedEntries: 0,
    habitsStats: []
  };

  // Synchronized 1:1 order with Sidebar (Tasks -> Habits -> Finances -> Overview)
  const categoryTabs = [
    { id: 'TASKS' as const, label: 'Việc Cần Làm', icon: CheckSquare, color: '#6366f1', badge: `${taskData.completionRate}% xong` },
    { id: 'HABITS' as const, label: 'Thói Quen', icon: Flame, color: '#f59e0b', badge: `${habitData.todayCompletedCount}/${habitData.totalHabits} đạt` },
    { id: 'FINANCES' as const, label: 'Thu Chi', icon: Wallet, color: '#10b981', badge: formatVND(financeData.netBalance) },
    { id: 'OVERVIEW' as const, label: 'Tổng Quan', icon: BarChart3, color: '#8b5cf6', badge: 'Tất cả' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Subtitle */}
      <div>
        <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={24} color="var(--accent-primary)" /> Trung Tâm Thống Kê
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Theo dõi độc lập từng chuyên mục: Việc cần làm, Thói quen hàng ngày, Thu chi theo khung giờ hoặc Tổng quan
        </p>
      </div>

      {/* Category Navigation Bar (Synchronized with Sidebar) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.75rem',
        background: 'rgba(0, 0, 0, 0.25)',
        padding: '0.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        {categoryTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleCategoryChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: isActive ? `1px solid ${tab.color}` : '1px solid transparent',
                background: isActive ? `${tab.color}20` : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? `0 4px 14px ${tab.color}25` : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon size={18} color={isActive ? tab.color : 'currentColor'} />
                <span style={{ fontSize: '0.88rem', fontWeight: isActive ? 600 : 500 }}>
                  {tab.label}
                </span>
              </div>
              <span style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '999px',
                background: isActive ? tab.color : 'rgba(255, 255, 255, 0.08)',
                color: isActive ? '#fff' : 'var(--text-dim)',
                fontWeight: 600
              }}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. THỐNG KÊ THU CHI (FINANCES ANALYTICS) */}
      {/* ========================================================================= */}
      {activeCategory === 'FINANCES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
          {/* 4 Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Tổng Thu Nhập</span>
                <ArrowUpRight size={18} color="var(--accent-success)" />
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                {formatVND(financeData.totalIncome)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Từ các nguồn lương, thưởng, đầu tư
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Tổng Chi Tiêu</span>
                <ArrowDownRight size={18} color="var(--accent-danger)" />
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--accent-danger)' }}>
                {formatVND(financeData.totalExpense)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Chi tiêu qua các khung giờ trong ngày
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Số Dư Ròng</span>
                <DollarSign size={18} color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 700, color: financeData.netBalance >= 0 ? '#fff' : 'var(--accent-warning)' }}>
                {financeData.netBalance > 0 ? `+${formatVND(financeData.netBalance)}` : formatVND(financeData.netBalance)}
              </div>
              <div style={{ fontSize: '0.75rem', color: financeData.netBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', marginTop: '0.25rem', fontWeight: 500 }}>
                {financeData.netBalance >= 0 ? '✓ Đang thặng dư dòng tiền' : '⚠ Thâm hụt chi tiêu'}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Số Lượng Giao Dịch</span>
                <Wallet size={18} color="var(--accent-purple)" />
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#fff' }}>
                {financeData.transactionCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Ghi nhận trên toàn hệ thống
              </div>
            </div>
          </div>

          {/* Time Slot Flow Analysis Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Breakdown by 4 Time Slots */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sunrise size={18} color="var(--accent-warning)" /> Dòng Tiền Theo 4 Khung Giờ Trong Ngày
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Tỷ lệ phân bổ chi tiêu và thu nhập theo từng ca sáng, chiều, tối và đêm
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {(Object.keys(TIME_SLOTS) as TimeOfDaySlot[]).map((slotKey) => {
                  const config = TIME_SLOTS[slotKey];
                  const Icon = getSlotIcon(slotKey);
                  const slotStat = financeData.byTimeSlot[slotKey] || { income: 0, expense: 0, balance: 0, count: 0 };
                  const expPercent = financeData.totalExpense > 0
                    ? Math.round((slotStat.expense / financeData.totalExpense) * 100)
                    : 0;

                  return (
                    <div key={slotKey}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Icon size={15} color={config.color} />
                          <span style={{ color: '#fff', fontWeight: 600 }}>{config.label}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>({config.timeRange})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--accent-danger)' }}>Chi: {formatVND(slotStat.expense)}</span>
                          <span style={{ color: 'var(--accent-success)' }}>Thu: {formatVND(slotStat.income)}</span>
                        </div>
                      </div>

                      {/* Progress Bar for Expense Proportion */}
                      <div className="progress-container" style={{ height: '8px' }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${expPercent}%`,
                            background: `linear-gradient(90deg, ${config.color}, var(--accent-danger))`
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                        <span>{slotStat.count} giao dịch ({expPercent}% tổng chi)</span>
                        <span style={{ color: slotStat.balance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 500 }}>
                          Chênh lệch: {slotStat.balance > 0 ? `+${formatVND(slotStat.balance)}` : formatVND(slotStat.balance)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieChart size={18} color="var(--accent-info)" /> Phân Bổ Chi Tiêu Theo Danh Mục
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Xếp hạng danh mục chiếm tỷ trọng lớn nhất
              </p>

              {financeData.byCategory.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>
                  Chưa có dữ liệu phân loại danh mục
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '320px', overflowY: 'auto' }}>
                  {financeData.byCategory.slice(0, 6).map((cat, idx) => (
                    <div key={idx} style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#fff', fontWeight: 500 }}>
                          {idx + 1}. {cat.category}
                        </span>
                        <span style={{ color: cat.type === 'INCOME' ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 600 }}>
                          {formatVND(cat.total)} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="progress-container">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${cat.percentage}%`,
                            background: cat.type === 'INCOME' ? 'var(--accent-success)' : 'var(--accent-danger)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. THỐNG KÊ VIỆC CẦN LÀM (TASKS ANALYTICS) */}
      {/* ========================================================================= */}
      {activeCategory === 'TASKS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
          {/* 4 Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Tỷ Lệ Hoàn Thành</span>
                <CheckCircle2 size={18} color="var(--accent-success)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                {taskData.completionRate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                {taskData.completedTasks} / {taskData.totalTasks} công việc đã xong
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sub-tasks Đã Xong</span>
                <Layers size={18} color="var(--accent-purple)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                {taskData.completedSubItems} / {taskData.totalSubItems}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                {taskData.totalSubItems > 0 ? Math.round((taskData.completedSubItems / taskData.totalSubItems) * 100) : 0}% sub-items hoàn tất
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Công Việc Khẩn Cấp / Cao</span>
                <AlertTriangle size={18} color="var(--accent-danger)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-danger)' }}>
                {taskData.highPriorityTasksCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Cần ưu tiên xử lý trước
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-info)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Lịch Trình Đã Đặt</span>
                <Calendar size={18} color="var(--accent-info)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                {taskData.upcomingEventsCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Sự kiện & khung giờ calendar
              </div>
            </div>
          </div>

          {/* Progress & Distribution Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '1.25rem' }}>
                Phân Bổ Trạng Thái Công Việc (Status Breakdown)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Đã hoàn thành (Completed)</span>
                    <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{taskData.completedTasks} tasks</span>
                  </div>
                  <div className="progress-container">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${taskData.totalTasks ? (taskData.completedTasks / taskData.totalTasks) * 100 : 0}%`,
                        background: 'var(--accent-success)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Đang thực hiện (In Progress)</span>
                    <span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>{taskData.inProgressTasks} tasks</span>
                  </div>
                  <div className="progress-container">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${taskData.totalTasks ? (taskData.inProgressTasks / taskData.totalTasks) * 100 : 0}%`,
                        background: 'var(--accent-warning)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Chưa bắt đầu (Todo)</span>
                    <span style={{ color: 'var(--accent-info)', fontWeight: 600 }}>{taskData.todoTasks} tasks</span>
                  </div>
                  <div className="progress-container">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${taskData.totalTasks ? (taskData.todoTasks / taskData.totalTasks) * 100 : 0}%`,
                        background: 'var(--accent-info)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)'
              }}>
                <CheckCircle2 size={44} color="#fff" />
              </div>
              <h4 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.35rem' }}>
                {taskData.completionRate >= 80 ? '🌟 Năng Suất Tuyệt Vời!' : taskData.completionRate >= 50 ? '⚡ Tiến Độ Tốt!' : '💪 Tiếp Tục Cố Gắng!'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto' }}>
                Bạn đã hoàn tất {taskData.completedTasks} trên tổng số {taskData.totalTasks} đầu việc đã lên kế hoạch.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. THỐNG KÊ THÓI QUEN (HABITS ANALYTICS) */}
      {/* ========================================================================= */}
      {activeCategory === 'HABITS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
          {/* 4 Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Đạt Mục Tiêu Hôm Nay</span>
                <Target size={18} color="var(--accent-warning)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-warning)' }}>
                {habitData.todayCompletedCount} / {habitData.totalHabits}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                {habitData.todayCompletionRate}% thói quen đã hoàn thành hôm nay
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Chuỗi Kỷ Lục (Streak)</span>
                <Flame size={18} color="var(--accent-danger)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                {habitData.habitsStats.length > 0 ? Math.max(...habitData.habitsStats.map(h => h.currentStreak), 0) : 0} ngày
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Chuỗi ngày duy trì liên tiếp cao nhất
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-info)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Tổng Số Thói Quen</span>
                <Droplets size={18} color="var(--accent-info)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                {habitData.totalHabits}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Thói quen đang được theo dõi
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Lượt Ghi Nhận Lịch Sử</span>
                <Sparkles size={18} color="var(--accent-success)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                {habitData.totalLoggedEntries}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Nhật ký tiêu thụ & hoạt động
              </div>
            </div>
          </div>

          {/* Habits Performance Table */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '1rem' }}>
              Chi Tiết Tiến Độ Từng Thói Quen
            </h3>

            {habitData.habitsStats.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>
                Chưa có thói quen nào được tạo
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {habitData.habitsStats.map(h => {
                  const isAchieved = h.todayValue >= h.dailyTarget;
                  return (
                    <div
                      key={h.id}
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                            {h.title}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            background: isAchieved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: isAchieved ? 'var(--accent-success)' : 'var(--accent-warning)',
                            fontWeight: 600
                          }}>
                            {isAchieved ? '✓ Đạt mục tiêu' : `Đang thực hiện ${h.todayValue}/${h.dailyTarget} ${h.unit}`}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-danger)' }}>
                            <Flame size={14} /> Chuỗi: <strong>{h.currentStreak} ngày</strong>
                          </span>
                          <span style={{ color: 'var(--text-dim)' }}>
                            Đã ghi {h.totalLoggedDays} ngày
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="progress-container">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${h.completionRate}%`,
                            background: isAchieved
                              ? 'var(--accent-success)'
                              : 'linear-gradient(90deg, var(--accent-primary), var(--accent-warning))'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BÁO CÁO TỔNG QUAN (ALL-IN-ONE OVERVIEW) */}
      {/* ========================================================================= */}
      {activeCategory === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {/* Executive Tasks Summary Card */}
            <div
              className="glass-card"
              onClick={() => handleCategoryChange('TASKS')}
              style={{ padding: '1.5rem', cursor: 'pointer', borderLeft: '4px solid var(--accent-primary)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckSquare size={20} color="var(--accent-primary)" /> Năng Suất Công Việc
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Xem chi tiết &rarr;</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ hoàn thành:</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{taskData.completionRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Đã xong:</span>
                  <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{taskData.completedTasks} / {taskData.totalTasks} tasks</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cần ưu tiên:</span>
                  <span style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>{taskData.highPriorityTasksCount} khẩn cấp</span>
                </div>
              </div>
            </div>

            {/* Executive Habits Summary Card */}
            <div
              className="glass-card"
              onClick={() => handleCategoryChange('HABITS')}
              style={{ padding: '1.5rem', cursor: 'pointer', borderLeft: '4px solid var(--accent-warning)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={20} color="var(--accent-warning)" /> Rèn Luyện Thói Quen
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Xem chi tiết &rarr;</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Đạt mục tiêu hôm nay:</span>
                  <span style={{ color: 'var(--accent-warning)', fontWeight: 700 }}>{habitData.todayCompletedCount} / {habitData.totalHabits}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ đạt ngày:</span>
                  <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{habitData.todayCompletionRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Lượt log dữ liệu:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{habitData.totalLoggedEntries} lượt</span>
                </div>
              </div>
            </div>

            {/* Executive Finance Summary Card */}
            <div
              className="glass-card"
              onClick={() => handleCategoryChange('FINANCES')}
              style={{ padding: '1.5rem', cursor: 'pointer', borderLeft: '4px solid var(--accent-success)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wallet size={20} color="var(--accent-success)" /> Tài Chính & Thu Chi
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Xem chi tiết &rarr;</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tổng Thu:</span>
                  <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{formatVND(financeData.totalIncome)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tổng Chi:</span>
                  <span style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>{formatVND(financeData.totalExpense)}</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>Số dư ròng:</span>
                  <span style={{ color: financeData.netBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)', fontWeight: 700 }}>
                    {formatVND(financeData.netBalance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
