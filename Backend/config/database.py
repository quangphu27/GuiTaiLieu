from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = None
db = None

def init_db():
    global client, db
    mongodb_uri = os.getenv('MONGODB_URI')
    if not mongodb_uri:
        raise ValueError("MONGODB_URI not found in environment variables")
    
    client = MongoClient(mongodb_uri)
    db = client.guitailieu
    
    create_indexes()
    return db

def create_indexes():
    db.documents.create_index("name")
    db.units.create_index("code", unique=True)
    db.units.create_index("email", unique=True)
    db.history.create_index("document_id")
    db.history.create_index("unit_id")

def get_db():
    if db is None:
        init_db()
    return db

