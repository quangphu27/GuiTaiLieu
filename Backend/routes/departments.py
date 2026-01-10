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
        result = []
        for dept in departments:
            dept_dict = Department.to_dict(dept)
            if dept_dict.get('head_id'):
                head = User.get_by_id(dept_dict['head_id'])
                if head:
                    dept_dict['head'] = User.to_dict(head)
            result.append(dept_dict)
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
        
        if 'head_id' in data and data['head_id']:
            head = User.get_by_id(data['head_id'])
            if not head:
                return jsonify({'message': 'Trưởng phòng không tồn tại'}), 400
            if head.get('role') != 'department_head':
                return jsonify({'message': 'Người dùng này không phải trưởng phòng'}), 400
            department_data['head_id'] = data['head_id']
        
        dept_id, error = Department.create(department_data)
        if error:
            return jsonify({'message': error}), 400
        
        department = Department.get_by_id(dept_id)
        dept_dict = Department.to_dict(department)
        if dept_dict.get('head_id'):
            head = User.get_by_id(dept_dict['head_id'])
            if head:
                dept_dict['head'] = User.to_dict(head)
        return jsonify({
            'message': 'Tạo phòng ban thành công',
            'department': dept_dict
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
        if 'head_id' in data:
            if data['head_id']:
                head = User.get_by_id(data['head_id'])
                if not head:
                    return jsonify({'message': 'Trưởng phòng không tồn tại'}), 400
                if head.get('role') != 'department_head':
                    return jsonify({'message': 'Người dùng này không phải trưởng phòng'}), 400
                update_data['head_id'] = data['head_id']
            else:
                update_data['head_id'] = None
        
        if update_data:
            success, error_msg = Department.update(dept_id, update_data)
            if success:
                updated_dept = Department.get_by_id(dept_id)
                dept_dict = Department.to_dict(updated_dept)
                if dept_dict.get('head_id'):
                    head = User.get_by_id(dept_dict['head_id'])
                    if head:
                        dept_dict['head'] = User.to_dict(head)
                return jsonify({
                    'message': 'Cập nhật phòng ban thành công',
                    'department': dept_dict
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
