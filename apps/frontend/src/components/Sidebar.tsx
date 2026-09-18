import React from 'react';
import { CheckSquare, Calendar, BarChart3, Layers } from 'lucide-react';

interface SidebarProps {
  activeTab: 'checklist' | 'calendar' | 'analytics';
  setActiveTab: (tab: 'checklist' | 'calendar' | 'analytics') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'checklist', label: 'Checklist & Sub-tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Lịch trình (Scheduler)', icon: Calendar },
    { id: 'analytics', label: 'Thống kê & Năng suất', icon: BarChart3 }
  ] as const;

  return (
    <aside style={{
      width: '240px',
      borderRight: '1px solid var(--border-color)',
      background: 'rgba(11, 15, 25, 0.9)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '0 0.5rem 0.5rem 0.5rem'
      }}>
        Menu Quản Lý
      </div>

      {menuItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: isActive
                ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))'
                : 'transparent',
              color: isActive ? '#fff' : 'var(--text-muted)',
              borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.9rem',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <Icon size={18} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
            {item.label}
          </button>
        );
      })}
    </aside>
  );
};
