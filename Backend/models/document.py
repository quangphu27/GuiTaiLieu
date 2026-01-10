from datetime import datetime
from config.database import get_db


class Document:
    @staticmethod
    def create(data):
        """
        Tạo tài liệu mới. Caller cần truyền kèm 'user_id' để gắn với tài khoản.
        """
        db = get_db()
        from bson import ObjectId
        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        if 'user_id' in data and data['user_id']:
            data['user_id'] = ObjectId(data['user_id']) if isinstance(data['user_id'], str) else data['user_id']
        if 'department_id' in data and data['department_id']:
            data['department_id'] = ObjectId(data['department_id']) if isinstance(data['department_id'], str) else data['department_id']
        result = db.documents.insert_one(data)
        return str(result.inserted_id)

    @staticmethod
    def get_all_by_user(user_id):
        """
        Lấy tất cả tài liệu thuộc về một user cụ thể.
        """
        db = get_db()
        from bson import ObjectId
        try:
            user_obj_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            return list(
                db.documents.find({'user_id': user_obj_id}).sort('created_at', -1)
            )
        except:
            return []

    @staticmethod
    def get_by_id(doc_id):
        """
        Lấy tài liệu theo id (không kiểm tra user). Dùng cho các luồng hệ thống chung.
        """
        db = get_db()
        from bson import ObjectId
        try:
            return db.documents.find_one({'_id': ObjectId(doc_id)})
        except Exception:
            return None

    @staticmethod
    def get_by_id_for_user(doc_id, user_id):
        """
        Lấy tài liệu theo id nhưng chỉ trong phạm vi user sở hữu.
        """
        db = get_db()
        from bson import ObjectId
        try:
            return db.documents.find_one({'_id': ObjectId(doc_id), 'user_id': user_id})
        except Exception:
            return None

    @staticmethod
    def update_for_user(doc_id, user_id, data):
        """
        Cập nhật tài liệu nếu thuộc về user.
        """
        db = get_db()
        from bson import ObjectId
        try:
            data['updated_at'] = datetime.utcnow()
            result = db.documents.update_one(
                {'_id': ObjectId(doc_id), 'user_id': user_id},
                {'$set': data}
            )
            return result.modified_count > 0
        except Exception:
            return False

    @staticmethod
    def delete_for_user(doc_id, user_id):
        """
        Xóa tài liệu nếu thuộc về user.
        """
        db = get_db()
        from bson import ObjectId
        try:
            result = db.documents.delete_one({'_id': ObjectId(doc_id), 'user_id': user_id})
            return result.deleted_count > 0
        except Exception:
            return False

    @staticmethod
    def to_dict(document):
        if not document:
            return None
        document['id'] = str(document['_id'])
        document['date'] = document.get('created_at', datetime.utcnow()).strftime('%Y-%m-%d')
        del document['_id']
        if 'user_id' in document and document['user_id']:
            document['user_id'] = str(document['user_id'])
        if 'department_id' in document and document['department_id']:
            document['department_id'] = str(document['department_id'])
        if 'created_at' in document:
            document['created_at'] = document['created_at'].isoformat()
        if 'updated_at' in document:
            document['updated_at'] = document['updated_at'].isoformat()
        return document


