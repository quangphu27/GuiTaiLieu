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
                    'username': user['username']
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
        username = data.get('username', '')
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'message': 'Vui lòng nhập đầy đủ thông tin'}), 400
        
        if len(password) < 6:
            return jsonify({'message': 'Mật khẩu phải có ít nhất 6 ký tự'}), 400
        
        existing_user = User.get_by_username(username)
        if existing_user:
            return jsonify({'message': 'Tên đăng nhập đã tồn tại'}), 400
        
        user_id = User.create(username, password)
        token = generate_token(user_id)
        
        return jsonify({
            'message': 'Đăng ký thành công',
            'token': token,
            'user': {
                'id': user_id,
                'username': username
            }
        }), 201
    
    except Exception as e:
        return jsonify({'message': 'Lỗi đăng ký', 'error': str(e)}), 500

@auth_bp.route('/verify', methods=['GET'])
def verify():
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    try:
        verify_jwt_in_request()
        return jsonify({'valid': True, 'user_id': get_jwt_identity()}), 200
    except:
        return jsonify({'valid': False}), 401

