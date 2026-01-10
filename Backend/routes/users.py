from flask import Blueprint, request, jsonify
from models.user import User
from models.department import Department
from utils.jwt_helper import jwt_required as auth_required, get_current_user

users_bp = Blueprint('users', __name__)

def require_director():
    user_id = get_current_user()
    user = User.get_by_id(user_id)
    if not user or user.get('role') != 'director':
        return None
    return user

@users_bp.route('', methods=['GET'])
@auth_required
def get_users():
    try:
        user = require_director()
        if not user:
            return jsonify({'message': 'Chỉ giám đốc mới có quyền xem danh sách người dùng'}), 403
        
        users = User.get_all()
        result = []
        for u in users:
            user_dict = User.to_dict(u)
            if user_dict.get('department_id'):
                dept = Department.get_by_id(user_dict['department_id'])
                if dept:
                    user_dict['department'] = Department.to_dict(dept)
            result.append(user_dict)
        
        return jsonify({'users': result}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi lấy danh sách người dùng', 'error': str(e)}), 500

@users_bp.route('', methods=['POST'])
@auth_required
def create_user():
    try:
        user = require_director()
        if not user:
            return jsonify({'message': 'Chỉ giám đốc mới có quyền tạo tài khoản'}), 403
        
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        role = data.get('role', 'employee')
        department_id = data.get('department_id')
        name = data.get('name', '').strip()
        birth_date = data.get('birth_date')
        phone = data.get('phone', '').strip()
        
        if not username or not password:
            return jsonify({'message': 'Vui lòng nhập đầy đủ thông tin'}), 400
        
        if role not in ['employee', 'department_head']:
            return jsonify({'message': 'Role không hợp lệ'}), 400
        
        if role == 'department_head' and not department_id:
            return jsonify({'message': 'Trưởng phòng phải có phòng ban'}), 400
        
        existing_user = User.get_by_username(username)
        if existing_user:
            return jsonify({'message': 'Tên đăng nhập đã tồn tại'}), 400
        
        if department_id:
            dept = Department.get_by_id(department_id)
            if not dept:
                return jsonify({'message': 'Phòng ban không tồn tại'}), 400
        
        from datetime import datetime as dt
        parsed_birth_date = None
        if birth_date:
            try:
                parsed_birth_date = dt.fromisoformat(birth_date.replace('Z', '+00:00'))
            except:
                try:
                    parsed_birth_date = dt.strptime(birth_date, '%Y-%m-%d')
                except:
                    pass
        
        user_id = User.create(username, password, role=role, department_id=department_id, created_by=str(user['_id']), name=name, birth_date=parsed_birth_date, phone=phone)
        new_user = User.get_by_id(user_id)
        
        return jsonify({
            'message': 'Tạo tài khoản thành công',
            'user': User.to_dict(new_user)
        }), 201
    except Exception as e:
        return jsonify({'message': 'Lỗi tạo tài khoản', 'error': str(e)}), 500

@users_bp.route('/<user_id>', methods=['PUT'])
@auth_required
def update_user(user_id):
    try:
        user = require_director()
        if not user:
            return jsonify({'message': 'Chỉ giám đốc mới có quyền cập nhật tài khoản'}), 403
        
        target_user = User.get_by_id(user_id)
        if not target_user:
            return jsonify({'message': 'Không tìm thấy người dùng'}), 404
        
        data = request.get_json()
        update_data = {}
        
        if 'role' in data:
            if data['role'] not in ['employee', 'department_head']:
                return jsonify({'message': 'Role không hợp lệ'}), 400
            update_data['role'] = data['role']
        
        if 'department_id' in data:
            dept_id = data['department_id']
            if dept_id:
                dept = Department.get_by_id(dept_id)
                if not dept:
                    return jsonify({'message': 'Phòng ban không tồn tại'}), 400
            update_data['department_id'] = dept_id
        
        if 'password' in data and data['password']:
            from models.user import User as UserModel
            import bcrypt
            hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
            update_data['password'] = hashed.decode('utf-8')
        
        if 'name' in data:
            update_data['name'] = data['name'].strip() if data['name'] else None
        
        if 'birth_date' in data:
            if data['birth_date']:
                from datetime import datetime as dt
                try:
                    parsed_birth_date = dt.fromisoformat(data['birth_date'].replace('Z', '+00:00'))
                    update_data['birth_date'] = parsed_birth_date
                except:
                    try:
                        parsed_birth_date = dt.strptime(data['birth_date'], '%Y-%m-%d')
                        update_data['birth_date'] = parsed_birth_date
                    except:
                        pass
            else:
                update_data['birth_date'] = None
        
        if 'phone' in data:
            update_data['phone'] = data['phone'].strip() if data['phone'] else None
        
        if update_data:
            success = User.update(user_id, update_data)
            if success:
                updated_user = User.get_by_id(user_id)
                return jsonify({
                    'message': 'Cập nhật tài khoản thành công',
                    'user': User.to_dict(updated_user)
                }), 200
            else:
                return jsonify({'message': 'Cập nhật tài khoản thất bại'}), 400
        else:
            return jsonify({'message': 'Không có dữ liệu để cập nhật'}), 400
    except Exception as e:
        return jsonify({'message': 'Lỗi cập nhật tài khoản', 'error': str(e)}), 500

@users_bp.route('/<user_id>', methods=['DELETE'])
@auth_required
def delete_user(user_id):
    try:
        user = require_director()
        if not user:
            return jsonify({'message': 'Chỉ giám đốc mới có quyền xóa tài khoản'}), 403
        
        target_user = User.get_by_id(user_id)
        if not target_user:
            return jsonify({'message': 'Không tìm thấy người dùng'}), 404
        
        if str(user['_id']) == user_id:
            return jsonify({'message': 'Không thể xóa chính mình'}), 400
        
        success = User.delete(user_id)
        if success:
            return jsonify({'message': 'Xóa tài khoản thành công'}), 200
        else:
            return jsonify({'message': 'Xóa tài khoản thất bại'}), 400
    except Exception as e:
        return jsonify({'message': 'Lỗi xóa tài khoản', 'error': str(e)}), 500

@users_bp.route('/add-by-email', methods=['POST'])
@auth_required
def add_employee_by_email():
    try:
        current_user_id = get_current_user()
        current_user = User.get_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'Người dùng không tồn tại'}), 401
        
        if current_user.get('role') != 'department_head':
            return jsonify({'message': 'Chỉ trưởng phòng mới có quyền thêm nhân viên'}), 403
        
        department_id = current_user.get('department_id')
        if not department_id:
            return jsonify({'message': 'Trưởng phòng phải có phòng ban'}), 400
        
        data = request.get_json()
        email = data.get('email', '').strip()
        
        if not email:
            return jsonify({'message': 'Vui lòng nhập email'}), 400
        
        existing_user = User.get_by_username(email)
        if not existing_user:
            return jsonify({'message': 'Không tìm thấy nhân viên với email này. Email phải là username của một nhân viên đã tồn tại trong hệ thống'}), 404
        
        if existing_user.get('role') != 'employee':
            return jsonify({'message': 'Người dùng này không phải là nhân viên'}), 400
        
        existing_dept_id = existing_user.get('department_id')
        from models.department import Department
        from bson import ObjectId
        
        if existing_dept_id:
            if str(existing_dept_id) == str(department_id):
                return jsonify({'message': 'Nhân viên này đã thuộc phòng ban của bạn'}), 400
            
            old_dept = Department.get_by_id(existing_dept_id)
            old_dept_name = old_dept.get('name', 'phòng ban khác') if old_dept else 'phòng ban khác'
            return jsonify({'message': f'Nhân viên này đã thuộc {old_dept_name}. Vui lòng xóa nhân viên khỏi phòng ban cũ trước'}), 400
        
        success = User.update(str(existing_user['_id']), {'department_id': department_id})
        if success:
            updated_user = User.get_by_id(str(existing_user['_id']))
            return jsonify({
                'message': 'Thêm nhân viên vào phòng ban thành công',
                'user': User.to_dict(updated_user)
            }), 200
        else:
            return jsonify({'message': 'Cập nhật phòng ban thất bại'}), 400
            
    except Exception as e:
        return jsonify({'message': 'Lỗi thêm nhân viên', 'error': str(e)}), 500

