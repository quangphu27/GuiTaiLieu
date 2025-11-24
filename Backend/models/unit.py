from datetime import datetime
from config.database import get_db
from pymongo.errors import DuplicateKeyError

class Unit:
    @staticmethod
    def create(data):
        db = get_db()
        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        try:
            result = db.units.insert_one(data)
            return str(result.inserted_id), None
        except DuplicateKeyError as e:
            field = str(e).split('index: ')[1].split('_')[0] if 'index:' in str(e) else 'field'
            return None, f"{field.capitalize()} đã tồn tại"
    
    @staticmethod
    def get_all():
        db = get_db()
        return list(db.units.find().sort('created_at', -1))
    
    @staticmethod
    def get_by_id(unit_id):
        db = get_db()
        from bson import ObjectId
        try:
            return db.units.find_one({'_id': ObjectId(unit_id)})
        except:
            return None
    
    @staticmethod
    def get_by_ids(unit_ids):
        db = get_db()
        from bson import ObjectId
        try:
            object_ids = [ObjectId(uid) for uid in unit_ids]
            return list(db.units.find({'_id': {'$in': object_ids}}))
        except:
            return []
    
    @staticmethod
    def update(unit_id, data):
        db = get_db()
        from bson import ObjectId
        try:
            data['updated_at'] = datetime.utcnow()
            if 'code' in data:
                data['code'] = data['code'].upper()
            
            result = db.units.update_one(
                {'_id': ObjectId(unit_id)},
                {'$set': data}
            )
            return result.modified_count > 0, None
        except DuplicateKeyError as e:
            field = str(e).split('index: ')[1].split('_')[0] if 'index:' in str(e) else 'field'
            return False, f"{field.capitalize()} đã tồn tại"
        except Exception as e:
            return False, str(e)
    
    @staticmethod
    def delete(unit_id):
        db = get_db()
        from bson import ObjectId
        try:
            result = db.units.delete_one({'_id': ObjectId(unit_id)})
            return result.deleted_count > 0
        except:
            return False
    
    @staticmethod
    def to_dict(unit):
        if not unit:
            return None
        unit['id'] = str(unit['_id'])
        del unit['_id']
        if 'created_at' in unit:
            unit['created_at'] = unit['created_at'].isoformat()
        if 'updated_at' in unit:
            unit['updated_at'] = unit['updated_at'].isoformat()
        return unit

