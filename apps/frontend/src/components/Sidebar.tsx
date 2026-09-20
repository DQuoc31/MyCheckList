import React, { useState } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Droplets, 
  Wallet, 
  ChevronDown, 
  ChevronRight,
  Flame,
  Layers,
  PieChart,
  Activity
} from 'lucide-react';
import { AnalyticsCategory } from '@mychecklist/shared';

export type AppTab = 'checklist' | 'calendar' | 'habits' | 'finances' | 'analytics';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  analyticsCategory?: AnalyticsCategory;
  setAnalyticsCategory?: (cat: AnalyticsCategory) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  analyticsCategory = 'TASKS',
  setAnalyticsCategory 
}) => {
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(true);

  const menuItems = [
    { id: 'checklist', label: 'Checklist & Sub-tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Lịch trình (Scheduler)', icon: Calendar },
    { id: 'habits', label: 'Thói quen & Tiêu thụ', icon: Droplets },
    { id: 'finances', label: 'Quản lý Thu Chi', icon: Wallet },
    { id: 'analytics', label: 'Thống kê & Năng suất', icon: BarChart3 }
  ] as const;

  const analyticsSubItems: Array<{ id: AnalyticsCategory; label: string; icon: any; color: string }> = [
    { id: 'TASKS', label: 'Thống kê Việc Cần Làm', icon: CheckSquare, color: 'var(--accent-primary)' },
    { id: 'HABITS', label: 'Thống kê Thói Quen', icon: Flame, color: 'var(--accent-warning)' },
    { id: 'FINANCES', label: 'Thống kê Thu Chi', icon: Wallet, color: 'var(--accent-success)' },
    { id: 'OVERVIEW', label: 'Báo Cáo Tổng Quan', icon: Activity, color: 'var(--accent-purple)' }
  ];

  const handleSelectAnalyticsSub = (cat: AnalyticsCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    if (setAnalyticsCategory) {
      setAnalyticsCategory(cat);
    }
    setActiveTab('analytics');
  };

  return (
    <aside style={{
      width: '250px',
      borderRight: '1px solid var(--border-color)',
      background: 'rgba(11, 15, 25, 0.95)',
      padding: '1.5rem 0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      userSelect: 'none',
      overflowY: 'auto'
    }}>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '0 0.75rem 0.5rem 0.75rem'
      }}>
        Menu Quản Lý
      </div>

      {menuItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isAnalytics = item.id === 'analytics';

        return (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <button
              onClick={() => {
                setActiveTab(item.id);
                if (isAnalytics) {
                  setIsAnalyticsExpanded(!isAnalyticsExpanded);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))'
                  : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.88rem',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>

              {isAnalytics && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAnalyticsExpanded(!isAnalyticsExpanded);
                  }}
                  style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}
                >
                  {isAnalyticsExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </div>
              )}
            </button>

            {/* Sub-items for Analytics in Sidebar */}
            {isAnalytics && isAnalyticsExpanded && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem',
                paddingLeft: '1.25rem',
                marginLeft: '0.75rem',
                borderLeft: '1px dashed var(--border-color)',
                marginTop: '0.15rem',
                marginBottom: '0.35rem'
              }}>
                {analyticsSubItems.map(sub => {
                  const SubIcon = sub.icon;
                  const isSubActive = isActive && analyticsCategory === sub.id;

                  return (
                    <button
                      key={sub.id}
                      onClick={(e) => handleSelectAnalyticsSub(sub.id, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: isSubActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                        color: isSubActive ? '#fff' : 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: isSubActive ? 600 : 400,
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <SubIcon size={14} color={isSubActive ? sub.color : 'currentColor'} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sub.label.replace('Thống kê ', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
};
