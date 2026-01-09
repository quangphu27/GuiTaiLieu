from flask import Blueprint, request, jsonify
from models.unit import Unit
from utils.jwt_helper import jwt_required as auth_required, get_current_user

units_bp = Blueprint('units', __name__)

@units_bp.route('', methods=['GET'])
@auth_required
def get_units():
    try:
        from models.user import User
        user_id = get_current_user()
        user = User.get_by_id(user_id)
        if not user:
            return jsonify({'message': 'Không tìm thấy người dùng'}), 404
        
        user_role = user.get('role', 'employee')
        user_department_id = user.get('department_id')
        
        if user_role == 'director':
            all_units = Unit.get_all()
            units = [u for u in all_units]
        elif user_role == 'department_head':
            if not user_department_id:
                units = []
            else:
                all_units = Unit.get_all()
                units = [u for u in all_units if u.get('department_id') and str(u.get('department_id')) == str(user_department_id)]
        else:
            units = Unit.get_all_by_user(user_id)
        
        result = [Unit.to_dict(unit) for unit in units]
        return jsonify({'units': result}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi lấy danh sách đơn vị', 'error': str(e)}), 500

@units_bp.route('', methods=['POST'])
@auth_required
def create_unit():
    try:
        from models.user import User
        user_id = get_current_user()
        user = User.get_by_id(user_id)
        if not user:
            return jsonify({'message': 'Không tìm thấy người dùng'}), 404
        
        data = request.get_json()
        
        if not data.get('name') or not data.get('code') or not data.get('email'):
            return jsonify({'message': 'Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Mã, Email)'}), 400
        
        user_role = user.get('role', 'employee')
        user_department_id = user.get('department_id')
        
        department_id = data.get('department_id')
        if user_role == 'department_head':
            department_id = user_department_id
        elif user_role == 'director':
            department_id = data.get('department_id')

        unit_data = {
            'name': data['name'],
            'code': data['code'].upper(),
            'email': data['email'],
            'phone': data.get('phone', 'Chưa có'),
            'address': data.get('address', 'Chưa có'),
            'user_id': user_id,
            'department_id': department_id
        }
        
        unit_id, error = Unit.create(unit_data)
        
        if error:
            return jsonify({'message': error}), 400
        
        unit = Unit.get_by_id(unit_id)
        return jsonify({
            'message': 'Thêm đơn vị mới thành công',
            'unit': Unit.to_dict(unit)
        }), 201
    
    except Exception as e:
        return jsonify({'message': 'Lỗi thêm đơn vị', 'error': str(e)}), 500

@units_bp.route('/<unit_id>', methods=['PUT'])
@auth_required
def update_unit(unit_id):
    try:
        user_id = get_current_user()
        unit = Unit.get_by_id_for_user(unit_id, user_id)
        if not unit:
            return jsonify({'message': 'Không tìm thấy đơn vị'}), 404
        
        data = request.get_json()
        update_data = {}
        
        if 'name' in data:
            update_data['name'] = data['name']
        if 'code' in data:
            update_data['code'] = data['code'].upper()
        if 'email' in data:
            update_data['email'] = data['email']
        if 'phone' in data:
            update_data['phone'] = data['phone']
        if 'address' in data:
            update_data['address'] = data['address']
        if 'department_id' in data:
            from models.user import User
            current_user_id = get_current_user()
            current_user = User.get_by_id(current_user_id)
            if current_user and current_user.get('role') == 'director':
                update_data['department_id'] = data['department_id']
        
        if update_data:
            success, error_msg = Unit.update_for_user(unit_id, user_id, update_data)
            if success:
                updated_unit = Unit.get_by_id(unit_id)
                return jsonify({
                    'message': 'Cập nhật đơn vị thành công',
                    'unit': Unit.to_dict(updated_unit)
                }), 200
            else:
                return jsonify({'message': error_msg or 'Cập nhật đơn vị thất bại'}), 400
        else:
            return jsonify({'message': 'Không có dữ liệu để cập nhật'}), 400
    
    except Exception as e:
        return jsonify({'message': 'Lỗi cập nhật đơn vị', 'error': str(e)}), 500

@units_bp.route('/<unit_id>', methods=['DELETE'])
@auth_required
def delete_unit(unit_id):
    try:
        user_id = get_current_user()
        unit = Unit.get_by_id_for_user(unit_id, user_id)
        if not unit:
            return jsonify({'message': 'Không tìm thấy đơn vị'}), 404
        
        success = Unit.delete_for_user(unit_id, user_id)
        if success:
            return jsonify({'message': 'Xóa đơn vị thành công'}), 200
        else:
            return jsonify({'message': 'Xóa đơn vị thất bại'}), 400
    
    except Exception as e:
        return jsonify({'message': 'Lỗi xóa đơn vị', 'error': str(e)}), 500

@units_bp.route('/by-ids', methods=['POST'])
@auth_required
def get_units_by_ids():
    try:
        from models.user import User
        data = request.get_json()
        unit_ids = data.get('ids', [])
        
        user_id = get_current_user()
        user = User.get_by_id(user_id)
        if not user:
            return jsonify({'message': 'Không tìm thấy người dùng'}), 404
        
        user_role = user.get('role', 'employee')
        user_department_id = user.get('department_id')
        
        if user_role == 'director':
            units = Unit.get_by_ids(unit_ids)
        elif user_role == 'department_head':
            if not user_department_id:
                units = []
            else:
                all_units = Unit.get_by_ids(unit_ids)
                units = [u for u in all_units if u.get('department_id') and str(u.get('department_id')) == str(user_department_id)]
        else:
            units = Unit.get_by_ids_for_user(unit_ids, user_id)
        
        result = [Unit.to_dict(unit) for unit in units]
        return jsonify({'units': result}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi lấy danh sách đơn vị', 'error': str(e)}), 500

