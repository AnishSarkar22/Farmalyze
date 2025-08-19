# use this option if you want to manage SQLite3 yourself

import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'activities.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute('''
CREATE TABLE IF NOT EXISTS user_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    result TEXT,
    details TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
''')

cur.execute('CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id)')
cur.execute('CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC)')
cur.execute('CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type)')

conn.commit()
conn.close()
print("Initialized activities.db with user_activities table and indexes.")