@users_bp.route('/department-employees', methods=['GET'])
@auth_required
def get_department_employees():
    try:
        current_user_id = get_current_user()
        current_user = User.get_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'Người dùng không tồn tại'}), 401
        
        if current_user.get('role') != 'department_head':
            return jsonify({'message': 'Chỉ trưởng phòng mới có quyền xem danh sách nhân viên'}), 403
        
        department_id = current_user.get('department_id')
        if not department_id:
            return jsonify({'message': 'Trưởng phòng phải có phòng ban'}), 400
        
        employees = User.get_by_department(department_id)
        result = []
        for emp in employees:
            if emp.get('role') == 'employee':
                emp_dict = User.to_dict(emp)
                result.append(emp_dict)
        
        return jsonify({'employees': result}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi lấy danh sách nhân viên', 'error': str(e)}), 500

@users_bp.route('/department-employees/<employee_id>', methods=['PUT'])
@auth_required
def update_department_employee(employee_id):
    try:
        current_user_id = get_current_user()
        current_user = User.get_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'Người dùng không tồn tại'}), 401
        
        if current_user.get('role') != 'department_head':
            return jsonify({'message': 'Chỉ trưởng phòng mới có quyền cập nhật nhân viên'}), 403
        
        department_id = current_user.get('department_id')
        if not department_id:
            return jsonify({'message': 'Trưởng phòng phải có phòng ban'}), 400
        
        target_user = User.get_by_id(employee_id)
        if not target_user:
            return jsonify({'message': 'Không tìm thấy nhân viên'}), 404
        
        if target_user.get('department_id') != department_id or target_user.get('role') != 'employee':
            return jsonify({'message': 'Bạn chỉ có quyền quản lý nhân viên trong phòng ban của mình'}), 403
        
        data = request.get_json()
        update_data = {}
        
        if 'name' in data:
            update_data['name'] = data['name'].strip() if data['name'] else None
        
        if 'birth_date' in data:
            if data['birth_date']:
                from datetime import datetime as dt
                try:
                    parsed_birth_date = dt.fromisoformat(data['birth_date'].replace('Z', '+00:00'))
                    update_data['birth_date'] = parsed_birth_date
                except:
                    try:
                        parsed_birth_date = dt.strptime(data['birth_date'], '%Y-%m-%d')
                        update_data['birth_date'] = parsed_birth_date
                    except:
                        pass
            else:
                update_data['birth_date'] = None
        
        if 'phone' in data:
            update_data['phone'] = data['phone'].strip() if data['phone'] else None
        
        if 'password' in data and data['password']:
            import bcrypt
            hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
            update_data['password'] = hashed.decode('utf-8')
        
        if update_data:
            success = User.update(employee_id, update_data)
            if success:
                updated_user = User.get_by_id(employee_id)
                return jsonify({
                    'message': 'Cập nhật nhân viên thành công',
                    'user': User.to_dict(updated_user)
                }), 200
            else:
                return jsonify({'message': 'Cập nhật nhân viên thất bại'}), 400
        else:
            return jsonify({'message': 'Không có dữ liệu để cập nhật'}), 400
    except Exception as e:
        return jsonify({'message': 'Lỗi cập nhật nhân viên', 'error': str(e)}), 500

