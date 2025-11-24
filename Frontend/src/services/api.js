const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getToken = () => {
  return localStorage.getItem('token');
};

const setToken = (token) => {
  localStorage.setItem('token', token);
};

const removeToken = () => {
  localStorage.removeItem('token');
};

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const authAPI = {
  login: async (username, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },
  
  register: async (username, password) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },
  
  verify: async () => {
    return await apiRequest('/auth/verify');
  },
};

export const documentsAPI = {
  getAll: async () => {
    const data = await apiRequest('/documents');
    return data.documents || [];
  },
  
  upload: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    
    return data;
  },
  
  update: async (docId, data, file = null) => {
    const token = getToken();
    
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (data && data.name) {
        formData.append('name', data.name);
      }
      
      const response = await fetch(`${API_BASE_URL}/documents/${docId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (response.status === 401) {
        removeToken();
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Update failed');
      }
      
      return result;
    } else {
      return await apiRequest(`/documents/${docId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
  },
  
  delete: async (docId) => {
    return await apiRequest(`/documents/${docId}`, {
      method: 'DELETE',
    });
  },
  
  download: (docId, download = false) => {
    const token = getToken();
    const downloadParam = download ? '&download=true' : '';
    return `${API_BASE_URL}/documents/${docId}/download?token=${token}${downloadParam}`;
  },
  
  view: (docId) => {
    return documentsAPI.download(docId, false);
  },
};

export const unitsAPI = {
  getAll: async () => {
    const data = await apiRequest('/units');
    return data.units || [];
  },
  
  create: async (unitData) => {
    return await apiRequest('/units', {
      method: 'POST',
      body: JSON.stringify(unitData),
    });
  },
  
  update: async (unitId, data) => {
    return await apiRequest(`/units/${unitId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (unitId) => {
    return await apiRequest(`/units/${unitId}`, {
      method: 'DELETE',
    });
  },
  
  getByIds: async (unitIds) => {
    const data = await apiRequest('/units/by-ids', {
      method: 'POST',
      body: JSON.stringify({ ids: unitIds }),
    });
    return data.units || [];
  },
};

export const historyAPI = {
  getAll: async () => {
    const data = await apiRequest('/history');
    return data.history || [];
  },
  
  getById: async (historyId) => {
    const data = await apiRequest(`/history/${historyId}`);
    return data.history;
  },
  
  send: async (documentId, unitIds) => {
    return await apiRequest('/history/send', {
      method: 'POST',
      body: JSON.stringify({
        document_id: documentId,
        unit_ids: unitIds,
      }),
    });
  },
  
  resend: async (documentId, unitId) => {
    return await apiRequest('/history/send', {
      method: 'POST',
      body: JSON.stringify({
        document_id: documentId,
        unit_ids: [unitId],
      }),
    });
  },
};

export const aiAPI = {
  suggestUnits: async (documentId, documentName = '') => {
    const data = await apiRequest('/ai/suggest-units', {
      method: 'POST',
      body: JSON.stringify({ 
        document_id: documentId,
        document_name: documentName
      }),
    });
    return {
      units: data.suggested_units || [],
      hasSuggestions: data.has_suggestions !== false,
      message: data.message || '',
      isFallback: data.is_fallback || false,
      extractedContent: data.extracted_content || null,
      extractedLength: data.extracted_length || 0
    };
  },
  suggestUnitsStream: (documentId, documentName = '', onUpdate, onError) => {
    const token = getToken();
    const url = `${API_BASE_URL}/ai/suggest-units-stream?token=${token}`;
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        document_id: documentId,
        document_name: documentName
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      const readStream = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                onUpdate({
                  units: data.suggested_units || [],
                  hasSuggestions: data.has_suggestions !== false,
                  message: data.message || '',
                  isFallback: data.is_fallback || false,
                  extractedContent: data.extracted_content || null,
                  extractedLength: data.extracted_length || 0,
                  chunkIndex: data.chunk_index || 0,
                  totalChunks: data.total_chunks || 1,
                  isFinal: data.is_final || false
                });
                
                if (data.is_final) {
                  return;
                }
              } catch (e) {
              }
            }
          }
          
          readStream();
        }).catch(err => {
          if (onError) {
            onError(err);
          }
        });
      };
      
      readStream();
    })
    .catch(err => {
      if (onError) {
        onError(err);
      }
    });
  },
  previewContent: async (documentId) => {
    const data = await apiRequest('/ai/preview-content', {
      method: 'POST',
      body: JSON.stringify({ 
        document_id: documentId
      }),
    });
    return {
      extractedContent: data.extracted_content || null,
      extractedLength: data.extracted_length || 0,
      documentName: data.document_name || '',
      filepath: data.filepath || '',
      message: data.message || ''
    };
  },
};

export { getToken, removeToken };

