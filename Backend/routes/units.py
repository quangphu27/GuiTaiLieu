from flask import Blueprint, request, jsonify
from models.unit import Unit
from utils.jwt_helper import jwt_required as auth_required, get_current_user
from datetime import datetime

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
        elif user_role == 'department_head' or user_role == 'employee':
            if not user_department_id:
                if user_role == 'employee':
                    units = Unit.get_all_by_user(user_id)
                else:
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
        
        if user_role == 'employee':
            return jsonify({'message': 'Nhân viên không có quyền tạo đơn vị'}), 403
        
        from bson import ObjectId
        department_id = data.get('department_id')
        if user_role == 'department_head':
            if not user_department_id:
                return jsonify({'message': 'Trưởng phòng phải có phòng ban'}), 400
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
        from models.user import User
        user_id = get_current_user()
        current_user = User.get_by_id(user_id)
        if not current_user:
            return jsonify({'message': 'Người dùng không tồn tại'}), 401
        
        unit = Unit.get_by_id(unit_id)
        if not unit:
            return jsonify({'message': 'Không tìm thấy đơn vị'}), 404
        
        user_role = current_user.get('role', 'employee')
        user_department_id = current_user.get('department_id')
        
        if user_role == 'employee':
            return jsonify({'message': 'Nhân viên không có quyền chỉnh sửa đơn vị'}), 403
        
        can_edit = False
        if user_role == 'director':
            can_edit = True
        elif user_role == 'department_head' and user_department_id:
            if unit.get('department_id') and str(unit.get('department_id')) == str(user_department_id):
                can_edit = True
        elif unit.get('user_id') == user_id:
            can_edit = True
        
        if not can_edit:
            return jsonify({'message': 'Bạn không có quyền chỉnh sửa đơn vị này'}), 403
        
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
            db = get_db()
            from bson import ObjectId
            if 'code' in update_data:
                update_data['code'] = update_data['code'].upper()
            update_data['updated_at'] = datetime.utcnow()
            
            if user_role == 'director' and 'department_id' in update_data:
                pass
            else:
                if 'department_id' in update_data:
                    del update_data['department_id']
            
            result = db.units.update_one(
                {'_id': ObjectId(unit_id)},
                {'$set': update_data}
            )
            if result.modified_count > 0:
                updated_unit = Unit.get_by_id(unit_id)
                return jsonify({
                    'message': 'Cập nhật đơn vị thành công',
                    'unit': Unit.to_dict(updated_unit)
                }), 200
            else:
                return jsonify({'message': 'Cập nhật đơn vị thất bại'}), 400
        else:
            return jsonify({'message': 'Không có dữ liệu để cập nhật'}), 400
    
    except Exception as e:
        return jsonify({'message': 'Lỗi cập nhật đơn vị', 'error': str(e)}), 500

@units_bp.route('/<unit_id>', methods=['DELETE'])
@auth_required
def delete_unit(unit_id):
    try:
        from models.user import User
        from datetime import datetime
        user_id = get_current_user()
        current_user = User.get_by_id(user_id)
        if not current_user:
            return jsonify({'message': 'Người dùng không tồn tại'}), 401
        
        unit = Unit.get_by_id(unit_id)
        if not unit:
            return jsonify({'message': 'Không tìm thấy đơn vị'}), 404
        
        user_role = current_user.get('role', 'employee')
        user_department_id = current_user.get('department_id')
        
        if user_role == 'employee':
            return jsonify({'message': 'Nhân viên không có quyền xóa đơn vị'}), 403
        
        can_delete = False
        if user_role == 'director':
            can_delete = True
        elif user_role == 'department_head' and user_department_id:
            if unit.get('department_id') and str(unit.get('department_id')) == str(user_department_id):
                can_delete = True
        elif unit.get('user_id') == user_id:
            can_delete = True
        
        if not can_delete:
            return jsonify({'message': 'Bạn không có quyền xóa đơn vị này'}), 403
        
        db = get_db()
        from bson import ObjectId
        result = db.units.delete_one({'_id': ObjectId(unit_id)})
        if result.deleted_count > 0:
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
        elif user_role == 'department_head' or user_role == 'employee':
            if not user_department_id:
                if user_role == 'employee':
                    units = Unit.get_by_ids_for_user(unit_ids, user_id)
                else:
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

