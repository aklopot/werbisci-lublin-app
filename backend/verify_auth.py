from app.core.security import verify_password
from app.core.db import SessionLocal
from app.modules.users.repositories import UserRepository

db = SessionLocal()
try:
    repo = UserRepository()
    user = repo.get_by_login(db, 'admin')
    print('user_found', bool(user))
    if user:
        print('verify', verify_password('admin', user.password_hash))
finally:
    db.close()
