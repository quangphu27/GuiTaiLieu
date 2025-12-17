import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { authAPI } from '../services/api';
import '../styles/Login.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: showError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setErrors({});
    
    const newErrors = {};
    
    if (!username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }
    
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await authAPI.register(username, password);
      
      if (result.token) {
        await login(username, password);
        success('Đăng ký thành công');
        navigate('/documents');
      }
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
        if (err.message) {
          showError(err.message);
        }
      } else {
        showError(err.message || 'Đăng ký thất bại');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field, value) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    if (field === 'username') {
      setUsername(value);
    } else if (field === 'password') {
      setPassword(value);
    } else if (field === 'confirmPassword') {
      setConfirmPassword(value);
    }
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
            <h1>Đăng ký tài khoản</h1>
            <p>Tạo tài khoản mới để sử dụng hệ thống</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <div className={`input-wrapper ${errors.username ? 'input-error' : ''}`}>
                <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M0 18C0 14.6863 2.68629 12 6 12H14C17.3137 12 20 14.6863 20 18V20H0V18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Tên đăng nhập"
                />
              </div>
              {errors.username && (
                <div className="error-message">{errors.username}</div>
              )}
            </div>

            <div className="form-group">
              <div className={`input-wrapper ${errors.password ? 'input-error' : ''}`}>
                <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="7" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 7V5C6 2.79086 7.79086 1 10 1C12.2091 1 14 2.79086 14 5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Mật khẩu"
                />
              </div>
              {errors.password && (
                <div className="error-message">{errors.password}</div>
              )}
            </div>

            <div className="form-group">
              <div className={`input-wrapper ${errors.confirmPassword ? 'input-error' : ''}`}>
                <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="7" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 7V5C6 2.79086 7.79086 1 10 1C12.2091 1 14 2.79086 14 5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Xác nhận mật khẩu"
                />
              </div>
              {errors.confirmPassword && (
                <div className="error-message">{errors.confirmPassword}</div>
              )}
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              <span>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</span>
              {!loading && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ color: '#718096', fontSize: '14px' }}>
                Đã có tài khoản?{' '}
                <Link to="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

