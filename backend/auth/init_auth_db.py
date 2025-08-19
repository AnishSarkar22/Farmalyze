# use this option if you want to manage SQLite3 yourself

import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'auth.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    google_id TEXT,
    profile_picture TEXT
)
''')
cur.execute('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)')
conn.commit()
conn.close()
print("Initialized auth.db with users table and google_id")