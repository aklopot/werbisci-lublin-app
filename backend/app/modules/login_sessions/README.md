# Login Sessions Module

## Overview

This module tracks all user login and logout events in the application. It provides administrators with visibility into active sessions and historical login data.

## Features

- **Session Tracking**: Records all login and logout events with timestamps
- **Logout Reasons**: Distinguishes between manual logouts, inactivity timeouts (1h), and token expiration
- **Active Session Monitoring**: Shows which users are currently logged in
- **User Association**: Links sessions to users with cascade delete on user removal
- **Search & Filter**: Search by IP, User-Agent, or filter by user and active status
- **Database Administration**: Clear data and recreate schema endpoints

## Database Schema

### `login_sessions` table

| Column | Type | Description |
|--------|------|-------------|
| id | BigInteger | Primary key (supports billions of records) |
| user_id | Integer | Foreign key to users table (CASCADE DELETE) |
| login_time | DateTime | When the user logged in |
| logout_time | DateTime (nullable) | When the user logged out (NULL = active session) |
| logout_reason | String (nullable) | Reason for logout: 'manual', 'inactivity', 'token_expired' |
| ip_address | String (nullable) | Client IP address |
| user_agent | String (nullable) | Browser/client user agent |

## API Endpoints

### List Sessions
```
GET /api/login-sessions
Query params: limit, offset, sort_field, sort_direction
Returns: List of all login sessions
```

### Search Sessions
```
GET /api/login-sessions/search
Query params: user_id, active_only, q, limit, offset, sort_field, sort_direction
Returns: Filtered list of login sessions
```

### Active Sessions Count
```
GET /api/login-sessions/active-count
Returns: { "active_sessions": number }
```

### Clear Data
```
DELETE /api/login-sessions/clear-data
Requires: Admin role
Action: Deletes all login session records
```

### Recreate Schema
```
POST /api/login-sessions/recreate-schema
Requires: Admin role
Action: Drops and recreates the login_sessions table
```

## Frontend Integration

The module is integrated into the Users page (`/app/users`) for administrators:

- Displays login sessions below the users list
- Shows active sessions count with warning
- Provides search and filtering capabilities
- Highlights active sessions in yellow
- Includes database administration dropdown

## Deployment

The table is automatically created during deployment:

1. When `deploy.sh` runs, it executes the build process
2. On application startup, `Base.metadata.create_all()` creates the table if it doesn't exist
3. The `init_db.py` script includes the LoginSession model for proper initialization

For manual table creation:
```bash
docker compose run --rm backend python -m app.core.init_db
```

## Usage

### Backend
```python
from app.modules.login_sessions.services import LoginSessionService

service = LoginSessionService()

# Create session on login
session = service.create_session(
    db,
    user_id=user.id,
    ip_address="192.168.1.1",
    user_agent="Mozilla/5.0..."
)

# Mark session as logged out
service.logout_session(
    db,
    session_id=session.id,
    logout_reason="manual"  # or 'inactivity' or 'token_expired'
)
```

### Frontend
```typescript
import { listLoginSessions, searchLoginSessions } from './api'

// List all sessions
const sessions = await listLoginSessions(50, 0, 'login_time', 'desc')

// Search active sessions for specific user
const activeSessions = await searchLoginSessions({
  user_id: 123,
  active_only: true,
  limit: 50
})
```

## Security

- All endpoints require admin authentication
- Database operations (clear, recreate) have confirmation dialogs
- Cascade delete ensures data consistency when users are removed
- Logout events are sent before token is cleared (fire-and-forget to prevent blocking)

## Maintenance

### Clearing Old Data

Administrators can clear old login session data via the UI or API to manage database size.

### Schema Updates

If schema needs updating:
1. Use "Recreate Schema" (⚠️ destroys all data)
2. Or manually migrate using SQLAlchemy migrations

## Notes

- Sessions without `logout_time` are considered active
- The system does not prevent multiple active sessions per user
- IP address and User-Agent are optional fields for future enhancements
- The module uses UTC timestamps for all datetime fields

