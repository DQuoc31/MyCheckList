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
  Activity,
  X
} from 'lucide-react';
import { AnalyticsCategory } from '@mychecklist/shared';

export type AppTab = 'checklist' | 'calendar' | 'habits' | 'finances' | 'analytics';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  analyticsCategory?: AnalyticsCategory;
  setAnalyticsCategory?: (cat: AnalyticsCategory) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  analyticsCategory = 'TASKS',
  setAnalyticsCategory,
  isOpen = false,
  onClose
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

  const handleSelectTab = (id: AppTab) => {
    setActiveTab(id);
    if (id === 'analytics') {
      setIsAnalyticsExpanded(!isAnalyticsExpanded);
    }
    // On mobile, automatically close sidebar after choosing a tab
    if (window.innerWidth <= 768 && onClose && id !== 'analytics') {
      onClose();
    }
  };

  const handleSelectAnalyticsSub = (cat: AnalyticsCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    if (setAnalyticsCategory) {
      setAnalyticsCategory(cat);
    }
    setActiveTab('analytics');
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="sidebar-mobile-backdrop" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'mobile-open' : ''}`}>
        {/* Mobile Header with close button */}
        <div className="sidebar-header">
          <div className="sidebar-title">Menu Quản Lý</div>
          {onClose && (
            <button 
              onClick={onClose}
              className="sidebar-close-btn show-on-mobile"
              aria-label="Đóng menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="sidebar-nav-list">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAnalytics = item.id === 'analytics';

            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <button
                  onClick={() => handleSelectTab(item.id)}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
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
                  <div className="sidebar-sub-menu">
                    {analyticsSubItems.map(sub => {
                      const SubIcon = sub.icon;
                      const isSubActive = isActive && analyticsCategory === sub.id;

                      return (
                        <button
                          key={sub.id}
                          onClick={(e) => handleSelectAnalyticsSub(sub.id, e)}
                          className={`sidebar-sub-btn ${isSubActive ? 'active' : ''}`}
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
        </div>
      </aside>
    </>
  );
};
