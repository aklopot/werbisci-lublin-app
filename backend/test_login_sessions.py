"""
Test script for login sessions module.
Run this to verify the module is working correctly.

Usage:
    python test_login_sessions.py
"""

from sqlalchemy import select, func
from app.core.db import SessionLocal
from app.modules.users.models import User
from app.modules.login_sessions.models import LoginSession
from app.modules.login_sessions.services import LoginSessionService


def main():
    db = SessionLocal()
    try:
        service = LoginSessionService()
        
        # Get first user
        user = db.scalar(select(User).limit(1))
        if not user:
            print("Error: No users found in database")
            return
        
        print(f"Testing with user: {user.full_name} (ID: {user.id})")
        print("-" * 50)
        
        # Create test session
        print("\n1. Creating test login session...")
        session = service.create_session(
            db,
            user_id=user.id,
            ip_address="127.0.0.1",
            user_agent="Test Script/1.0"
        )
        print(f"   Created session ID: {session.id}")
        print(f"   Login time: {session.login_time}")
        print(f"   User ID: {session.user_id}")
        
        # Count active sessions
        print("\n2. Counting active sessions...")
        active_count = service.count_active_sessions(db)
        print(f"   Active sessions: {active_count}")
        
        # List sessions
        print("\n3. Listing recent sessions...")
        sessions = service.list_sessions(db, limit=5)
        print(f"   Found {len(sessions)} recent sessions:")
        for s in sessions:
            status = "ACTIVE" if not s.logout_time else f"Logged out ({s.logout_reason})"
            print(f"   - ID {s.id}: User {s.user_id}, {status}")
        
        # Search for user's sessions
        print(f"\n4. Searching sessions for user {user.id}...")
        user_sessions = service.search_sessions(
            db,
            user_id=user.id,
            limit=10
        )
        print(f"   Found {len(user_sessions)} sessions for this user")
        
        # Search active sessions only
        print("\n5. Searching for active sessions only...")
        active_sessions = service.search_sessions(
            db,
            active_only=True,
            limit=10
        )
        print(f"   Found {len(active_sessions)} active sessions")
        
        # Logout the test session
        print(f"\n6. Logging out test session (ID: {session.id})...")
        logged_out = service.logout_session(
            db,
            session_id=session.id,
            logout_reason="manual"
        )
        if logged_out:
            print(f"   Logged out at: {logged_out.logout_time}")
            print(f"   Reason: {logged_out.logout_reason}")
        
        # Final count
        print("\n7. Final active sessions count...")
        final_count = service.count_active_sessions(db)
        print(f"   Active sessions: {final_count}")
        
        # Total sessions count
        total = db.scalar(select(func.count()).select_from(LoginSession))
        print(f"\n8. Total sessions in database: {total}")
        
        print("\n" + "=" * 50)
        print("All tests completed successfully!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()

