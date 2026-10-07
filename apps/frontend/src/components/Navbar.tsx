import React from 'react';
import { Plus, LogOut, LogIn, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppTab } from './Sidebar';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenCreateTask: () => void;
  onOpenCreateEvent: () => void;
  onOpenCreateHabit?: () => void;
  onOpenCreateTransaction?: () => void;
  onOpenAuthModal?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onOpenCreateTask,
  onOpenCreateEvent,
  onOpenCreateHabit,
  onOpenCreateTransaction,
  onOpenAuthModal,
  onToggleSidebar
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="app-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Mobile Hamburger Toggle */}
        {onToggleSidebar && (
          <button 
            className="btn-icon show-on-mobile"
            onClick={onToggleSidebar}
            aria-label="Mở menu"
            style={{ padding: '0.5rem', marginRight: '0.2rem' }}
          >
            <Menu size={22} />
          </button>
        )}

        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #15803d, #14532d)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          boxShadow: '0 0 12px rgba(21, 128, 61, 0.35)',
          flexShrink: 0
        }}>
          ✓
        </div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
            CheckFlow
          </h1>
          <p className="hide-on-mobile" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Hệ thống Lập lịch & Checklist
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {isAuthenticated && activeTab === 'checklist' && (
          <button className="btn btn-primary btn-navbar-action" onClick={onOpenCreateTask}>
            <Plus size={16} /> 
            <span className="navbar-btn-text">Thêm Task</span>
          </button>
        )}

        {isAuthenticated && activeTab === 'calendar' && (
          <button className="btn btn-primary btn-navbar-action" onClick={onOpenCreateEvent}>
            <Plus size={16} /> 
            <span className="navbar-btn-text">Đặt Lịch</span>
          </button>
        )}

        {isAuthenticated && activeTab === 'habits' && (
          <button className="btn btn-primary btn-navbar-action" onClick={onOpenCreateHabit}>
            <Plus size={16} /> 
            <span className="navbar-btn-text">Thêm Thói Quen</span>
          </button>
        )}

        {isAuthenticated && activeTab === 'finances' && (
          <button className="btn btn-primary btn-navbar-action" onClick={onOpenCreateTransaction}>
            <Plus size={16} /> 
            <span className="navbar-btn-text">Thu / Chi</span>
          </button>
        )}

        {/* User Profile / Auth Actions */}
        {isAuthenticated && user ? (
          <div className="navbar-user-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #15803d, #14532d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem',
                boxShadow: '0 0 10px rgba(21, 128, 61, 0.25)',
                flexShrink: 0
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hide-on-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Đăng xuất"
              className="btn btn-secondary navbar-logout-btn"
            >
              <LogOut size={14} />
              <span className="hide-on-mobile">Đăng xuất</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="btn btn-primary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
          >
            <LogIn size={15} /> <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
};
