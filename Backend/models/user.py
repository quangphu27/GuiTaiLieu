from datetime import datetime
from config.database import get_db
import bcrypt

class User:
    @staticmethod
    def create(username, password):
        db = get_db()
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user = {
            'username': username,
            'password': hashed.decode('utf-8'),
            'created_at': datetime.utcnow()
        }
        result = db.users.insert_one(user)
        return str(result.inserted_id)
    
    @staticmethod
    def get_by_username(username):
        db = get_db()
        return db.users.find_one({'username': username})
    
    @staticmethod
    def verify_password(stored_password, provided_password):
        return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password.encode('utf-8'))
    
    @staticmethod
    def init_default_user():
        db = get_db()
        if not db.users.find_one({'username': 'admin'}):
            User.create('admin', 'admin123')

