from flask import Blueprint, request, jsonify
from models.department import Department
from models.user import User
from utils.jwt_helper import jwt_required as auth_required, get_current_user

departments_bp = Blueprint('departments', __name__)

def require_director():
    user_id = get_current_user()
    user = User.get_by_id(user_id)
    if not user or user.get('role') != 'director':
        return None
    return user

@departments_bp.route('', methods=['GET'])
@auth_required
def get_departments():
    try:
        user = require_director()
        if not user:
            return jsonify({'message': 'Chỉ giám đốc mới có quyền xem danh sách phòng ban'}), 403
        
        departments = Department.get_all()
        result = [Department.to_dict(dept) for dept in departments]
        return jsonify({'departments': result}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi lấy danh sách phòng ban', 'error': str(e)}), 500

@departments_bp.route('', methods=['POST'])
@auth_required
def create_department():
    try:
        user = require_director()
        if not user:
            return jsonify({'message': 'Chỉ giám đốc mới có quyền tạo phòng ban'}), 403
        
        data = request.get_json()
        if not data.get('name'):
            return jsonify({'message': 'Vui lòng nhập tên phòng ban'}), 400
        
        department_data = {
            'name': data['name'],
            'description': data.get('description', '')
        }
        
        dept_id, error = Department.create(department_data)
        if error:
            return jsonify({'message': error}), 400
        
        department = Department.get_by_id(dept_id)
        return jsonify({
            'message': 'Tạo phòng ban thành công',
            'department': Department.to_dict(department)
        }), 201
    except Exception as e:
        return jsonify({'message': 'Lỗi tạo phòng ban', 'error': str(e)}), 500

@departments_bp.route('/<dept_id>', methods=['PUT'])
@auth_required
def update_department(dept_id):
    try:
        user = require_director()
        if not user:
            return jsonify({'message': 'Chỉ giám đốc mới có quyền cập nhật phòng ban'}), 403
        
        department = Department.get_by_id(dept_id)
        if not department:
            return jsonify({'message': 'Không tìm thấy phòng ban'}), 404
        
        data = request.get_json()
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'description' in data:
            update_data['description'] = data['description']
        
        if update_data:
            success, error_msg = Department.update(dept_id, update_data)
            if success:
                updated_dept = Department.get_by_id(dept_id)
                return jsonify({
                    'message': 'Cập nhật phòng ban thành công',
                    'department': Department.to_dict(updated_dept)
                }), 200
            else:
                return jsonify({'message': error_msg or 'Cập nhật phòng ban thất bại'}), 400
        else:
            return jsonify({'message': 'Không có dữ liệu để cập nhật'}), 400
    except Exception as e:
        return jsonify({'message': 'Lỗi cập nhật phòng ban', 'error': str(e)}), 500

@departments_bp.route('/<dept_id>', methods=['DELETE'])
@auth_required
def delete_department(dept_id):
    try:
        user = require_director()
        if not user:
            return jsonify({'message': 'Chỉ giám đốc mới có quyền xóa phòng ban'}), 403
        
        department = Department.get_by_id(dept_id)
        if not department:
            return jsonify({'message': 'Không tìm thấy phòng ban'}), 404
        
        success = Department.delete(dept_id)
        if success:
            return jsonify({'message': 'Xóa phòng ban thành công'}), 200
        else:
            return jsonify({'message': 'Xóa phòng ban thất bại'}), 400
    except Exception as e:
        return jsonify({'message': 'Lỗi xóa phòng ban', 'error': str(e)}), 500
