from datetime import datetime
from config.database import get_db
import bcrypt

class User:
    @staticmethod
    def create(username, password, role='employee', department_id=None, created_by=None, name=None, birth_date=None, phone=None):
        db = get_db()
        from bson import ObjectId
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user = {
            'username': username,
            'password': hashed.decode('utf-8'),
            'role': role,
            'department_id': ObjectId(department_id) if department_id and isinstance(department_id, str) else (department_id if department_id else None),
            'created_by': ObjectId(created_by) if created_by and isinstance(created_by, str) else (created_by if created_by else None),
            'name': name,
            'birth_date': birth_date,
            'phone': phone,
            'created_at': datetime.utcnow()
        }
        result = db.users.insert_one(user)
        return str(result.inserted_id)
    
    @staticmethod
    def get_by_username(username):
        db = get_db()
        return db.users.find_one({'username': username})
    
    @staticmethod
    def get_by_id(user_id):
        db = get_db()
        from bson import ObjectId
        try:
            return db.users.find_one({'_id': ObjectId(user_id)})
        except:
            return None
    
    @staticmethod
    def get_all():
        db = get_db()
        return list(db.users.find().sort('created_at', -1))
    
    @staticmethod
    def get_by_role(role):
        db = get_db()
        return list(db.users.find({'role': role}).sort('created_at', -1))
    
    @staticmethod
    def get_by_department(department_id):
        db = get_db()
        from bson import ObjectId
        try:
            if not department_id:
                return []
            dept_obj_id = ObjectId(department_id) if isinstance(department_id, str) else department_id
            dept_str_id = str(department_id)
            return list(db.users.find({
                '$or': [
                    {'department_id': dept_obj_id},
                    {'department_id': dept_str_id}
                ]
            }).sort('created_at', -1))
        except Exception as e:
            import traceback
            traceback.print_exc()
            return []
    
    @staticmethod
    def update(user_id, data):
        db = get_db()
        from bson import ObjectId
        try:
            data['updated_at'] = datetime.utcnow()
            if 'department_id' in data and data['department_id']:
                data['department_id'] = ObjectId(data['department_id']) if isinstance(data['department_id'], str) else data['department_id']
            elif 'department_id' in data and data['department_id'] is None:
                data['department_id'] = None
            if 'created_by' in data and data['created_by']:
                data['created_by'] = ObjectId(data['created_by']) if isinstance(data['created_by'], str) else data['created_by']
            result = db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': data}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def delete(user_id):
        db = get_db()
        from bson import ObjectId
        try:
            result = db.users.delete_one({'_id': ObjectId(user_id)})
            return result.deleted_count > 0
        except:
            return False
    
    @staticmethod
    def verify_password(stored_password, provided_password):
        return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password.encode('utf-8'))
    
    # @staticmethod
    # def init_default_user():
    #     db = get_db()
    #     if not db.users.find_one({'username': 'admin'}):
    #         User.create('admin', 'admin123', 'director')
    
    @staticmethod
    def to_dict(user):
        if not user:
            return None
        user['id'] = str(user['_id'])
        del user['_id']
        if 'password' in user:
            del user['password']
        if 'created_at' in user:
            user['created_at'] = user['created_at'].isoformat()
        if 'updated_at' in user:
            user['updated_at'] = user['updated_at'].isoformat()
        if 'birth_date' in user and user['birth_date']:
            if isinstance(user['birth_date'], datetime):
                user['birth_date'] = user['birth_date'].isoformat()
            elif isinstance(user['birth_date'], str):
                pass
        return user

