from app.core.db import SessionLocal
from app.modules.users.repositories import UserRepository
from app.core.security import hash_password

db = SessionLocal()
try:
    repo = UserRepository()
    user = repo.get_by_login(db, 'admin')
    if user:
        user.password_hash = hash_password('admin')
        db.add(user)
        db.commit()
        db.refresh(user)
        print('reset_done', True)
finally:
    db.close()
