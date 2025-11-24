import React, { useState, useEffect } from 'react';
import { unitsAPI, aiAPI, historyAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../styles/SendModal.css';

const SendModal = ({ document, onClose, onSendSuccess }) => {
  const [suggestedUnits, setSuggestedUnits] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasSuggestions, setHasSuggestions] = useState(true);
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [extractedContent, setExtractedContent] = useState(null);
  const [extractedLength, setExtractedLength] = useState(0);
  const [showContentPreview, setShowContentPreview] = useState(false);
  const { success, error } = useNotification();

  useEffect(() => {
    loadUnits();
  }, [document]);

  const loadUnits = async () => {
    try {
      setLoading(true);
      
      const all = await unitsAPI.getAll();
      setAllUnits(all);
      
      aiAPI.suggestUnitsStream(
        document.id,
        document.name,
        (result) => {
          setSuggestedUnits(result.units || []);
          setHasSuggestions(result.hasSuggestions);
          setSuggestionMessage(result.message || '');
          setIsFallback(result.isFallback || false);
          setExtractedContent(result.extractedContent || null);
          setExtractedLength(result.extractedLength || 0);
          
          if (!result.hasSuggestions && result.isFinal) {
            setShowAll(true);
          }
          
          if (result.isFinal) {
            setLoading(false);
          }
        },
        (err) => {
          error('Lỗi tải danh sách đơn vị: ' + err.message);
          setSuggestedUnits([]);
          setHasSuggestions(false);
          setSuggestionMessage('Không có đơn vị thích hợp');
          setIsFallback(false);
          setShowAll(true);
          setLoading(false);
        }
      );
    } catch (err) {
      error('Lỗi tải danh sách đơn vị: ' + err.message);
      try {
        const all = await unitsAPI.getAll();
        setAllUnits(all);
        setSuggestedUnits([]);
        setHasSuggestions(false);
        setSuggestionMessage('Không có đơn vị thích hợp');
        setIsFallback(false);
        setShowAll(true);
      } catch (e) {
        error('Lỗi tải danh sách đơn vị: ' + e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const displayUnits = showAll ? allUnits : suggestedUnits;
  const filteredUnits = displayUnits.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUnitSelection = (unitId) => {
    setSelectedUnits(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleSend = async () => {
    if (selectedUnits.length === 0) {
      error('Vui lòng chọn ít nhất một đơn vị');
      return;
    }

    try {
      setSending(true);
      const result = await historyAPI.send(document.id, selectedUnits);
      
      const unitNames = result.unit_names || [];
      const unitText = selectedUnits.length === 1 
        ? `đơn vị "${unitNames[0] || ''}"`
        : `${selectedUnits.length} đơn vị`;
      
      success(`Đã gửi "${document.name}" đến ${unitText}`);
      onSendSuccess();
    } catch (err) {
      error('Lỗi gửi tài liệu: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleViewContent = async () => {
    try {
      const result = await aiAPI.previewContent(document.id);
      setExtractedContent(result.extractedContent);
      setExtractedLength(result.extractedLength);
      setShowContentPreview(true);
    } catch (err) {
      error('Lỗi xem nội dung: ' + err.message);
    }
  };

  return (
    <div className="send-modal-overlay" onClick={onClose}>
      <div className="send-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="send-modal-header">
          <h2>Gửi tài liệu</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="send-modal-body">
          <div className="document-preview">
            <div className="preview-icon">
              {document.type === 'PDF' && <span className="file-type pdf">PDF</span>}
              {document.type === 'DOCX' && <span className="file-type docx">DOC</span>}
              {document.type === 'XLSX' && <span className="file-type xlsx">XLS</span>}
            </div>
            <div className="preview-info">
              <h3>{document.name}</h3>
              <p>{document.type} • {document.size}</p>
              {extractedLength > 0 && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Đã đọc {extractedLength} ký tự từ file
                </p>
              )}
            </div>
            <button 
              onClick={handleViewContent}
              style={{
                padding: '8px 12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                marginLeft: 'auto'
              }}
            >
              Xem nội dung đã đọc
            </button>
          </div>

          {hasSuggestions && suggestedUnits.length > 0 && (
            <div className="ai-suggestion-badge">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.91 18.02L10 15.77L5.09 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="currentColor"/>
              </svg>
              <span>{isFallback ? 'Có từ phù hợp' : 'Đơn vị được AI gợi ý'}</span>
            </div>
          )}

          {!loading && !hasSuggestions && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#856404'
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 6V10M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{suggestionMessage || 'Không có đơn vị thích hợp'}</span>
            </div>
          )}

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

          {loading ? (
            <div className="empty-state">
              <p>Đang tải...</p>
            </div>
          ) : (
            <>
              {!showAll && (
                <button className="show-all-button" onClick={() => setShowAll(true)}>
                  Hiển thị tất cả đơn vị
                </button>
              )}

              <div className="units-list">
                {filteredUnits.map(unit => {
              const isSelected = selectedUnits.includes(unit.id);
              const isSuggested = suggestedUnits.some(u => u.id === unit.id);
              
              return (
                <div
                  key={unit.id}
                  className={`unit-item ${isSelected ? 'selected' : ''} ${isSuggested ? 'suggested' : ''}`}
                  onClick={() => toggleUnitSelection(unit.id)}
                >
                  <div className="unit-checkbox">
                    {isSelected && (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.667 5L7.5 14.167L3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="unit-info">
                    <h4>{unit.name}</h4>
                    <p>{unit.code} • {unit.email}</p>
                  </div>
                  {isSuggested && (
                    <span className="suggested-badge">{isFallback ? 'Có từ phù hợp' : 'AI gợi ý'}</span>
                  )}
                  </div>
                );
                })}
              </div>

              {!loading && filteredUnits.length === 0 && (
                <div className="empty-state">
                  <p>Không tìm thấy đơn vị nào</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="send-modal-footer">
          <button className="cancel-button" onClick={onClose} disabled={sending}>
            Hủy
          </button>
          <button 
            className="confirm-send-button"
            onClick={handleSend}
            disabled={selectedUnits.length === 0 || sending || loading}
          >
            {sending ? 'Đang gửi...' : `Gửi (${selectedUnits.length})`}
          </button>
        </div>
      </div>

      {showContentPreview && (
        <div className="send-modal-overlay" onClick={() => setShowContentPreview(false)} style={{ zIndex: 2000 }}>
          <div className="send-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh' }}>
            <div className="send-modal-header">
              <h2>Nội dung đã đọc từ file</h2>
              <button className="close-button" onClick={() => setShowContentPreview(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="send-modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  <strong>Tài liệu:</strong> {document.name}
                </p>
                {extractedLength > 0 && (
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    <strong>Đã đọc:</strong> {extractedLength} ký tự
                  </p>
                )}
              </div>

              {extractedContent ? (
                <div style={{
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '16px',
                  maxHeight: '60vh',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  lineHeight: '1.6'
                }}>
                  {extractedContent}
                </div>
              ) : (
                <div style={{
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  color: '#856404'
                }}>
                  <p>Không thể extract nội dung từ file này.</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    Có thể file không được hỗ trợ hoặc chỉ dựa vào tên file để phân tích.
                  </p>
                </div>
              )}
            </div>

            <div className="send-modal-footer">
              <button className="cancel-button" onClick={() => setShowContentPreview(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendModal;

