import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useNotification } from '../context/NotificationContext';
import { unitsAPI } from '../services/api';
import '../styles/UnitManagement.css';

const UnitManagement = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCode, setFilterCode] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [newUnit, setNewUnit] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: ''
  });
  const [editUnit, setEditUnit] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: ''
  });
  const [updating, setUpdating] = useState(false);
  const { success, error } = useNotification();

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const data = await unitsAPI.getAll();
      setUnits(data);
    } catch (err) {
      error('Lỗi tải danh sách đơn vị: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter(unit => {
    const matchesSearch = 
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCode = filterCode === 'all' || unit.code.startsWith(filterCode);
    return matchesSearch && matchesCode;
  });

  const uniqueCodePrefixes = ['all', ...new Set(units.map(unit => unit.code.substring(0, 2)))];

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn vị này?')) {
      try {
        await unitsAPI.delete(id);
        success('Xóa đơn vị thành công');
        loadUnits();
      } catch (err) {
        error('Lỗi xóa đơn vị: ' + err.message);
      }
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.name || !newUnit.code || !newUnit.email) {
      error('Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Mã, Email)');
      return;
    }

    try {
      await unitsAPI.create(newUnit);
      success('Thêm đơn vị mới thành công!');
      setNewUnit({
        name: '',
        code: '',
        email: '',
        phone: '',
        address: ''
      });
      setIsAddModalOpen(false);
      loadUnits();
    } catch (err) {
      error('Lỗi thêm đơn vị: ' + err.message);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setNewUnit({
      name: '',
      code: '',
      email: '',
      phone: '',
      address: ''
    });
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setEditUnit({
      name: unit.name,
      code: unit.code,
      email: unit.email,
      phone: unit.phone || '',
      address: unit.address || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUnit = async () => {
    if (!editUnit.name || !editUnit.code || !editUnit.email) {
      error('Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Mã, Email)');
      return;
    }

    try {
      setUpdating(true);
      await unitsAPI.update(editingUnit.id, editUnit);
      success('Cập nhật đơn vị thành công!');
      setIsEditModalOpen(false);
      setEditingUnit(null);
      setEditUnit({
        name: '',
        code: '',
        email: '',
        phone: '',
        address: ''
      });
      loadUnits();
    } catch (err) {
      error('Lỗi cập nhật đơn vị: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUnit(null);
    setEditUnit({
      name: '',
      code: '',
      email: '',
      phone: '',
      address: ''
    });
  };

  return (
    <div className="management-page">
      <Navigation />
      <div className="management-container">
        <div className="page-header">
          <h1 className="page-title">Quản lý đơn vị</h1>
          <button className="add-unit-btn" onClick={() => setIsAddModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Thêm đơn vị
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
              placeholder="Tìm kiếm đơn vị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-label">Mã đơn vị:</div>
            <div className="filter-buttons">
              {uniqueCodePrefixes.map(prefix => (
                <button
                  key={prefix}
                  className={`filter-btn ${filterCode === prefix ? 'active' : ''}`}
                  onClick={() => setFilterCode(prefix)}
                >
                  {prefix === 'all' ? 'Tất cả' : prefix}
                </button>
              ))}
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
              {filteredUnits.map(unit => (
            <div key={unit.id} className="unit-card">
              <div className="unit-header">
                <div className="unit-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#unitGradient)"/>
                    <path d="M16 10C18.2091 10 20 11.7909 20 14C20 16.2091 18.2091 18 16 18C13.7909 18 12 16.2091 12 14C12 11.7909 13.7909 10 16 10Z" fill="white"/>
                    <path d="M10 22C10 19.7909 11.7909 18 14 18H18C20.2091 18 22 19.7909 22 22V24H10V22Z" fill="white"/>
                    <defs>
                      <linearGradient id="unitGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#667eea"/>
                        <stop offset="1" stopColor="#764ba2"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="unit-actions">
                  <button 
                    className="action-btn edit" 
                    onClick={() => handleEdit(unit)}
                    title="Chỉnh sửa"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.333 2.00001C11.5084 1.82465 11.7163 1.68576 11.9447 1.59203C12.1731 1.4983 12.4173 1.45166 12.6637 1.45501C12.9101 1.45836 13.1528 1.51163 13.3778 1.61137C13.6028 1.71111 13.8055 1.85519 13.9737 2.03501C14.1419 2.21483 14.2719 2.42698 14.3564 2.65828C14.4409 2.88958 14.4781 3.13526 14.4657 3.38065C14.4533 3.62604 14.3915 3.866 14.2837 4.08501C14.1759 4.30402 14.0246 4.49748 13.8387 4.65334C13.6528 4.8092 13.4363 4.92401 13.2037 4.99001L5.33366 12.86L1.33366 13.86L2.33366 9.86001L10.2037 2.00001H11.333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="action-btn delete" onClick={() => handleDelete(unit.id)} title="Xóa">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="unit-content">
                <h3>{unit.name}</h3>
                <div className="unit-code">{unit.code}</div>
                <div className="unit-details">
                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4L8 9L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <span>{unit.email}</span>
                  </div>
                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H3Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M5 5H11M5 8H11M5 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>{unit.phone}</span>
                  </div>
                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 9C9.65685 9 11 7.65685 11 6C11 4.34315 9.65685 3 8 3C6.34315 3 5 4.34315 5 6C5 7.65685 6.34315 9 8 9Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 13C2 11.3431 4.68629 10 8 10C11.3137 10 14 11.3431 14 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>{unit.address}</span>
                  </div>
                </div>
              </div>
            </div>
              ))}
            </>
          )}
        </div>

        {!loading && filteredUnits.length === 0 && (
          <div className="empty-state">
            <p>Không tìm thấy đơn vị nào</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="add-unit-modal-overlay" onClick={handleCloseModal}>
          <div className="add-unit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-unit-modal-header">
              <h2>Thêm đơn vị mới</h2>
              <button className="close-button" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="add-unit-modal-body">
              <div className="form-group">
                <label htmlFor="unit-name">Tên đơn vị <span className="required">*</span></label>
                <input
                  type="text"
                  id="unit-name"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="unit-code">Mã đơn vị <span className="required">*</span></label>
                <input
                  type="text"
                  id="unit-code"
                  value={newUnit.code}
                  onChange={(e) => setNewUnit({...newUnit, code: e.target.value.toUpperCase()})}
                  maxLength="10"
                />
              </div>

              <div className="form-group">
                <label htmlFor="unit-email">Email <span className="required">*</span></label>
                <input
                  type="email"
                  id="unit-email"
                  value={newUnit.email}
                  onChange={(e) => setNewUnit({...newUnit, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="unit-phone">Số điện thoại</label>
                <input
                  type="tel"
                  id="unit-phone"
                  value={newUnit.phone}
                  onChange={(e) => setNewUnit({...newUnit, phone: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="unit-address">Địa chỉ</label>
                <input
                  type="text"
                  id="unit-address"
                  value={newUnit.address}
                  onChange={(e) => setNewUnit({...newUnit, address: e.target.value})}
                />
              </div>
            </div>
            <div className="add-unit-modal-footer">
              <button className="cancel-button" onClick={handleCloseModal}>
                Hủy
              </button>
              <button className="add-button" onClick={handleAddUnit}>
                Thêm mới
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingUnit && (
        <div className="add-unit-modal-overlay" onClick={handleCloseEditModal}>
          <div className="add-unit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-unit-modal-header">
              <h2>Chỉnh sửa đơn vị</h2>
              <button className="close-button" onClick={handleCloseEditModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="add-unit-modal-body">
              <div className="form-group">
                <label htmlFor="edit-unit-name">Tên đơn vị <span className="required">*</span></label>
                <input
                  type="text"
                  id="edit-unit-name"
                  value={editUnit.name}
                  onChange={(e) => setEditUnit({...editUnit, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-unit-code">Mã đơn vị <span className="required">*</span></label>
                <input
                  type="text"
                  id="edit-unit-code"
                  value={editUnit.code}
                  onChange={(e) => setEditUnit({...editUnit, code: e.target.value.toUpperCase()})}
                  maxLength="10"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-unit-email">Email <span className="required">*</span></label>
                <input
                  type="email"
                  id="edit-unit-email"
                  value={editUnit.email}
                  onChange={(e) => setEditUnit({...editUnit, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-unit-phone">Số điện thoại</label>
                <input
                  type="tel"
                  id="edit-unit-phone"
                  value={editUnit.phone}
                  onChange={(e) => setEditUnit({...editUnit, phone: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-unit-address">Địa chỉ</label>
                <input
                  type="text"
                  id="edit-unit-address"
                  value={editUnit.address}
                  onChange={(e) => setEditUnit({...editUnit, address: e.target.value})}
                />
              </div>
            </div>
            <div className="add-unit-modal-footer">
              <button className="cancel-button" onClick={handleCloseEditModal} disabled={updating}>
                Hủy
              </button>
              <button className="add-button" onClick={handleUpdateUnit} disabled={updating}>
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitManagement;

