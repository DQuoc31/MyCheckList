import React from 'react';
import { Plus, LogOut, User, LogIn } from 'lucide-react';
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
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateTask,
  onOpenCreateEvent,
  onOpenCreateHabit,
  onOpenCreateTransaction,
  onOpenAuthModal
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(17, 24, 39, 0.8)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
        }}>
          ✓
        </div>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            CheckFlow
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Hệ thống Lập lịch & Checklist
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isAuthenticated && activeTab === 'checklist' && (
          <button className="btn btn-primary" onClick={onOpenCreateTask}>
            <Plus size={16} /> Thêm Task Mới
          </button>
        )}

        {isAuthenticated && activeTab === 'calendar' && (
          <button className="btn btn-primary" onClick={onOpenCreateEvent}>
            <Plus size={16} /> Đặt Lịch Mới
          </button>
        )}

        {isAuthenticated && activeTab === 'habits' && (
          <button className="btn btn-primary" onClick={onOpenCreateHabit}>
            <Plus size={16} /> Thêm Thói Quen
          </button>
        )}

        {isAuthenticated && activeTab === 'finances' && (
          <button className="btn btn-primary" onClick={onOpenCreateTransaction}>
            <Plus size={16} /> Thêm Thu / Chi
          </button>
        )}

        {/* User Profile / Auth Actions */}
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Đăng xuất"
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                gap: '0.35rem',
                color: 'var(--text-muted)'
              }}
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <LogIn size={16} /> Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
};
