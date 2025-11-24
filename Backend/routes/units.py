from flask import Blueprint, request, jsonify
from models.unit import Unit
from utils.jwt_helper import jwt_required as auth_required

units_bp = Blueprint('units', __name__)

@units_bp.route('', methods=['GET'])
@auth_required
def get_units():
    try:
        units = Unit.get_all()
        result = [Unit.to_dict(unit) for unit in units]
        return jsonify({'units': result}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi lấy danh sách đơn vị', 'error': str(e)}), 500

@units_bp.route('', methods=['POST'])
@auth_required
def create_unit():
    try:
        data = request.get_json()
        
        if not data.get('name') or not data.get('code') or not data.get('email'):
            return jsonify({'message': 'Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Mã, Email)'}), 400
        
        unit_data = {
            'name': data['name'],
            'code': data['code'].upper(),
            'email': data['email'],
            'phone': data.get('phone', 'Chưa có'),
            'address': data.get('address', 'Chưa có')
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
        unit = Unit.get_by_id(unit_id)
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
        
        if update_data:
            success, error_msg = Unit.update(unit_id, update_data)
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
        unit = Unit.get_by_id(unit_id)
        if not unit:
            return jsonify({'message': 'Không tìm thấy đơn vị'}), 404
        
        success = Unit.delete(unit_id)
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
        data = request.get_json()
        unit_ids = data.get('ids', [])
        
        units = Unit.get_by_ids(unit_ids)
        result = [Unit.to_dict(unit) for unit in units]
        
        return jsonify({'units': result}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi lấy danh sách đơn vị', 'error': str(e)}), 500

