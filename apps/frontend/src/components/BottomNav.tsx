import React from 'react';
import { 
  CheckSquare, 
  Calendar, 
  Droplets, 
  Wallet, 
  BarChart3 
} from 'lucide-react';
import { AppTab } from './Sidebar';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'checklist' as AppTab, label: 'Checklist', icon: CheckSquare },
    { id: 'calendar' as AppTab, label: 'Lịch', icon: Calendar },
    { id: 'habits' as AppTab, label: 'Thói quen', icon: Droplets },
    { id: 'finances' as AppTab, label: 'Thu Chi', icon: Wallet },
    { id: 'analytics' as AppTab, label: 'Thống kê', icon: BarChart3 },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-bottom-nav-inner">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="mobile-nav-icon-wrapper">
                <Icon size={20} />
                {isActive && <span className="mobile-nav-indicator" />}
              </div>
              <span className="mobile-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
