from datetime import datetime
from config.database import get_db


class History:
    @staticmethod
    def create(data):
        """
        Tạo bản ghi lịch sử. Caller nên truyền kèm 'user_id' để gắn với tài khoản.
        """
        db = get_db()
        data['created_at'] = datetime.utcnow()
        result = db.history.insert_one(data)
        return str(result.inserted_id)

    @staticmethod
    def get_all():
        """
        Hàm cũ, giữ lại nếu có luồng hệ thống dùng chung.
        """
        db = get_db()
        return list(db.history.find().sort('created_at', -1))

    @staticmethod
    def get_all_by_user(user_id):
        """
        Lấy toàn bộ lịch sử theo user.
        """
        db = get_db()
        return list(
            db.history.find({'user_id': user_id}).sort('created_at', -1)
        )

    @staticmethod
    def get_by_document_id(doc_id):
        db = get_db()
        return list(db.history.find({'document_id': doc_id}))

    @staticmethod
    def get_by_document_id_for_user(doc_id, user_id):
        db = get_db()
        return list(
            db.history.find({'document_id': doc_id, 'user_id': user_id})
        )

    @staticmethod
    def to_dict(history_item):
        if not history_item:
            return None
        history_item['id'] = str(history_item['_id'])
        history_item['date'] = history_item.get('created_at', datetime.utcnow()).strftime('%Y-%m-%d %H:%M')
        del history_item['_id']
        if 'created_at' in history_item:
            history_item['created_at'] = history_item['created_at'].isoformat()
        return history_item


