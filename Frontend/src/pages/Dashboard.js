import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDirector = user?.role === 'director';

  const menuItems = [
    {
      id: 'documents',
      title: 'Quản lý tài liệu',
      description: 'Xem và quản lý tất cả tài liệu',
      icon: '📄',
      path: '/dashboard/documents',
      color: '#667eea'
    },
    {
      id: 'units',
      title: 'Quản lý đơn vị',
      description: 'Quản lý danh sách đơn vị',
      icon: '🏢',
      path: '/dashboard/units',
      color: '#f093fb',
      requireDirector: true
    },
    {
      id: 'users',
      title: 'Quản lý người dùng',
      description: 'Quản lý người dùng và phòng ban',
      icon: '👥',
      path: '/dashboard/users',
      color: '#ff6b6b',
      requireDirector: true
    },
    {
      id: 'departments',
      title: 'Quản lý phòng ban',
      description: 'Quản lý phòng ban và trưởng phòng',
      icon: '🏛️',
      path: '/dashboard/departments',
      color: '#51cf66',
      requireDirector: true
    },
    {
      id: 'history',
      title: 'Lịch sử gửi',
      description: 'Xem lịch sử gửi tài liệu',
      icon: '📋',
      path: '/dashboard/history',
      color: '#4facfe'
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.requireDirector && !isDirector) {
      return false;
    }
    return true;
  });

  return (
    <div className="dashboard-page">
      <Navigation />

      <div className="dashboard-container">
        <h1 className="page-title">Dashboard</h1>
        <div className="dashboard-grid">
          {filteredMenuItems.map(item => (
            <div
              key={item.id}
              className="dashboard-card"
              onClick={() => navigate(item.path)}
              style={{ '--card-color': item.color }}
            >
              <div className="card-icon" style={{ background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}25 100%)` }}>
                <span style={{ fontSize: '48px' }}>{item.icon}</span>
              </div>
              <div className="card-content">
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
              <div className="card-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => navigate('/documents')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Xem danh sách tài liệu
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

