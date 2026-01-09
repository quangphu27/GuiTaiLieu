import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.user import User
from config.database import init_db

if __name__ == '__main__':
    init_db()
    
    username = 'giamdoc@gmail.com'
    password = 'matkhau123'
    
    existing_user = User.get_by_username(username)
    if existing_user:
        print(f'Tài khoản {username} đã tồn tại')
    else:
        user_id = User.create(username, password, role='director')
        print(f'Đã tạo tài khoản giám đốc: {username}')
        print(f'User ID: {user_id}')
