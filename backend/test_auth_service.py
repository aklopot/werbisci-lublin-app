from app.core.db import SessionLocal
from app.modules.users.services import UserService

db = SessionLocal()
try:
    user = UserService().authenticate(db, login='admin', password='admin')
    print('auth_user', bool(user))
finally:
    db.close()
