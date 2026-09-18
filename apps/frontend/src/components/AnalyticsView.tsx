import React from 'react';
import { AnalyticsSummary } from '@mychecklist/shared';
import { BarChart3, CheckCircle2, Clock, AlertTriangle, Layers, Calendar } from 'lucide-react';

interface AnalyticsViewProps {
  summary: AnalyticsSummary | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ summary }) => {
  if (!summary) {
    return (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
        Đang tải dữ liệu thống kê...
      </div>
    );
  }

  const statCards = [
    {
      title: 'Tỷ lệ Hoàn Thành',
      value: `${summary.completionRate}%`,
      subtitle: `${summary.completedTasks} / ${summary.totalTasks} công việc`,
      icon: CheckCircle2,
      color: 'var(--accent-success)',
      glow: 'rgba(16, 185, 129, 0.2)'
    },
    {
      title: 'Sub-tasks Đã Xong',
      value: `${summary.completedSubItems}`,
      subtitle: `trên tổng số ${summary.totalSubItems} sub-items`,
      icon: Layers,
      color: 'var(--accent-purple)',
      glow: 'rgba(139, 92, 246, 0.2)'
    },
    {
      title: 'Công Việc Khẩn Cấp/Cao',
      value: `${summary.highPriorityTasksCount}`,
      subtitle: 'cần ưu tiên xử lý sớm',
      icon: AlertTriangle,
      color: 'var(--accent-danger)',
      glow: 'rgba(239, 68, 68, 0.2)'
    },
    {
      title: 'Sự Kiện Lịch Trình',
      value: `${summary.upcomingEventsCount}`,
      subtitle: 'khung giờ đã được lập',
      icon: Calendar,
      color: 'var(--accent-info)',
      glow: 'rgba(6, 182, 212, 0.2)'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.25rem' }}>
          Thống Kê Năng Suất & Tiến Độ
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Báo cáo hiệu suất công việc và thống kê trạng thái
        </p>
      </div>

      {/* Grid Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {card.title}
                </span>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: card.glow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color
                }}>
                  <Icon size={18} />
                </div>
              </div>

              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                {card.value}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {card.subtitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overview Progress & Monorepo Architecture Box */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>
            Phân Bổ Trạng Thái Công Việc
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Đã hoàn thành</span>
                <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{summary.completedTasks} tasks</span>
              </div>
              <div className="progress-container">
                <div className="progress-fill" style={{ width: `${summary.totalTasks ? (summary.completedTasks / summary.totalTasks) * 100 : 0}%`, background: 'var(--accent-success)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Đang thực hiện</span>
                <span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>{summary.inProgressTasks} tasks</span>
              </div>
              <div className="progress-container">
                <div className="progress-fill" style={{ width: `${summary.totalTasks ? (summary.inProgressTasks / summary.totalTasks) * 100 : 0}%`, background: 'var(--accent-warning)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Chưa bắt đầu</span>
                <span style={{ color: 'var(--accent-info)', fontWeight: 600 }}>{summary.todoTasks} tasks</span>
              </div>
              <div className="progress-container">
                <div className="progress-fill" style={{ width: `${summary.totalTasks ? (summary.todoTasks / summary.totalTasks) * 100 : 0}%`, background: 'var(--accent-info)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
