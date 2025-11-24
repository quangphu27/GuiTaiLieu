import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(username, password);
    
    if (result.success) {
      success('Đăng nhập thành công');
      navigate('/documents');
    } else {
      error(result.error || 'Đăng nhập thất bại');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-wrapper">
              <div className="login-logo">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <rect width="64" height="64" rx="16" fill="#667eea"/>
                  <path d="M32 18L44 26V42C44 44.2091 42.2091 46 40 46H24C21.7909 46 20 44.2091 20 42V26L32 18Z" fill="white" opacity="0.95"/>
                  <path d="M32 18V30M32 30L20 26M32 30L44 26" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <h1>Chào mừng trở lại</h1>
            <p>Đăng nhập để tiếp tục sử dụng hệ thống</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M0 18C0 14.6863 2.68629 12 6 12H14C17.3137 12 20 14.6863 20 18V20H0V18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tên đăng nhập"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="7" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 7V5C6 2.79086 7.79086 1 10 1C12.2091 1 14 2.79086 14 5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu"
                />
              </div>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
              {!loading && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10H16M16 10L12 6M16 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ color: '#718096', fontSize: '14px' }}>
                Chưa có tài khoản?{' '}
                <Link to="/register" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

