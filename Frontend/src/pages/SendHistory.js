import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Navigation from '../components/Navigation';
import { historyAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../styles/SendHistory.css';

const SendHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmResendItem, setConfirmResendItem] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { success, error } = useNotification();

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await historyAPI.getAll();
      setHistory(data);
    } catch (err) {
      error('Lỗi tải lịch sử: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredAndSortedHistory = useMemo(() => {
    let filtered = history.filter(item => {
      const documentName = item.documentName || '';
      const unitName = item.unitName || '';
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = 
        documentName.toLowerCase().includes(searchLower) ||
        unitName.toLowerCase().includes(searchLower);
      
      let matchesDate = true;
      if (selectedDate && item.date) {
        try {
          const itemDate = new Date(item.date.split(' ')[0]);
          const filterDate = new Date(selectedDate);
          matchesDate = itemDate.toDateString() === filterDate.toDateString();
        } catch (e) {
          matchesDate = false;
        }
      }
      
      return matchesSearch && matchesDate;
    });

    filtered.sort((a, b) => {
      try {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } catch (e) {
        return 0;
      }
    });

    return filtered;
  }, [history, searchTerm, selectedDate, sortOrder]);

  const handleViewDetail = async (historyItem) => {
    try {
      setDetailLoading(true);
      setIsDetailModalOpen(true);
      const detail = await historyAPI.getById(historyItem.id);
      setSelectedHistory(detail);
    } catch (err) {
      error('Lỗi tải chi tiết: ' + err.message);
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResendClick = (historyItem) => {
    if (!historyItem.document_id || !historyItem.unit_id) {
      error('Không thể gửi lại: thiếu thông tin tài liệu hoặc đơn vị');
      return;
    }
    setConfirmResendItem(historyItem);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmResend = async () => {
    if (!confirmResendItem) return;

    try {
      setResending(true);
      setIsConfirmModalOpen(false);
      const result = await historyAPI.resend(confirmResendItem.document_id, confirmResendItem.unit_id);
      success(result.message || 'Gửi lại thành công');
      setConfirmResendItem(null);
      loadHistory();
    } catch (err) {
      error('Lỗi gửi lại: ' + err.message);
    } finally {
      setResending(false);
    }
  };

  const handleCancelResend = () => {
    setIsConfirmModalOpen(false);
    setConfirmResendItem(null);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedHistory(null);
  };

  return (
    <div className="management-page">
      <Navigation />
      <div className="management-container">
        <h1 className="page-title">Lịch sử gửi</h1>
        <div className="filters-section">
          <div className="search-box">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu hoặc đơn vị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-label">Thời gian:</div>
            <div className="date-filter-container">
              <input
                type="date"
                className="date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              {selectedDate && (
                <button 
                  className="clear-date-btn"
                  onClick={() => setSelectedDate('')}
                  title="Xóa lọc ngày"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Sắp xếp:</div>
            <div className="sort-buttons">
              <button
                className={`sort-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                onClick={() => setSortOrder('desc')}
                title="Mới nhất trước"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 2L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Mới nhất
              </button>
              <button
                className={`sort-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                onClick={() => setSortOrder('asc')}
                title="Cũ nhất trước"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 10L8 14L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 14V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Cũ nhất
              </button>
            </div>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <p>Đang tải...</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tài liệu</th>
                  <th>Đơn vị nhận</th>
                  <th>Thời gian gửi</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedHistory.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="document-name-cell">
                      <span>{item.documentName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="unit-name-cell">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect width="16" height="16" rx="4" fill="url(#unitIcon)"/>
                        <defs>
                          <linearGradient id="unitIcon" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#667eea"/>
                            <stop offset="1" stopColor="#764ba2"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <span>{item.unitName}</span>
                    </div>
                  </td>
                  <td>{item.date}</td>
                  <td>
                    <span className={`status-badge ${item.status === 'Đã gửi' ? 'sent' : item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view" 
                        title="Xem chi tiết"
                        onClick={() => handleViewDetail(item)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 3C4.66667 3 2 5.33333 1 8.66667C2 12 4.66667 14.3333 8 14.3333C11.3333 14.3333 14 12 15 8.66667C14 5.33333 11.3333 3 8 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 10.6667C9.47276 10.6667 10.6667 9.47276 10.6667 8C10.6667 6.52724 9.47276 5.33333 8 5.33333C6.52724 5.33333 5.33333 6.52724 5.33333 8C5.33333 9.47276 6.52724 10.6667 8 10.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        className="action-btn resend" 
                        title="Gửi lại"
                        onClick={() => handleResendClick(item)}
                        disabled={resending || !item.document_id || !item.unit_id}
                        style={{ 
                          padding: '6px 12px',
                          fontSize: '14px',
                          minWidth: '80px'
                        }}
                      >
                        {resending ? 'Đang gửi...' : 'Gửi lại'}
                      </button>
                    </div>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredAndSortedHistory.length === 0 && (
            <div className="empty-state">
              <p>Không tìm thấy lịch sử gửi nào</p>
            </div>
          )}
        </div>
      </div>

      {isDetailModalOpen && (
        <div className="upload-modal-overlay" onClick={handleCloseDetailModal}>
          <div className="upload-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="upload-modal-header">
              <h2>Chi tiết lịch sử gửi</h2>
              <button className="close-button" onClick={handleCloseDetailModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="upload-modal-body">
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Đang tải...</p>
                </div>
              ) : selectedHistory ? (
                <div style={{ padding: '20px 0' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#2d3748' }}>
                      Thông tin tài liệu
                    </h3>
                    <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#718096', fontSize: '14px' }}>Tên tài liệu: </span>
                        <span style={{ fontWeight: '500' }}>{selectedHistory.document?.name || selectedHistory.documentName || 'N/A'}</span>
                      </div>
                      {selectedHistory.document?.type && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: '#718096', fontSize: '14px' }}>Loại: </span>
                          <span>{selectedHistory.document.type}</span>
                        </div>
                      )}
                      {selectedHistory.document?.size && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: '#718096', fontSize: '14px' }}>Kích thước: </span>
                          <span>{selectedHistory.document.size}</span>
                        </div>
                      )}
                      {selectedHistory.document?.created_at && (
                        <div>
                          <span style={{ color: '#718096', fontSize: '14px' }}>Ngày tải lên: </span>
                          <span>{new Date(selectedHistory.document.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#2d3748' }}>
                      Thông tin đơn vị nhận
                    </h3>
                    <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#718096', fontSize: '14px' }}>Tên đơn vị: </span>
                        <span style={{ fontWeight: '500' }}>{selectedHistory.unit?.name || selectedHistory.unitName || 'N/A'}</span>
                      </div>
                      {selectedHistory.unit?.code && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: '#718096', fontSize: '14px' }}>Mã đơn vị: </span>
                          <span>{selectedHistory.unit.code}</span>
                        </div>
                      )}
                      {selectedHistory.unit?.email && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: '#718096', fontSize: '14px' }}>Email: </span>
                          <span>{selectedHistory.unit.email}</span>
                        </div>
                      )}
                      {selectedHistory.unit?.phone && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: '#718096', fontSize: '14px' }}>Số điện thoại: </span>
                          <span>{selectedHistory.unit.phone}</span>
                        </div>
                      )}
                      {selectedHistory.unit?.address && (
                        <div>
                          <span style={{ color: '#718096', fontSize: '14px' }}>Địa chỉ: </span>
                          <span>{selectedHistory.unit.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#2d3748' }}>
                      Thông tin gửi
                    </h3>
                    <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#718096', fontSize: '14px' }}>Thời gian gửi: </span>
                        <span>{selectedHistory.date || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#718096', fontSize: '14px' }}>Trạng thái: </span>
                        <span className={`status-badge ${selectedHistory.status === 'Đã gửi' ? 'sent' : (selectedHistory.status || '').toLowerCase()}`}>
                          {selectedHistory.status || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Không có dữ liệu</p>
                </div>
              )}
            </div>
            <div className="upload-modal-footer" style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              padding: '20px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button 
                className="cancel-button" 
                onClick={handleCloseDetailModal}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmModalOpen && confirmResendItem && (
        <div className="upload-modal-overlay" onClick={handleCancelResend}>
          <div className="upload-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="upload-modal-header">
              <h2>Xác nhận gửi lại</h2>
              <button className="close-button" onClick={handleCancelResend}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="upload-modal-body">
              <div style={{ padding: '20px 0' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: '#667eea' }}>
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ 
                  textAlign: 'center', 
                  fontSize: '16px', 
                  color: '#2d3748',
                  marginBottom: '16px',
                  lineHeight: '1.5'
                }}>
                  Bạn có chắc chắn muốn gửi lại tài liệu?
                </p>
                <div style={{ 
                  background: '#f7fafc', 
                  padding: '16px', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#718096', fontSize: '14px' }}>Tài liệu: </span>
                    <span style={{ fontWeight: '500', color: '#2d3748' }}>
                      {confirmResendItem.documentName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#718096', fontSize: '14px' }}>Đơn vị nhận: </span>
                    <span style={{ fontWeight: '500', color: '#2d3748' }}>
                      {confirmResendItem.unitName || 'N/A'}
                    </span>
                  </div>
                </div>
                <p style={{ 
                  textAlign: 'center', 
                  fontSize: '14px', 
                  color: '#718096',
                  lineHeight: '1.5'
                }}>
                  Tài liệu sẽ được gửi lại qua email đến đơn vị nhận.
                </p>
              </div>
            </div>
            <div className="upload-modal-footer" style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              padding: '20px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button 
                className="cancel-button" 
                onClick={handleCancelResend}
                disabled={resending}
              >
                Hủy
              </button>
              <button 
                className="add-file-btn" 
                onClick={handleConfirmResend}
                disabled={resending}
                style={{
                  background: '#667eea',
                  color: '#fff',
                  border: 'none'
                }}
              >
                {resending ? 'Đang gửi...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendHistory;

