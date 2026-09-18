import React, { useState, useEffect } from 'react';
import { ITask, IScheduleEvent, AnalyticsSummary } from '@mychecklist/shared';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChecklistView } from './components/ChecklistView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthPage } from './components/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskAPI, ScheduleAPI, AnalyticsAPI } from './services/api';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'checklist' | 'calendar' | 'analytics'>('checklist');
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [events, setEvents] = useState<IScheduleEvent[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

  const loadAllData = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const [fetchedTasks, fetchedEvents, fetchedAnalytics] = await Promise.all([
        TaskAPI.getAll().catch(() => []),
        ScheduleAPI.getAll().catch(() => []),
        AnalyticsAPI.getSummary().catch(() => null)
      ]);
      setTasks(fetchedTasks);
      setEvents(fetchedEvents);
      setAnalytics(fetchedAnalytics);
    } catch (err) {
      console.error('Failed to load app data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    } else {
      setTasks([]);
      setEvents([]);
      setAnalytics(null);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-main)',
        gap: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Đang khởi tạo ứng dụng...</p>
      </div>
    );
  }

  // If user is not logged in, render the dedicated full AuthPage
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Once authenticated, render main workspace
  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCreateTask={() => setShowCreateTaskModal(true)}
          onOpenCreateEvent={() => setShowCreateEventModal(true)}
        />

        <main className="content-body">
          {activeTab === 'checklist' && (
            <ChecklistView
              tasks={tasks}
              onRefresh={loadAllData}
              showCreateModal={showCreateTaskModal}
              onCloseCreateModal={() => setShowCreateTaskModal(false)}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              events={events}
              onRefresh={loadAllData}
              showCreateModal={showCreateEventModal}
              onCloseCreateModal={() => setShowCreateEventModal(false)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView summary={analytics} />
          )}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