@users_bp.route('/department-employees/<employee_id>', methods=['DELETE'])
@auth_required
def delete_department_employee(employee_id):
    try:
        current_user_id = get_current_user()
        current_user = User.get_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'Người dùng không tồn tại'}), 401
        
        if current_user.get('role') != 'department_head':
            return jsonify({'message': 'Chỉ trưởng phòng mới có quyền xóa nhân viên'}), 403
        
        department_id = current_user.get('department_id')
        if not department_id:
            return jsonify({'message': 'Trưởng phòng phải có phòng ban'}), 400
        
        target_user = User.get_by_id(employee_id)
        if not target_user:
            return jsonify({'message': 'Không tìm thấy nhân viên'}), 404
        
        if target_user.get('department_id') != department_id or target_user.get('role') != 'employee':
            return jsonify({'message': 'Bạn chỉ có quyền xóa nhân viên trong phòng ban của mình'}), 403
        
        success = User.update(employee_id, {'department_id': None})
        if success:
            return jsonify({'message': 'Xóa nhân viên khỏi phòng ban thành công'}), 200
        else:
            return jsonify({'message': 'Xóa nhân viên thất bại'}), 400
    except Exception as e:
        return jsonify({'message': 'Lỗi xóa nhân viên', 'error': str(e)}), 500