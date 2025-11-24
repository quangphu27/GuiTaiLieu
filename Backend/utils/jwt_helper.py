from flask_jwt_extended import create_access_token, get_jwt_identity
from functools import wraps
from flask import jsonify

def generate_token(user_id):
    return create_access_token(identity=str(user_id))

def get_current_user():
    return get_jwt_identity()

def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({'message': 'Token không hợp lệ', 'error': str(e)}), 401
        return f(*args, **kwargs)
    return decorated_function

