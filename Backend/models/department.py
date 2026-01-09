from datetime import datetime
from config.database import get_db
from pymongo.errors import DuplicateKeyError

class Department:
    @staticmethod
    def create(data):
        db = get_db()
        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        try:
            result = db.departments.insert_one(data)
            return str(result.inserted_id), None
        except DuplicateKeyError as e:
            field = str(e).split('index: ')[1].split('_')[0] if 'index:' in str(e) else 'field'
            return None, f"{field.capitalize()} đã tồn tại"

    @staticmethod
    def get_all():
        db = get_db()
        return list(db.departments.find().sort('created_at', -1))

    @staticmethod
    def get_by_id(department_id):
        db = get_db()
        from bson import ObjectId
        try:
            return db.departments.find_one({'_id': ObjectId(department_id)})
        except:
            return None

    @staticmethod
    def update(department_id, data):
        db = get_db()
        from bson import ObjectId
        try:
            data['updated_at'] = datetime.utcnow()
            result = db.departments.update_one(
                {'_id': ObjectId(department_id)},
                {'$set': data}
            )
            return result.modified_count > 0, None
        except DuplicateKeyError as e:
            field = str(e).split('index: ')[1].split('_')[0] if 'index:' in str(e) else 'field'
            return False, f"{field.capitalize()} đã tồn tại"
        except Exception as e:
            return False, str(e)

    @staticmethod
    def delete(department_id):
        db = get_db()
        from bson import ObjectId
        try:
            result = db.departments.delete_one({'_id': ObjectId(department_id)})
            return result.deleted_count > 0
        except:
            return False

    @staticmethod
    def to_dict(department):
        if not department:
            return None
        department['id'] = str(department['_id'])
        del department['_id']
        if 'created_at' in department:
            department['created_at'] = department['created_at'].isoformat()
        if 'updated_at' in department:
            department['updated_at'] = department['updated_at'].isoformat()
        return department
