import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Navigation from '../components/Navigation';
import SendModal from '../components/SendModal';
import { useNotification } from '../context/NotificationContext';
import { documentsAPI } from '../services/api';
import '../styles/DocumentManagement.css';

const DocumentManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editFilePreview, setEditFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { success, error } = useNotification();

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await documentsAPI.getAll();
      setDocuments(data);
    } catch (err) {
      error('Lỗi tải danh sách tài liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || doc.type === filterType;
      
      let matchesDate = true;
      if (selectedDate) {
        const itemDate = new Date(doc.date);
        const filterDate = new Date(selectedDate);
        matchesDate = itemDate.toDateString() === filterDate.toDateString();
      }
      
      return matchesSearch && matchesType && matchesDate;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [documents, searchTerm, filterType, selectedDate, sortOrder]);

  const uniqueTypes = ['all', ...new Set(documents.map(doc => doc.type))];

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      try {
        await documentsAPI.delete(id);
        success('Xóa tài liệu thành công');
        loadDocuments();
      } catch (err) {
        error('Lỗi xóa tài liệu: ' + err.message);
      }
    }
  };

  const handleSend = (document) => {
    setSelectedDocument(document);
    setIsSendModalOpen(true);
  };

  const handleSendSuccess = () => {
    setIsSendModalOpen(false);
    setSelectedDocument(null);
  };

  const handleEdit = (document) => {
    setEditingDocument(document);
    setEditName(document.name);
    setEditFile(null);
    setEditFilePreview(null);
    setIsEditModalOpen(true);
  };

  const handleEditFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        error('Định dạng file không được hỗ trợ!');
        event.target.value = '';
        return;
      }

      setEditFile(file);
      
      const fileSize = (file.size / (1024 * 1024)).toFixed(2);
      const fileExt = file.name.split('.').pop().toUpperCase();
      const fileType = fileExt === 'DOC' ? 'DOCX' : fileExt;
      
      setEditFilePreview({
        name: file.name,
        type: fileType,
        size: fileSize >= 1 ? `${fileSize} MB` : `${(file.size / 1024).toFixed(0)} KB`,
      });
    }
  };

  const handleUpdateDocument = async () => {
    if (!editName.trim()) {
      error('Vui lòng nhập tên tài liệu');
      return;
    }

    try {
      setUpdating(true);
      await documentsAPI.update(editingDocument.id, { name: editName }, editFile);
      success('Cập nhật tài liệu thành công');
      setIsEditModalOpen(false);
      setEditingDocument(null);
      setEditName('');
      setEditFile(null);
      setEditFilePreview(null);
      loadDocuments();
    } catch (err) {
      error('Lỗi cập nhật tài liệu: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingDocument(null);
    setEditName('');
    setEditFile(null);
    setEditFilePreview(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        error('Định dạng file không được hỗ trợ!');
        event.target.value = '';
        return;
      }

      setSelectedFile(file);
      
      const fileSize = (file.size / (1024 * 1024)).toFixed(2);
      const fileExt = file.name.split('.').pop().toUpperCase();
      const fileType = fileExt === 'DOC' ? 'DOCX' : fileExt;
      
      setFilePreview({
        name: file.name,
        type: fileType,
        size: fileSize >= 1 ? `${fileSize} MB` : `${(file.size / 1024).toFixed(0)} KB`,
        date: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleAddDocument = async () => {
    if (!selectedFile) {
      error('Vui lòng chọn file trước khi thêm!');
      return;
    }

    try {
      setUploading(true);
      await documentsAPI.upload(selectedFile);
      success('Tải lên tài liệu thành công!');
      setSelectedFile(null);
      setFilePreview(null);
      setIsUploadModalOpen(false);
      loadDocuments();
    } catch (err) {
      error('Lỗi tải lên tài liệu: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setFilePreview(null);
  };

  return (
    <div className="management-page">
      <Navigation />
      <div className="management-container">
        <div className="page-header">
          <h1 className="page-title">Quản lý tài liệu</h1>
          <button className="add-document-btn" onClick={() => setIsUploadModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Thêm tài liệu
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
              placeholder="Tìm kiếm tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-label">Loại:</div>
            <div className="filter-buttons">
              {uniqueTypes.map(type => (
                <button
                  key={type}
                  className={`filter-btn ${filterType === type ? 'active' : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type === 'all' ? 'Tất cả' : type}
                </button>
              ))}
            </div>
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
                  <th>Tên tài liệu</th>
                  <th>Loại</th>
                  <th>Kích thước</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedDocuments.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div className="document-name-cell">
                      <span className={`file-type-badge ${doc.type.toLowerCase()}`}>
                        {doc.type}
                      </span>
                      <span>{doc.name}</span>
                    </div>
                  </td>
                  <td>{doc.type}</td>
                  <td>{doc.size}</td>
                  <td>{doc.date}</td>
                  <td>
                    <span className={`status-badge ${doc.status}`}>
                      {doc.status === 'active' ? 'Hoạt động' : doc.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view" 
                        onClick={() => {
                          const viewUrl = documentsAPI.view(doc.id);
                          window.open(viewUrl, '_blank');
                        }}
                        title="Xem tài liệu"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 3C4.66667 3 2 5.33333 1 8.66667C2 12 4.66667 14.3333 8 14.3333C11.3333 14.3333 14 12 15 8.66667C14 5.33333 11.3333 3 8 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 10.6667C9.47276 10.6667 10.6667 9.47276 10.6667 8C10.6667 6.52724 9.47276 5.33333 8 5.33333C6.52724 5.33333 5.33333 6.52724 5.33333 8C5.33333 9.47276 6.52724 10.6667 8 10.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        className="action-btn send" 
                        onClick={() => handleSend(doc)}
                        title="Gửi"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M14.6667 1.33333L7.33333 8.66667M14.6667 1.33333L10 14.6667L7.33333 8.66667M14.6667 1.33333L1.33333 5.33333L7.33333 8.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        className="action-btn edit" 
                        onClick={() => handleEdit(doc)}
                        title="Chỉnh sửa"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M11.333 2.00001C11.5084 1.82465 11.7163 1.68576 11.9447 1.59203C12.1731 1.4983 12.4173 1.45166 12.6637 1.45501C12.9101 1.45836 13.1528 1.51163 13.3778 1.61137C13.6028 1.71111 13.8055 1.85519 13.9737 2.03501C14.1419 2.21483 14.2719 2.42698 14.3564 2.65828C14.4409 2.88958 14.4781 3.13526 14.4657 3.38065C14.4533 3.62604 14.3915 3.866 14.2837 4.08501C14.1759 4.30402 14.0246 4.49748 13.8387 4.65334C13.6528 4.8092 13.4363 4.92401 13.2037 4.99001L5.33366 12.86L1.33366 13.86L2.33366 9.86001L10.2037 2.00001H11.333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(doc.id)} title="Xóa">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredAndSortedDocuments.length === 0 && (
            <div className="empty-state">
              <p>Không tìm thấy tài liệu nào</p>
            </div>
          )}
        </div>
      </div>

      {isSendModalOpen && selectedDocument && (
        <SendModal
          document={selectedDocument}
          onClose={() => setIsSendModalOpen(false)}
          onSendSuccess={handleSendSuccess}
        />
      )}

      {isUploadModalOpen && (
        <div className="upload-modal-overlay" onClick={handleCloseUploadModal}>
          <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="upload-modal-header">
              <h2>Thêm tài liệu mới</h2>
              <button className="close-button" onClick={handleCloseUploadModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="upload-modal-body">
              {!filePreview ? (
                <div className="upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    className="file-input"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <label htmlFor="file-upload" className="upload-label">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path d="M24 8V32M8 24H40" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      <path d="M24 40C32.8366 40 40 32.8366 40 24C40 15.1634 32.8366 8 24 8C15.1634 8 8 15.1634 8 24C8 32.8366 15.1634 40 24 40Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <p className="upload-text">Chọn file để tải lên</p>
                    <p className="upload-hint">PDF, DOCX, XLSX</p>
                  </label>
                </div>
              ) : (
                <div className="file-preview">
                  <div className="file-preview-header">
                    <div className="file-preview-icon">
                      {filePreview.type === 'PDF' && <span className="file-type-badge pdf">PDF</span>}
                      {filePreview.type === 'DOCX' && <span className="file-type-badge docx">DOC</span>}
                      {filePreview.type === 'XLSX' && <span className="file-type-badge xlsx">XLS</span>}
                    </div>
                    <button 
                      className="remove-file-btn"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        document.getElementById('file-upload').value = '';
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="file-preview-info">
                    <h3>{filePreview.name}</h3>
                    <div className="file-preview-details">
                      <span>Loại: {filePreview.type}</span>
                      <span>Kích thước: {filePreview.size}</span>
                      <span>Ngày: {filePreview.date}</span>
                    </div>
                  </div>
                  <button className="add-file-btn" onClick={handleAddDocument} disabled={uploading}>
                    {uploading ? 'Đang tải lên...' : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Thêm mới
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingDocument && (
        <div className="upload-modal-overlay" onClick={handleCloseEditModal}>
          <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="upload-modal-header">
              <h2>Chỉnh sửa tài liệu</h2>
              <button className="close-button" onClick={handleCloseEditModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="upload-modal-body">
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="edit-doc-name" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Tên tài liệu
                </label>
                <input
                  type="text"
                  id="edit-doc-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="Nhập tên tài liệu"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="edit-file-upload" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Thay đổi file (tùy chọn)
                </label>
                {!editFilePreview ? (
                  <div className="upload-area" style={{ 
                    border: '2px dashed #cbd5e0', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="file"
                      id="edit-file-upload"
                      className="file-input"
                      onChange={handleEditFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="edit-file-upload" style={{ cursor: 'pointer' }}>
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 10px' }}>
                        <path d="M24 8V32M8 24H40" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        <path d="M24 40C32.8366 40 40 32.8366 40 24C40 15.1634 32.8366 8 24 8C15.1634 8 8 15.1634 8 24C8 32.8366 15.1634 40 24 40Z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <p style={{ margin: '5px 0', color: '#718096' }}>Chọn file mới để thay thế</p>
                      <p style={{ margin: '0', fontSize: '12px', color: '#a0aec0' }}>PDF, DOC, DOCX, XLS, XLSX</p>
                    </label>
                  </div>
                ) : (
                  <div className="file-preview">
                    <div className="file-preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <div className="file-preview-icon" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {editFilePreview.type === 'PDF' && <span className="file-type-badge pdf">PDF</span>}
                        {editFilePreview.type === 'DOCX' && <span className="file-type-badge docx">DOC</span>}
                        {editFilePreview.type === 'XLSX' && <span className="file-type-badge xlsx">XLS</span>}
                        <div>
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{editFilePreview.name}</h3>
                          <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                            <span>Loại: {editFilePreview.type}</span>
                            <span style={{ marginLeft: '12px' }}>Kích thước: {editFilePreview.size}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setEditFile(null);
                          setEditFilePreview(null);
                          document.getElementById('edit-file-upload').value = '';
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '5px',
                          color: '#e53e3e'
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px', marginBottom: 0 }}>
                  File hiện tại: {editingDocument?.name || 'N/A'} ({editingDocument?.size || 'N/A'})
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
                onClick={handleCloseEditModal}
                disabled={updating}
              >
                Hủy
              </button>
              <button 
                className="add-file-btn" 
                onClick={handleUpdateDocument}
                disabled={updating || !editName.trim()}
              >
                {updating ? 'Đang cập nhật...' : editFile ? 'Cập nhật và thay file' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;

