# SQL schemas to use in Turso

## Create `users` table using Turso GUI

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    google_id TEXT,
    profile_picture TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
```

## SQL Schema for `user_activities` table using Turso GUI

```sql
-- User Activities Table
CREATE TABLE IF NOT EXISTS user_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,           -- 'crop', 'fertilizer', 'disease'
    title TEXT NOT NULL,                   -- Activity title
    status TEXT DEFAULT 'completed',       -- 'completed', 'pending', 'failed'
    result TEXT,                          -- HTML formatted result
    details TEXT,                         -- JSON string with additional details
    created_at TEXT NOT NULL,             -- ISO timestamp
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
```
