from datetime import datetime
from config.database import get_db

class Document:
    @staticmethod
    def create(data):
        db = get_db()
        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        result = db.documents.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_all():
        db = get_db()
        return list(db.documents.find().sort('created_at', -1))
    
    @staticmethod
    def get_by_id(doc_id):
        db = get_db()
        from bson import ObjectId
        try:
            return db.documents.find_one({'_id': ObjectId(doc_id)})
        except:
            return None
    
    @staticmethod
    def update(doc_id, data):
        db = get_db()
        from bson import ObjectId
        try:
            data['updated_at'] = datetime.utcnow()
            result = db.documents.update_one(
                {'_id': ObjectId(doc_id)},
                {'$set': data}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def delete(doc_id):
        db = get_db()
        from bson import ObjectId
        try:
            result = db.documents.delete_one({'_id': ObjectId(doc_id)})
            return result.deleted_count > 0
        except:
            return False
    
    @staticmethod
    def to_dict(document):
        if not document:
            return None
        document['id'] = str(document['_id'])
        document['date'] = document.get('created_at', datetime.utcnow()).strftime('%Y-%m-%d')
        del document['_id']
        if 'created_at' in document:
            document['created_at'] = document['created_at'].isoformat()
        if 'updated_at' in document:
            document['updated_at'] = document['updated_at'].isoformat()
        return document

