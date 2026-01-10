import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useNotification } from '../context/NotificationContext';
import { usersAPI } from '../services/api';
import '../styles/UserManagement.css';

const DepartmentEmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [email, setEmail] = useState('');
  const [editEmployee, setEditEmployee] = useState({
    name: '',
    birth_date: '',
    phone: '',
    password: ''
  });
  const [updating, setUpdating] = useState(false);
  const [adding, setAdding] = useState(false);
  const { success, error } = useNotification();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getDepartmentEmployees();
      setEmployees(data);
    } catch (err) {
      error('Lỗi tải danh sách nhân viên: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.username.toLowerCase().includes(searchLower) ||
      (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
      (emp.phone && emp.phone.includes(searchTerm))
    );
  });

  const handleAddEmployee = async () => {
    if (!email) {
      error('Vui lòng nhập email');
      return;
    }

    try {
      setAdding(true);
      await usersAPI.addEmployeeByEmail(email, null);
      success('Thêm nhân viên thành công!');
      setEmail('');
      setIsAddModalOpen(false);
      loadEmployees();
    } catch (err) {
      error('Lỗi thêm nhân viên: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setEditEmployee({
      name: employee.name || '',
      birth_date: employee.birth_date ? employee.birth_date.split('T')[0] : '',
      phone: employee.phone || '',
      password: ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async () => {
    try {
      setUpdating(true);
      const updateData = { ...editEmployee };
      if (!updateData.password) {
        delete updateData.password;
      }
      await usersAPI.updateDepartmentEmployee(editingEmployee.id, updateData);
      success('Cập nhật nhân viên thành công!');
      setIsEditModalOpen(false);
      setEditingEmployee(null);
      setEditEmployee({
        name: '',
        birth_date: '',
        phone: '',
        password: ''
      });
      loadEmployees();
    } catch (err) {
      error('Lỗi cập nhật nhân viên: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này khỏi phòng ban?')) {
      try {
        await usersAPI.deleteDepartmentEmployee(id);
        success('Xóa nhân viên khỏi phòng ban thành công');
        loadEmployees();
      } catch (err) {
        error('Lỗi xóa nhân viên: ' + err.message);
      }
    }
  };

  return (
    <div className="management-page">
      <Navigation />
      <div className="management-container">
        <div className="page-header">
          <h1 className="page-title">Quản lý nhân viên phòng ban</h1>
          <button className="add-unit-btn" onClick={() => setIsAddModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Thêm nhân viên
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
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="units-grid">
          {loading ? (
            <div className="empty-state">
              <p>Đang tải...</p>
            </div>
          ) : (
            <>
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="unit-card">
                  <div className="unit-header">
                    <div className="unit-icon">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect width="32" height="32" rx="8" fill="url(#empGradient)"/>
                        <path d="M16 10C18.2091 10 20 11.7909 20 14C20 16.2091 18.2091 18 16 18C13.7909 18 12 16.2091 12 14C12 11.7909 13.7909 10 16 10Z" fill="white"/>
                        <path d="M10 22C10 19.7909 11.7909 18 14 18H18C20.2091 18 22 19.7909 22 22V24H10V22Z" fill="white"/>
                        <defs>
                          <linearGradient id="empGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#4facfe"/>
                            <stop offset="1" stopColor="#00f2fe"/>
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div className="unit-actions">
                      <button 
                        className="action-btn edit" 
                        onClick={() => handleEdit(emp)}
                        title="Chỉnh sửa"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M11.333 2.00001C11.5084 1.82465 11.7163 1.68576 11.9447 1.59203C12.1731 1.4983 12.4173 1.45166 12.6637 1.45501C12.9101 1.45836 13.1528 1.51163 13.3778 1.61137C13.6028 1.71111 13.8055 1.85519 13.9737 2.03501C14.1419 2.21483 14.2719 2.42698 14.3564 2.65828C14.4409 2.88958 14.4781 3.13526 14.4657 3.38065C14.4533 3.62604 14.3915 3.866 14.2837 4.08501C14.1759 4.30402 14.0246 4.49748 13.8387 4.65334C13.6528 4.8092 13.4363 4.92401 13.2037 4.99001L5.33366 12.86L1.33366 13.86L2.33366 9.86001L10.2037 2.00001H11.333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(emp.id)} title="Xóa">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="unit-content">
                    <h3>{emp.name || emp.username}</h3>
                    <div className="unit-code">Nhân viên</div>
                    <div className="unit-details">
                      <div className="detail-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 2C9.10457 2 10 2.89543 10 4C10 5.10457 9.10457 6 8 6C6.89543 6 6 5.10457 6 4C6 2.89543 6.89543 2 8 2Z" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M4 14C4 11.7909 5.79086 10 8 10C10.2091 10 12 11.7909 12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span>{emp.username}</span>
                      </div>
                      {emp.name && (
                        <div className="detail-item">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M2 16C2 13.7909 3.79086 12 6 12H10C12.2091 12 14 13.7909 14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span>{emp.name}</span>
                        </div>
                      )}
                      {emp.birth_date && (
                        <div className="detail-item">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M2 6H14M5 2V3M11 2V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span>{new Date(emp.birth_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                      {emp.phone && (
                        <div className="detail-item">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H3Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M5 5H11M5 8H11M5 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span>{emp.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {!loading && filteredEmployees.length === 0 && (
          <div className="empty-state">
            <p>Không tìm thấy nhân viên nào</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="add-unit-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="add-unit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-unit-modal-header">
              <h2>Thêm nhân viên qua email</h2>
              <button className="close-button" onClick={() => setIsAddModalOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="add-unit-modal-body">
              <div className="form-group">
                <label htmlFor="employee-email">Email <span className="required">*</span></label>
                <input
                  type="email"
                  id="employee-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhap@email.com"
                />
              </div>
            </div>
            <div className="add-unit-modal-footer">
              <button className="cancel-button" onClick={() => setIsAddModalOpen(false)} disabled={adding}>
                Hủy
              </button>
              <button className="add-button" onClick={handleAddEmployee} disabled={adding}>
                {adding ? 'Đang thêm...' : 'Thêm nhân viên'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingEmployee && (
        <div className="add-unit-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="add-unit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-unit-modal-header">
              <h2>Chỉnh sửa nhân viên</h2>
              <button className="close-button" onClick={() => setIsEditModalOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="add-unit-modal-body">
              <div className="form-group">
                <label htmlFor="edit-emp-name">Họ và tên</label>
                <input
                  type="text"
                  id="edit-emp-name"
                  value={editEmployee.name}
                  onChange={(e) => setEditEmployee({...editEmployee, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-emp-birth-date">Ngày sinh</label>
                <input
                  type="date"
                  id="edit-emp-birth-date"
                  value={editEmployee.birth_date}
                  onChange={(e) => setEditEmployee({...editEmployee, birth_date: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-emp-phone">Số điện thoại</label>
                <input
                  type="tel"
                  id="edit-emp-phone"
                  value={editEmployee.phone}
                  onChange={(e) => setEditEmployee({...editEmployee, phone: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-emp-password">Mật khẩu mới (để trống nếu không đổi)</label>
                <input
                  type="password"
                  id="edit-emp-password"
                  value={editEmployee.password}
                  onChange={(e) => setEditEmployee({...editEmployee, password: e.target.value})}
                />
              </div>
            </div>
            <div className="add-unit-modal-footer">
              <button className="cancel-button" onClick={() => setIsEditModalOpen(false)} disabled={updating}>
                Hủy
              </button>
              <button className="add-button" onClick={handleUpdateEmployee} disabled={updating}>
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentEmployeeManagement;
