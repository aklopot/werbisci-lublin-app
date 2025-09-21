from app.core.db import SessionLocal
from app.modules.users.repositories import UserRepository

db = SessionLocal()
try:
    repo = UserRepository()
    user = repo.get_by_login(db, 'admin')
    print('user_found', bool(user))
    if user:
        print('hash_len', len(user.password_hash))
        print('hash', user.password_hash)
finally:
    db.close()
