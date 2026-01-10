import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '../components/Navigation';
import SendModal from '../components/SendModal';
import { documentsAPI, historyAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../styles/DocumentList.css';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [documentHistory, setDocumentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { error } = useNotification();

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

  const handleSend = (document) => {
    setSelectedDocument(document);
    setIsSendModalOpen(true);
  };

  const handleSendSuccess = () => {
    setIsSendModalOpen(false);
    setSelectedDocument(null);
  };

  const handleViewHistory = async (document) => {
    try {
      setLoadingHistory(true);
      setSelectedDocument(document);
      const history = await historyAPI.getByDocument(document.id);
      setDocumentHistory(history);
      setIsHistoryModalOpen(true);
    } catch (err) {
      error('Lỗi tải lịch sử gửi: ' + err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const uniqueTypes = ['all', ...new Set(documents.map(doc => doc.type))];

  return (
    <div className="document-list-page">
      <Navigation />
      <div className="document-list-container">
        <h1 className="page-title">Danh sách tài liệu</h1>
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

        <div className="documents-grid">
          {loading ? (
            <div className="empty-state">
              <p>Đang tải...</p>
            </div>
          ) : (
            <>
              {filteredDocuments.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="document-icon">
                {doc.type === 'PDF' && <span className="file-type pdf">PDF</span>}
                {doc.type === 'DOCX' && <span className="file-type docx">DOC</span>}
                {doc.type === 'XLSX' && <span className="file-type xlsx">XLS</span>}
              </div>
              <div className="document-info">
                <h3>{doc.name}</h3>
                <div className="document-meta">
                  <span className="meta-item">{doc.type}</span>
                  <span className="meta-item">{doc.size}</span>
                  <span className="meta-item">{doc.date}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <button 
                  className="send-button"
                  onClick={() => handleSend(doc)}
                  style={{ width: '100%' }}
                >
                  Gửi
                </button>
                <button 
                  className="send-button"
                  onClick={() => {
                    const viewUrl = documentsAPI.view(doc.id);
                    window.open(viewUrl, '_blank');
                  }}
                  style={{ 
                    width: '100%',
                    background: '#48bb78',
                    marginTop: '4px'
                  }}
                  title="Xem tài liệu"
                >
                  Xem
                </button>
                <button 
                  className="send-button"
                  onClick={() => handleViewHistory(doc)}
                  style={{ 
                    width: '100%',
                    background: '#667eea',
                    marginTop: '4px'
                  }}
                  title="Xem lịch sử gửi"
                >
                  Lịch sử
                </button>
                <button 
                  className="send-button"
                  onClick={() => handleViewHistory(doc)}
                  style={{ 
                    width: '100%',
                    background: '#f59e0b',
                    marginTop: '4px'
                  }}
                  title="Xem chi tiết lịch sử"
                >
                  Chi tiết
                </button>
              </div>
            </div>
              ))}
            </>
          )}
        </div>

        {!loading && filteredDocuments.length === 0 && (
          <div className="empty-state">
            <p>Không tìm thấy tài liệu nào</p>
          </div>
        )}
      </div>

      {isSendModalOpen && selectedDocument && (
        <SendModal
          document={selectedDocument}
          onClose={() => setIsSendModalOpen(false)}
          onSendSuccess={handleSendSuccess}
        />
      )}

      {isHistoryModalOpen && selectedDocument && (
        <div className="history-modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
          <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h2>Lịch sử gửi: {selectedDocument.name}</h2>
              <button className="close-button" onClick={() => setIsHistoryModalOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="history-modal-body">
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Đang tải lịch sử...</p>
                </div>
              ) : documentHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                  <p>Chưa có lịch sử gửi cho tài liệu này</p>
                </div>
              ) : (
                <div className="history-list">
                  {documentHistory.map((item, index) => (
                    <div key={index} className="history-item">
                      <div className="history-item-header">
                        <span className="history-unit-name">{item.unitName || 'Đơn vị không xác định'}</span>
                        <span className={`history-status ${item.status === 'Đã gửi' ? 'sent' : 'pending'}`}>
                          {item.status || 'Đã gửi'}
                        </span>
                      </div>
                      <div className="history-item-details">
                        <span className="history-date">
                          {new Date(item.created_at || item.date).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;

