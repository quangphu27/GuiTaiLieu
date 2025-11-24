from flask import Blueprint, request, jsonify, send_file
from models.document import Document
from utils.jwt_helper import jwt_required as auth_required
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import mimetypes

documents_bp = Blueprint('documents', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_size(size_bytes):
    if size_bytes >= 1024 * 1024:
        return f"{(size_bytes / (1024 * 1024)):.2f} MB"
    else:
        return f"{(size_bytes / 1024):.0f} KB"

@documents_bp.route('', methods=['GET'])
@auth_required
def get_documents():
    try:
        documents = Document.get_all()
        result = [Document.to_dict(doc) for doc in documents]
        return jsonify({'documents': result}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi lấy danh sách tài liệu', 'error': str(e)}), 500

@documents_bp.route('', methods=['POST'])
@auth_required
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({'message': 'Không có file được tải lên'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'message': 'Chưa chọn file'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'message': 'Định dạng file không được hỗ trợ'}), 400
        
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(filepath)
        
        file_ext = filename.rsplit('.', 1)[1].upper()
        file_type = 'DOCX' if file_ext == 'DOC' else file_ext
        file_size = get_file_size(os.path.getsize(filepath))
        
        document_data = {
            'name': filename,
            'type': file_type,
            'size': file_size,
            'filename': unique_filename,
            'filepath': filepath,
            'status': 'active'
        }
        
        doc_id = Document.create(document_data)
        document = Document.get_by_id(doc_id)
        
        return jsonify({
            'message': 'Tải lên tài liệu thành công',
            'document': Document.to_dict(document)
        }), 201
    
    except Exception as e:
        return jsonify({'message': 'Lỗi tải lên tài liệu', 'error': str(e)}), 500

@documents_bp.route('/<doc_id>', methods=['PUT'])
@auth_required
def update_document(doc_id):
    try:
        document = Document.get_by_id(doc_id)
        if not document:
            return jsonify({'message': 'Không tìm thấy tài liệu'}), 404
        
        update_data = {}
        old_filepath = document.get('filepath')
        
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename != '':
                if not allowed_file(file.filename):
                    return jsonify({'message': 'Định dạng file không được hỗ trợ'}), 400
                
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                unique_filename = f"{timestamp}_{filename}"
                filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(filepath)
                
                file_ext = filename.rsplit('.', 1)[1].upper()
                file_type = 'DOCX' if file_ext == 'DOC' else file_ext
                file_size = get_file_size(os.path.getsize(filepath))
                
                update_data['name'] = filename
                update_data['type'] = file_type
                update_data['size'] = file_size
                update_data['filename'] = unique_filename
                update_data['filepath'] = filepath
                
                if old_filepath and os.path.exists(old_filepath):
                    try:
                        os.remove(old_filepath)
                    except:
                        pass
        else:
            data = request.get_json() or {}
            if 'name' in data:
                update_data['name'] = data['name']
        
        if update_data:
            success = Document.update(doc_id, update_data)
            if success:
                updated_doc = Document.get_by_id(doc_id)
                return jsonify({
                    'message': 'Cập nhật tài liệu thành công',
                    'document': Document.to_dict(updated_doc)
                }), 200
            else:
                return jsonify({'message': 'Cập nhật tài liệu thất bại'}), 400
        else:
            return jsonify({'message': 'Không có dữ liệu để cập nhật'}), 400
    
    except Exception as e:
        return jsonify({'message': 'Lỗi cập nhật tài liệu', 'error': str(e)}), 500

@documents_bp.route('/<doc_id>', methods=['DELETE'])
@auth_required
def delete_document(doc_id):
    try:
        document = Document.get_by_id(doc_id)
        if not document:
            return jsonify({'message': 'Không tìm thấy tài liệu'}), 404
        
        if 'filepath' in document and os.path.exists(document['filepath']):
            os.remove(document['filepath'])
        
        success = Document.delete(doc_id)
        if success:
            return jsonify({'message': 'Xóa tài liệu thành công'}), 200
        else:
            return jsonify({'message': 'Xóa tài liệu thất bại'}), 400
    
    except Exception as e:
        return jsonify({'message': 'Lỗi xóa tài liệu', 'error': str(e)}), 500

@documents_bp.route('/<doc_id>/download', methods=['GET'])
@auth_required
def download_document(doc_id):
    try:
        document = Document.get_by_id(doc_id)
        if not document:
            return jsonify({'message': 'Không tìm thấy tài liệu'}), 404
        
        filepath = document.get('filepath')
        if not filepath or not os.path.exists(filepath):
            return jsonify({'message': 'File không tồn tại'}), 404
        
        as_attachment = request.args.get('download', 'false').lower() == 'true'
        
        mimetype, _ = mimetypes.guess_type(filepath)
        if not mimetype:
            file_ext = os.path.splitext(filepath)[1].lower()
            mimetype_map = {
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xls': 'application/vnd.ms-excel',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }
            mimetype = mimetype_map.get(file_ext, 'application/octet-stream')
        
        from urllib.parse import quote
        
        if as_attachment:
            response = send_file(
                filepath, 
                mimetype=mimetype,
                as_attachment=True, 
                download_name=document['name']
            )
        else:
            response = send_file(filepath, mimetype=mimetype, as_attachment=False)
            filename_encoded = quote(document['name'].encode('utf-8'))
            response.headers['Content-Disposition'] = f'inline; filename="{document["name"]}"; filename*=UTF-8\'\'{filename_encoded}'
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['Cache-Control'] = 'public, max-age=3600'
        
        return response
    
    except Exception as e:
        return jsonify({'message': 'Lỗi tải file', 'error': str(e)}), 500

