from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'appguitailieu')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'query_string']
app.config['JWT_QUERY_STRING_NAME'] = 'token'

jwt = JWTManager(app)

from config.database import init_db
from models.user import User
from routes.auth import auth_bp
from routes.documents import documents_bp
from routes.units import units_bp
from routes.history import history_bp
from routes.ai import ai_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(documents_bp, url_prefix='/api/documents')
app.register_blueprint(units_bp, url_prefix='/api/units')
app.register_blueprint(history_bp, url_prefix='/api/history')
app.register_blueprint(ai_bp, url_prefix='/api/ai')

init_db()
User.init_default_user()

if not os.path.exists('uploads'):
    os.makedirs('uploads')

@app.route('/')
def index():
    return jsonify({'message': 'Backend API is running', 'status': 'ok'})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

