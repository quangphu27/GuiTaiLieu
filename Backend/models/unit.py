from datetime import datetime
from config.database import get_db
from pymongo.errors import DuplicateKeyError


class Unit:
    @staticmethod
    def create(data):
        """
        Tạo đơn vị mới. Caller cần truyền kèm 'user_id' để gắn với tài khoản.
        """
        db = get_db()
        from bson import ObjectId
        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        if 'department_id' in data and data['department_id']:
            data['department_id'] = ObjectId(data['department_id']) if isinstance(data['department_id'], str) else data['department_id']
        if 'user_id' in data and data['user_id']:
            data['user_id'] = ObjectId(data['user_id']) if isinstance(data['user_id'], str) else data['user_id']
        try:
            result = db.units.insert_one(data)
            return str(result.inserted_id), None
        except DuplicateKeyError as e:
            field = str(e).split('index: ')[1].split('_')[0] if 'index:' in str(e) else 'field'
            return None, f"{field.capitalize()} đã tồn tại"

    @staticmethod
    def get_all_by_user(user_id):
        """
        Lấy tất cả đơn vị thuộc về một user cụ thể.
        """
        db = get_db()
        return list(
            db.units.find({'user_id': user_id}).sort('created_at', -1)
        )

    @staticmethod
    def get_all():
        """
        Hàm cũ, vẫn giữ cho các luồng hệ thống nếu cần dùng chung.
        """
        db = get_db()
        return list(db.units.find().sort('created_at', -1))

    @staticmethod
    def get_by_id(unit_id):
        db = get_db()
        from bson import ObjectId
        try:
            return db.units.find_one({'_id': ObjectId(unit_id)})
        except Exception:
            return None

    @staticmethod
    def get_by_id_for_user(unit_id, user_id):
        db = get_db()
        from bson import ObjectId
        try:
            return db.units.find_one({'_id': ObjectId(unit_id), 'user_id': user_id})
        except Exception:
            return None

    @staticmethod
    def get_by_ids(unit_ids):
        db = get_db()
        from bson import ObjectId
        try:
            object_ids = [ObjectId(uid) for uid in unit_ids]
            return list(db.units.find({'_id': {'$in': object_ids}}))
        except Exception:
            return []

    @staticmethod
    def get_by_ids_for_user(unit_ids, user_id):
        db = get_db()
        from bson import ObjectId
        try:
            object_ids = [ObjectId(uid) for uid in unit_ids]
            return list(
                db.units.find(
                    {'_id': {'$in': object_ids}, 'user_id': user_id}
                )
            )
        except Exception:
            return []

    @staticmethod
    def update_for_user(unit_id, user_id, data):
        db = get_db()
        from bson import ObjectId
        try:
            data['updated_at'] = datetime.utcnow()
            if 'code' in data:
                data['code'] = data['code'].upper()

            result = db.units.update_one(
                {'_id': ObjectId(unit_id), 'user_id': user_id},
                {'$set': data}
            )
            return result.modified_count > 0, None
        except DuplicateKeyError as e:
            field = str(e).split('index: ')[1].split('_')[0] if 'index:' in str(e) else 'field'
            return False, f"{field.capitalize()} đã tồn tại"
        except Exception as e:
            return False, str(e)

    @staticmethod
    def delete_for_user(unit_id, user_id):
        db = get_db()
        from bson import ObjectId
        try:
            result = db.units.delete_one({'_id': ObjectId(unit_id), 'user_id': user_id})
            return result.deleted_count > 0
        except Exception:
            return False

    @staticmethod
    def delete(unit_id):
        """
        Hàm xóa cũ, giữ lại cho các luồng hệ thống nếu cần.
        """
        db = get_db()
        from bson import ObjectId
        try:
            result = db.units.delete_one({'_id': ObjectId(unit_id)})
            return result.deleted_count > 0
        except Exception:
            return False

    @staticmethod
    def to_dict(unit):
        if not unit:
            return None
        unit['id'] = str(unit['_id'])
        del unit['_id']
        if 'user_id' in unit and unit['user_id']:
            unit['user_id'] = str(unit['user_id'])
        if 'department_id' in unit and unit['department_id']:
            unit['department_id'] = str(unit['department_id'])
        if 'created_at' in unit:
            unit['created_at'] = unit['created_at'].isoformat()
        if 'updated_at' in unit:
            unit['updated_at'] = unit['updated_at'].isoformat()
        return unit


