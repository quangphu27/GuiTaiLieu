import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useNotification } from '../context/NotificationContext';
import { departmentsAPI, usersAPI } from '../services/api';
import '../styles/DepartmentManagement.css';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    head_id: ''
  });
  const [editDepartment, setEditDepartment] = useState({
    name: '',
    description: '',
    head_id: ''
  });
  const [updating, setUpdating] = useState(false);
  const { success, error } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptsData, usersData] = await Promise.all([
        departmentsAPI.getAll(),
        usersAPI.getAll()
      ]);
      setDepartments(deptsData);
      setUsers(usersData);
    } catch (err) {
      error('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(dept => {
    return dept.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
      try {
        await departmentsAPI.delete(id);
        success('Xóa phòng ban thành công');
        loadData();
      } catch (err) {
        error('Lỗi xóa phòng ban: ' + err.message);
      }
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.name) {
      error('Vui lòng nhập tên phòng ban');
      return;
    }

    try {
      const deptData = { ...newDepartment };
      if (!deptData.head_id) {
        delete deptData.head_id;
      }
      await departmentsAPI.create(deptData);
      success('Thêm phòng ban mới thành công!');
      setNewDepartment({
        name: '',
        description: '',
        head_id: ''
      });
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      error('Lỗi thêm phòng ban: ' + err.message);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setNewDepartment({
      name: '',
      description: '',
      head_id: ''
    });
  };

  const handleEdit = (dept) => {
    setEditingDepartment(dept);
    setEditDepartment({
      name: dept.name,
      description: dept.description || '',
      head_id: dept.head_id || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateDepartment = async () => {
    if (!editDepartment.name) {
      error('Vui lòng nhập tên phòng ban');
      return;
    }

    try {
      setUpdating(true);
      const updateData = { ...editDepartment };
      if (!updateData.head_id) {
        updateData.head_id = null;
      }
      await departmentsAPI.update(editingDepartment.id, updateData);
      success('Cập nhật phòng ban thành công!');
      setIsEditModalOpen(false);
      setEditingDepartment(null);
      setEditDepartment({
        name: '',
        description: '',
        head_id: ''
      });
      loadData();
    } catch (err) {
      error('Lỗi cập nhật phòng ban: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingDepartment(null);
    setEditDepartment({
      name: '',
      description: '',
      head_id: ''
    });
  };

  const getDepartmentHeadName = (headId) => {
    if (!headId) return 'Chưa có';
    const head = users.find(u => u.id === headId);
    return head ? head.username : 'Không tìm thấy';
  };

  const availableHeads = users.filter(u => u.role === 'department_head');

  return (
    <div className="management-page">
      <Navigation />
      <div className="management-container">
        <div className="page-header">
          <h1 className="page-title">Quản lý phòng ban</h1>
          <button className="add-unit-btn" onClick={() => setIsAddModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Thêm phòng ban
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
              placeholder="Tìm kiếm phòng ban..."
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
              {filteredDepartments.map(dept => (
            <div key={dept.id} className="unit-card">
              <div className="unit-header">
                <div className="unit-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#deptGradient)"/>
                    <path d="M8 12H24M8 16H24M8 20H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="deptGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#51cf66"/>
                        <stop offset="1" stopColor="#40c057"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="unit-actions">
                  <button 
                    className="action-btn edit" 
                    onClick={() => handleEdit(dept)}
                    title="Chỉnh sửa"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.333 2.00001C11.5084 1.82465 11.7163 1.68576 11.9447 1.59203C12.1731 1.4983 12.4173 1.45166 12.6637 1.45501C12.9101 1.45836 13.1528 1.51163 13.3778 1.61137C13.6028 1.71111 13.8055 1.85519 13.9737 2.03501C14.1419 2.21483 14.2719 2.42698 14.3564 2.65828C14.4409 2.88958 14.4781 3.13526 14.4657 3.38065C14.4533 3.62604 14.3915 3.866 14.2837 4.08501C14.1759 4.30402 14.0246 4.49748 13.8387 4.65334C13.6528 4.8092 13.4363 4.92401 13.2037 4.99001L5.33366 12.86L1.33366 13.86L2.33366 9.86001L10.2037 2.00001H11.333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="action-btn delete" onClick={() => handleDelete(dept.id)} title="Xóa">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                </div>
              </div>
              <div className="unit-content">
                <h3>{dept.name}</h3>
                <div className="unit-details">
                  {dept.description && (
                    <div className="detail-item">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H3Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M5 5H11M5 8H11M5 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span>{dept.description}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 9C9.65685 9 11 7.65685 11 6C11 4.34315 9.65685 3 8 3C6.34315 3 5 4.34315 5 6C5 7.65685 6.34315 9 8 9Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 13C2 11.3431 4.68629 10 8 10C11.3137 10 14 11.3431 14 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Trưởng phòng: {getDepartmentHeadName(dept.head_id)}</span>
                  </div>
                </div>
              </div>
            </div>
              ))}
            </>
          )}
        </div>

        {!loading && filteredDepartments.length === 0 && (
          <div className="empty-state">
            <p>Không tìm thấy phòng ban nào</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="add-unit-modal-overlay" onClick={handleCloseModal}>
          <div className="add-unit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-unit-modal-header">
              <h2>Thêm phòng ban mới</h2>
              <button className="close-button" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="add-unit-modal-body">
              <div className="form-group">
                <label htmlFor="dept-name">Tên phòng ban <span className="required">*</span></label>
                <input
                  type="text"
                  id="dept-name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dept-description">Mô tả</label>
                <input
                  type="text"
                  id="dept-description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dept-head">Trưởng phòng</label>
                <select
                  id="dept-head"
                  value={newDepartment.head_id}
                  onChange={(e) => setNewDepartment({...newDepartment, head_id: e.target.value})}
                  style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px' }}
                >
                  <option value="">Chưa chọn</option>
                  {availableHeads.map(head => (
                    <option key={head.id} value={head.id}>{head.username}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="add-unit-modal-footer">
              <button className="cancel-button" onClick={handleCloseModal}>
                Hủy
              </button>
              <button className="add-button" onClick={handleAddDepartment}>
                Thêm mới
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingDepartment && (
        <div className="add-unit-modal-overlay" onClick={handleCloseEditModal}>
          <div className="add-unit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-unit-modal-header">
              <h2>Chỉnh sửa phòng ban</h2>
              <button className="close-button" onClick={handleCloseEditModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="add-unit-modal-body">
              <div className="form-group">
                <label htmlFor="edit-dept-name">Tên phòng ban <span className="required">*</span></label>
                <input
                  type="text"
                  id="edit-dept-name"
                  value={editDepartment.name}
                  onChange={(e) => setEditDepartment({...editDepartment, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-dept-description">Mô tả</label>
                <input
                  type="text"
                  id="edit-dept-description"
                  value={editDepartment.description}
                  onChange={(e) => setEditDepartment({...editDepartment, description: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-dept-head">Trưởng phòng</label>
                <select
                  id="edit-dept-head"
                  value={editDepartment.head_id}
                  onChange={(e) => setEditDepartment({...editDepartment, head_id: e.target.value})}
                  style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px' }}
                >
                  <option value="">Chưa chọn</option>
                  {availableHeads.map(head => (
                    <option key={head.id} value={head.id}>{head.username}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="add-unit-modal-footer">
              <button className="cancel-button" onClick={handleCloseEditModal} disabled={updating}>
                Hủy
              </button>
              <button className="add-button" onClick={handleUpdateDepartment} disabled={updating}>
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
