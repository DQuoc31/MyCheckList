import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  UserPlus, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  BarChart3, 
  Sparkles,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        if (!name.trim()) {
          throw new Error('Vui lòng nhập họ và tên của bạn.');
        }
        await register({ name, email, password });
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top left, rgba(21, 128, 61, 0.08), transparent 60%), radial-gradient(ellipse at bottom right, rgba(15, 118, 110, 0.08), transparent 60%), var(--bg-primary)',
      padding: '1.5rem 1rem',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1080px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2.5rem',
        alignItems: 'center'
      }}>
        
        {/* Left Side: Brand & Features */}
        <div style={{ padding: '1rem' }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #15803d, #14532d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: 800,
              boxShadow: '0 0 25px rgba(21, 128, 61, 0.35)'
            }}>
              ✓
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                CheckFlow
              </h1>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Productivity & Schedule Platform
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.25, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Quản lý công việc & lịch trình <br />
            <span style={{
              background: 'linear-gradient(135deg, #15803d, #047857)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              thông minh và tập trung
            </span>
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Đồng bộ hóa các nhiệm vụ hàng ngày, lập kế hoạch time-blocking trên lịch biểu và theo dõi năng suất cá nhân với cơ sở dữ liệu đám mây bảo mật.
          </p>

          {/* Feature Highlights Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1.1rem',
              borderRadius: '16px',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{
                padding: '0.6rem',
                borderRadius: '10px',
                background: 'rgba(21, 128, 61, 0.12)',
                color: '#15803d'
              }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  Checklist Phân cấp & Tags
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.4 }}>
                  Tạo task kèm các sub-tasks chi tiết, gán nhãn, độ ưu tiên và thời hạn rõ ràng.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1.1rem',
              borderRadius: '16px',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{
                padding: '0.6rem',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981'
              }}>
                <Calendar size={20} />
              </div>
              <div>
                <h4 style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  Lịch biểu Time-Blocking
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.4 }}>
                  Khóa các khung giờ trong ngày theo tuần và tháng để tập trung sâu (Deep Work).
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1.1rem',
              borderRadius: '16px',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{
                padding: '0.6rem',
                borderRadius: '10px',
                background: 'rgba(15, 118, 110, 0.12)',
                color: '#0f766e'
              }}>
                <BarChart3 size={20} />
              </div>
              <div>
                <h4 style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  Báo cáo Hiệu suất & Tiến độ
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.4 }}>
                  Tự động tính toán tỷ lệ hoàn thành, thời gian ước tính và khối lượng công việc.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div style={{
          background: '#ffffff',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-popover)',
          borderRadius: '28px',
          padding: '2.5rem 2.25rem',
          position: 'relative'
        }}>
          {/* Card Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              background: 'rgba(21, 128, 61, 0.1)',
              border: '1px solid rgba(21, 128, 61, 0.25)',
              color: '#15803d',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '1rem'
            }}>
              <ShieldCheck size={14} /> JWT Secured & Multi-user Isolation
            </div>
            <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {mode === 'login' 
                ? 'Nhập thông tin tài khoản để truy cập workspace của bạn' 
                : 'Đăng ký nhanh chóng để bắt đầu tổ chức công việc'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: '#f1f5f3',
            padding: '4px',
            borderRadius: '14px',
            marginBottom: '1.75rem',
            border: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: mode === 'login' ? 'linear-gradient(135deg, #15803d, #14532d)' : 'transparent',
                color: mode === 'login' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: mode === 'login' ? '0 4px 14px rgba(21, 128, 61, 0.3)' : 'none'
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: mode === 'register' ? 'linear-gradient(135deg, #15803d, #14532d)' : 'transparent',
                color: mode === 'register' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: mode === 'register' ? '0 4px 14px rgba(21, 128, 61, 0.3)' : 'none'
              }}
            >
              Đăng ký
            </button>
          </div>

          {/* Error Alert Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#dc2626',
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                  Họ và Tên
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '42px', height: '44px' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                Địa chỉ Email
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px', height: '44px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px', paddingRight: '42px', height: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                marginTop: '0.75rem',
                height: '46px',
                fontSize: '0.95rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.75 : 1,
                borderRadius: '12px'
              }}
            >
              {submitting ? (
                <span>Đang xử lý...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn size={18} /> Đăng nhập
                </>
              ) : (
                <>
                  <UserPlus size={18} /> Hoàn tất đăng ký
                </>
              )}
            </button>
          </form>

          {/* Switch link */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {mode === 'login' ? (
              <span>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Tạo tài khoản mới
                </button>
              </span>
            ) : (
              <span>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Đăng nhập ngay
                </button>
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
