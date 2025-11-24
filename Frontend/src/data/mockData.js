export const mockDocuments = [
  { id: 1, name: 'Báo cáo tài chính Q1 2024', type: 'PDF', size: '2.5 MB', date: '2024-01-15', status: 'active' },
  { id: 2, name: 'Hợp đồng lao động mẫu', type: 'DOCX', size: '1.2 MB', date: '2024-01-20', status: 'active' },
  { id: 3, name: 'Quy định nội bộ công ty', type: 'PDF', size: '3.1 MB', date: '2024-02-01', status: 'active' },
];

export const mockUnits = [
  { id: 1, name: 'Phòng Kế toán', code: 'KT001', email: 'ketoan@company.com', phone: '024-1234-5678', address: 'Tầng 3, Tòa nhà A' },
  { id: 2, name: 'Phòng Nhân sự', code: 'NS002', email: 'nhansu@company.com', phone: '024-1234-5679', address: 'Tầng 4, Tòa nhà A' },
  { id: 3, name: 'Phòng Kinh doanh', code: 'KD003', email: 'kinhdoanh@company.com', phone: '024-1234-5680', address: 'Tầng 5, Tòa nhà B' },
];

export const mockSendHistory = [
  { id: 1, documentName: 'Báo cáo tài chính Q1 2024', unitName: 'Phòng Kế toán', date: '2024-03-10 14:30', status: 'Đã gửi' },
  { id: 2, documentName: 'Hợp đồng lao động mẫu', unitName: 'Phòng Nhân sự', date: '2024-03-09 10:15', status: 'Đã gửi' },
  { id: 3, documentName: 'Quy định nội bộ công ty', unitName: 'Phòng Kinh doanh', date: '2024-03-08 16:45', status: 'Đã gửi' },
];

export const getSuggestedUnits = (documentName) => {
  const suggestions = {
    'tài chính': [1],
    'lương': [1, 2],
    'hợp đồng': [2],
    'lao động': [2],
    'nhân sự': [2],
    'quy định': [3],
    'dự án': [3],
    'thuyết trình': [3],
    'hướng dẫn': [3],
    'hiệu suất': [2],
    'chính sách': [2],
  };

  const docLower = documentName.toLowerCase();
  const suggestedIds = new Set();
  
  Object.keys(suggestions).forEach(key => {
    if (docLower.includes(key)) {
      suggestions[key].forEach(id => suggestedIds.add(id));
    }
  });

  if (suggestedIds.size === 0) {
    return [1, 2, 3];
  }

  return Array.from(suggestedIds);
};

