from flask import Blueprint, request, jsonify
from models.history import History
from models.document import Document
from models.unit import Unit
from models.user import User
from models.department import Department
from config.database import get_db
from utils.jwt_helper import jwt_required as auth_required, get_current_user
from utils.email_service import send_document_email

history_bp = Blueprint('history', __name__)

@history_bp.route('', methods=['GET'])
@auth_required
def get_history():
    try:
        user_id = get_current_user()
        history_list = History.get_all_by_user(user_id)
        result = []
        
        for item in history_list:
            history_dict = History.to_dict(item)
            document = Document.get_by_id_for_user(item.get('document_id'), user_id)
            unit = Unit.get_by_id_for_user(item.get('unit_id'), user_id)
            
            history_dict['documentName'] = document.get('name', 'Tài liệu đã bị xóa') if document else 'Tài liệu đã bị xóa'
            history_dict['unitName'] = unit.get('name', 'Đơn vị đã bị xóa') if unit else 'Đơn vị đã bị xóa'
            history_dict['document_id'] = item.get('document_id')
            history_dict['unit_id'] = item.get('unit_id')
            
            result.append(history_dict)
        
        return jsonify({'history': result}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi lấy lịch sử', 'error': str(e)}), 500

@history_bp.route('/<history_id>', methods=['GET'])
@auth_required
def get_history_detail(history_id):
    try:
        user_id = get_current_user()
        from bson import ObjectId
        db = get_db()
        history_item = db.history.find_one({'_id': ObjectId(history_id), 'user_id': user_id})
        
        if not history_item:
            return jsonify({'message': 'Không tìm thấy lịch sử'}), 404
        
        history_dict = History.to_dict(history_item)
        document = Document.get_by_id_for_user(history_item.get('document_id'), user_id)
        unit = Unit.get_by_id_for_user(history_item.get('unit_id'), user_id)
        
        history_dict['document'] = Document.to_dict(document) if document else None
        history_dict['unit'] = Unit.to_dict(unit) if unit else None
        history_dict['documentName'] = document.get('name', 'Tài liệu đã bị xóa') if document else 'Tài liệu đã bị xóa'
        history_dict['unitName'] = unit.get('name', 'Đơn vị đã bị xóa') if unit else 'Đơn vị đã bị xóa'
        
        return jsonify({'history': history_dict}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi lấy chi tiết lịch sử', 'error': str(e)}), 500

@history_bp.route('/document/<doc_id>', methods=['GET'])
@auth_required
def get_history_by_document(doc_id):
    try:
        user_id = get_current_user()
        history_list = History.get_by_document_id_for_user(doc_id, user_id)
        result = []
        
        for item in history_list:
            history_dict = History.to_dict(item)
            document = Document.get_by_id_for_user(item.get('document_id'), user_id)
            unit = Unit.get_by_id_for_user(item.get('unit_id'), user_id)
            
            history_dict['documentName'] = document.get('name', 'Tài liệu đã bị xóa') if document else 'Tài liệu đã bị xóa'
            history_dict['unitName'] = unit.get('name', 'Đơn vị đã bị xóa') if unit else 'Đơn vị đã bị xóa'
            history_dict['document_id'] = item.get('document_id')
            history_dict['unit_id'] = item.get('unit_id')
            
            result.append(history_dict)
        
        return jsonify({'history': result}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi lấy lịch sử', 'error': str(e)}), 500

@history_bp.route('/send', methods=['POST'])
@auth_required
def send_document():
    try:
        user_id = get_current_user()
        user = User.get_by_id(user_id)
        if not user:
            return jsonify({'message': 'Không tìm thấy người dùng'}), 404
        
        user_role = user.get('role', 'employee')
        user_department_id = user.get('department_id')
        
        data = request.get_json()
        document_id = data.get('document_id')
        unit_ids = data.get('unit_ids', [])
        
        if not document_id or not unit_ids:
            return jsonify({'message': 'Vui lòng chọn tài liệu và đơn vị nhận'}), 400
        
        document = Document.get_by_id_for_user(document_id, user_id)
        if not document:
            return jsonify({'message': 'Không tìm thấy tài liệu'}), 404
        
        if user_role == 'director':
            all_units = Unit.get_by_ids(unit_ids)
        else:
            all_units = Unit.get_by_ids_for_user(unit_ids, user_id)
        
        if not all_units:
            return jsonify({'message': 'Không tìm thấy đơn vị'}), 404
        
        if user_role == 'department_head':
            if not user_department_id:
                return jsonify({'message': 'Bạn chưa được phân công phòng ban'}), 403
            
            units = []
            for unit in all_units:
                unit_dept_id = unit.get('department_id')
                if unit_dept_id and str(unit_dept_id) == str(user_department_id):
                    units.append(unit)
            
            if len(units) != len(unit_ids):
                return jsonify({'message': 'Bạn chỉ có thể gửi tài liệu cho các đơn vị trong phòng ban của mình'}), 403
        elif user_role == 'director':
            units = all_units
        else:
            return jsonify({'message': 'Bạn không có quyền gửi tài liệu'}), 403
        
        import os
        success_count = 0
        failed_count = 0
        failed_units = []
        
        filepath = document.get('filepath')
        document_name = document.get('name', 'Không có tên')
        
        if not filepath or not os.path.exists(filepath):
            return jsonify({
                'message': 'File tài liệu không tồn tại hoặc đã bị xóa',
                'error': 'FILE_NOT_FOUND'
            }), 404
        
        for unit in units:
            from bson import ObjectId
            unit_id = str(unit.get('_id', ''))
            unit_email = unit.get('email', '')
            unit_name = unit.get('name', '')
            
            history_data = {
                'document_id': document_id,
                'unit_id': unit_id,
                'status': 'Đã gửi',
                'user_id': user_id
            }
            
            history_id = History.create(history_data)
            
            email_sent = False
            email_error = None
            
            if unit_email:
                try:
                    email_sent = send_document_email(
                        unit_email,
                        unit_name,
                        document_name,
                        filepath
                    )
                    if not email_sent:
                        email_error = 'Không thể gửi email'
                except Exception as e:
                    email_error = str(e)
            else:
                email_error = 'Đơn vị không có email'
            
            if email_sent:
                success_count += 1
            else:
                failed_count += 1
                failed_units.append({
                    'name': unit_name,
                    'error': email_error or 'Lỗi không xác định'
                })
        
        unit_names = [unit.get('name', '') for unit in units]
        
        response_message = f'Đã gửi "{document_name}" đến {success_count}/{len(unit_ids)} đơn vị'
        if failed_count > 0:
            response_message += f' ({failed_count} đơn vị gửi thất bại)'
        
        return jsonify({
            'message': response_message,
            'success_count': success_count,
            'failed_count': failed_count,
            'unit_names': unit_names,
            'failed_units': failed_units if failed_units else None
        }), 200
    
    except Exception as e:
        return jsonify({'message': 'Lỗi gửi tài liệu', 'error': str(e)}), 500

