import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useNotification } from '../context/NotificationContext';
import { usersAPI, departmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/UserManagement.css';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'employee',
    department_id: ''
  });
  const [editUser, setEditUser] = useState({
    username: '',
    password: '',
    role: 'employee',
    department_id: ''
  });
  const [updating, setUpdating] = useState(false);
  const { success, error } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, deptsData] = await Promise.all([
        usersAPI.getAll(),
        departmentsAPI.getAll()
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
    } catch (err) {
      error('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await usersAPI.delete(id);
        success('Xóa người dùng thành công');
        loadData();
      } catch (err) {
        error('Lỗi xóa người dùng: ' + err.message);
      }
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (newUser.role === 'department_head' && !newUser.department_id) {
      error('Trưởng phòng phải có phòng ban');
      return;
    }

    try {
      await usersAPI.create(newUser);
      success('Thêm người dùng mới thành công!');
      setNewUser({
        username: '',
        password: '',
        role: 'employee',
        department_id: ''
      });
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      error('Lỗi thêm người dùng: ' + err.message);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setNewUser({
      username: '',
      password: '',
      role: 'employee',
      department_id: ''
    });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditUser({
      username: user.username,
      password: '',
      role: user.role,
      department_id: user.department_id || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUser.username) {
      error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (editUser.role === 'department_head' && !editUser.department_id) {
      error('Trưởng phòng phải có phòng ban');
      return;
    }

    try {
      setUpdating(true);
      const updateData = { ...editUser };
      if (!updateData.password) {
        delete updateData.password;
      }
      await usersAPI.update(editingUser.id, updateData);
      success('Cập nhật người dùng thành công!');
      setIsEditModalOpen(false);
      setEditingUser(null);
      setEditUser({
        username: '',
        password: '',
        role: 'employee',
        department_id: ''
      });
      loadData();
    } catch (err) {
      error('Lỗi cập nhật người dùng: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditUser({
      username: '',
      password: '',
      role: 'employee',
      department_id: ''
    });
  };

  const getDepartmentName = (departmentId) => {
    if (!departmentId) return 'Không có';
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'Không tìm thấy';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'director': 'Giám đốc',
      'department_head': 'Trưởng phòng',
      'employee': 'Nhân viên'
    };
    return labels[role] || role;
  };

  return (
    <div className="management-page">
      <Navigation />
      <div className="management-container">
        <div className="page-header">
          <h1 className="page-title">Quản lý người dùng</h1>
          <button className="add-unit-btn" onClick={() => setIsAddModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Thêm người dùng
          </button>
        </div>
        <div className="filters-section">
          <div className="search-box">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-label">Vai trò:</div>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterRole === 'all' ? 'active' : ''}`}
                onClick={() => setFilterRole('all')}
              >
                Tất cả
              </button>
              <button
                className={`filter-btn ${filterRole === 'director' ? 'active' : ''}`}
                onClick={() => setFilterRole('director')}
              >
                Giám đốc
              </button>
              <button
                className={`filter-btn ${filterRole === 'department_head' ? 'active' : ''}`}
                onClick={() => setFilterRole('department_head')}
              >
                Trưởng phòng
              </button>
              <button
                className={`filter-btn ${filterRole === 'employee' ? 'active' : ''}`}
                onClick={() => setFilterRole('employee')}
              >
                Nhân viên
              </button>
            </div>
          </div>
        </div>

        <div className="units-grid">
          {loading ? (
            <div className="empty-state">
              <p>Đang tải...</p>
            </div>
          ) : (
            <>
              {filteredUsers.map(user => (
            <div key={user.id} className="unit-card">
              <div className="unit-header">
                <div className="unit-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#userGradient)"/>
                    <path d="M16 10C18.2091 10 20 11.7909 20 14C20 16.2091 18.2091 18 16 18C13.7909 18 12 16.2091 12 14C12 11.7909 13.7909 10 16 10Z" fill="white"/>
                    <path d="M10 22C10 19.7909 11.7909 18 14 18H18C20.2091 18 22 19.7909 22 22V24H10V22Z" fill="white"/>
                    <defs>
                      <linearGradient id="userGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ff6b6b"/>
                        <stop offset="1" stopColor="#ee5a6f"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="unit-actions">
                  <button 
                    className="action-btn edit" 
                    onClick={() => handleEdit(user)}
                    title="Chỉnh sửa"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.333 2.00001C11.5084 1.82465 11.7163 1.68576 11.9447 1.59203C12.1731 1.4983 12.4173 1.45166 12.6637 1.45501C12.9101 1.45836 13.1528 1.51163 13.3778 1.61137C13.6028 1.71111 13.8055 1.85519 13.9737 2.03501C14.1419 2.21483 14.2719 2.42698 14.3564 2.65828C14.4409 2.88958 14.4781 3.13526 14.4657 3.38065C14.4533 3.62604 14.3915 3.866 14.2837 4.08501C14.1759 4.30402 14.0246 4.49748 13.8387 4.65334C13.6528 4.8092 13.4363 4.92401 13.2037 4.99001L5.33366 12.86L1.33366 13.86L2.33366 9.86001L10.2037 2.00001H11.333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {user.id !== currentUser?.id && (
                    <button className="action-btn delete" onClick={() => handleDelete(user.id)} title="Xóa">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="unit-content">
                <h3>{user.username}</h3>
                <div className="unit-code">{getRoleLabel(user.role)}</div>
                <div className="unit-details">
                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 9C9.65685 9 11 7.65685 11 6C11 4.34315 9.65685 3 8 3C6.34315 3 5 4.34315 5 6C5 7.65685 6.34315 9 8 9Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 13C2 11.3431 4.68629 10 8 10C11.3137 10 14 11.3431 14 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Phòng ban: {getDepartmentName(user.department_id)}</span>
                  </div>
                </div>
              </div>
            </div>
              ))}
            </>
          )}
        </div>

        {!loading && filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>Không tìm thấy người dùng nào</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="add-unit-modal-overlay" onClick={handleCloseModal}>
          <div className="add-unit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-unit-modal-header">
              <h2>Thêm người dùng mới</h2>
              <button className="close-button" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="add-unit-modal-body">
              <div className="form-group">
                <label htmlFor="user-username">Tên đăng nhập <span className="required">*</span></label>
                <input
                  type="text"
                  id="user-username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="user-password">Mật khẩu <span className="required">*</span></label>
                <input
                  type="password"
                  id="user-password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="user-role">Vai trò <span className="required">*</span></label>
                <select
                  id="user-role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value, department_id: e.target.value === 'department_head' ? newUser.department_id : ''})}
                  style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px' }}
                >
                  <option value="employee">Nhân viên</option>
                  <option value="department_head">Trưởng phòng</option>
                </select>
              </div>

              {newUser.role === 'department_head' && (
                <div className="form-group">
                  <label htmlFor="user-department">Phòng ban <span className="required">*</span></label>
                  <select
                    id="user-department"
                    value={newUser.department_id}
                    onChange={(e) => setNewUser({...newUser, department_id: e.target.value})}
                    style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px' }}
                  >
                    <option value="">Chọn phòng ban</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {newUser.role === 'employee' && (
                <div className="form-group">
                  <label htmlFor="user-department">Phòng ban</label>
                  <select
                    id="user-department"
                    value={newUser.department_id}
                    onChange={(e) => setNewUser({...newUser, department_id: e.target.value})}
                    style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px' }}
                  >
                    <option value="">Không có</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="add-unit-modal-footer">
              <button className="cancel-button" onClick={handleCloseModal}>
                Hủy
              </button>
              <button className="add-button" onClick={handleAddUser}>
                Thêm mới
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingUser && (
        <div className="add-unit-modal-overlay" onClick={handleCloseEditModal}>
          <div className="add-unit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-unit-modal-header">
              <h2>Chỉnh sửa người dùng</h2>
              <button className="close-button" onClick={handleCloseEditModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="add-unit-modal-body">
              <div className="form-group">
                <label htmlFor="edit-user-username">Tên đăng nhập <span className="required">*</span></label>
                <input
                  type="text"
                  id="edit-user-username"
                  value={editUser.username}
                  onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-user-password">Mật khẩu mới (để trống nếu không đổi)</label>
                <input
                  type="password"
                  id="edit-user-password"
                  value={editUser.password}
                  onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-user-role">Vai trò <span className="required">*</span></label>
                <select
                  id="edit-user-role"
                  value={editUser.role}
                  onChange={(e) => setEditUser({...editUser, role: e.target.value, department_id: e.target.value === 'department_head' ? editUser.department_id : ''})}
                  style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px' }}
                >
                  <option value="employee">Nhân viên</option>
                  <option value="department_head">Trưởng phòng</option>
                </select>
              </div>

              {editUser.role === 'department_head' && (
                <div className="form-group">
                  <label htmlFor="edit-user-department">Phòng ban <span className="required">*</span></label>
                  <select
                    id="edit-user-department"
                    value={editUser.department_id}
                    onChange={(e) => setEditUser({...editUser, department_id: e.target.value})}
                    style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px' }}
                  >
                    <option value="">Chọn phòng ban</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {editUser.role === 'employee' && (
                <div className="form-group">
                  <label htmlFor="edit-user-department">Phòng ban</label>
                  <select
                    id="edit-user-department"
                    value={editUser.department_id}
                    onChange={(e) => setEditUser({...editUser, department_id: e.target.value})}
                    style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px' }}
                  >
                    <option value="">Không có</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="add-unit-modal-footer">
              <button className="cancel-button" onClick={handleCloseEditModal} disabled={updating}>
                Hủy
              </button>
              <button className="add-button" onClick={handleUpdateUser} disabled={updating}>
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
