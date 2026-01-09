from flask import Blueprint, request, jsonify
from models.user import User
from utils.jwt_helper import generate_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username', '')
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'message': 'Vui lòng nhập đầy đủ thông tin'}), 400
        
        user = User.get_by_username(username)
        
        if not user:
            User.init_default_user()
            user = User.get_by_username(username)
        
        if user and User.verify_password(user['password'], password):
            token = generate_token(str(user['_id']))
            return jsonify({
                'message': 'Đăng nhập thành công',
                'token': token,
                'user': {
                    'id': str(user['_id']),
                    'username': user['username'],
                    'role': user.get('role', 'employee'),
                    'department_id': str(user.get('department_id')) if user.get('department_id') else None
                }
            }), 200
        else:
            return jsonify({'message': 'Tên đăng nhập hoặc mật khẩu không đúng'}), 401
    
    except Exception as e:
        return jsonify({'message': 'Lỗi đăng nhập', 'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        errors = {}
        
        if not username:
            errors['username'] = 'Vui lòng nhập tên đăng nhập'
        elif len(username) < 3:
            errors['username'] = 'Tên đăng nhập phải có ít nhất 3 ký tự'
        elif len(username) > 50:
            errors['username'] = 'Tên đăng nhập không được vượt quá 50 ký tự'
        else:
            existing_user = User.get_by_username(username)
            if existing_user:
                errors['username'] = 'Tên đăng nhập đã tồn tại'
        
        if not password:
            errors['password'] = 'Vui lòng nhập mật khẩu'
        elif len(password) < 6:
            errors['password'] = 'Mật khẩu phải có ít nhất 6 ký tự'
        elif len(password) > 100:
            errors['password'] = 'Mật khẩu không được vượt quá 100 ký tự'
        
        if errors:
            return jsonify({
                'message': 'Vui lòng kiểm tra lại thông tin đăng ký',
                'errors': errors
            }), 400
        
        user_id = User.create(username, password, role='employee')
        token = generate_token(user_id)
        user = User.get_by_id(user_id)
        
        return jsonify({
            'message': 'Đăng ký thành công',
            'token': token,
            'user': {
                'id': user_id,
                'username': username,
                'role': user.get('role', 'employee'),
                'department_id': str(user.get('department_id')) if user.get('department_id') else None
            }
        }), 201
    
    except Exception as e:
        return jsonify({
            'message': 'Lỗi đăng ký',
            'error': str(e),
            'errors': {'general': 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.'}
        }), 500

@auth_bp.route('/verify', methods=['GET'])
def verify():
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    from models.user import User
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)
        if user:
            return jsonify({
                'valid': True, 
                'user_id': user_id,
                'user': {
                    'id': str(user['_id']),
                    'username': user['username'],
                    'role': user.get('role', 'employee'),
                    'department_id': str(user.get('department_id')) if user.get('department_id') else None
                }
            }), 200
        return jsonify({'valid': False}), 401
    except:
        return jsonify({'valid': False}), 401

