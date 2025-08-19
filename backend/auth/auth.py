import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies
)
from werkzeug.security import generate_password_hash, check_password_hash
import libsql

auth_bp = Blueprint('auth', __name__)

# Global connection - reuse across requests
_conn = None

def get_auth_db():
    global _conn
    if _conn is None:
        turso_url = os.getenv("TURSO_DATABASE_URL")
        turso_auth_token = os.getenv("TURSO_AUTH_TOKEN")
        
        if not turso_url or not turso_auth_token:
            raise RuntimeError("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set")
        
        # Remote-only connection to Turso (no local file)
        _conn = libsql.connect(database=turso_url, auth_token=turso_auth_token)
        
    return _conn

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        if not name or not email or not password:
            return jsonify({'msg': 'Name, email and password required'}), 400

        conn = get_auth_db()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute('SELECT * FROM users WHERE email = ?', (email,))
        if cur.fetchone():
            return jsonify({'msg': 'User already exists'}), 409

        # Create new user
        hashed_pw = generate_password_hash(password)
        cur.execute(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            (email, hashed_pw, name)
        )
        conn.commit()
        
        return jsonify({'msg': 'User registered successfully'}), 201
    
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'msg': 'Registration failed'}), 500

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'msg': 'Email and password required'}), 400

        conn = get_auth_db()
        cur = conn.cursor()
        cur.execute('SELECT id, password FROM users WHERE email = ?', (email,))
        user = cur.fetchone()
        
        if user and check_password_hash(user[1], password):
            access_token = create_access_token(identity=str(user[0]))
            return jsonify({'access_token': access_token}), 200
        else:
            return jsonify({'msg': 'Invalid credentials'}), 401
    
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'msg': 'Login failed'}), 500

@auth_bp.route('/api/auth/session', methods=['GET'])
@jwt_required()
def session():
    try:
        user_id = get_jwt_identity()
        conn = get_auth_db()
        cur = conn.cursor()
        cur.execute('SELECT id, email, name FROM users WHERE id = ?', (int(user_id),))
        user = cur.fetchone()
        
        if user:
            return jsonify({
                'id': user[0], 
                'email': user[1], 
                'name': user[2]
            }), 200
        else:
            return jsonify({'msg': 'User not found'}), 404
    
    except Exception as e:
        print(f"Session error: {e}")
        return jsonify({'msg': 'Session check failed'}), 500

@auth_bp.route('/api/auth/protected', methods=['GET'])
@jwt_required()
def protected():
    user_id = get_jwt_identity()
    return jsonify({'msg': f'Hello user {user_id}, you are authenticated!'}), 200

@auth_bp.route('/api/auth/username', methods=['GET'])
@jwt_required()
def get_username():
    """
    Returns the user's name for the currently authenticated user.
    """
    try:
        user_id = get_jwt_identity()
        conn = get_auth_db()
        cur = conn.cursor()
        cur.execute('SELECT name FROM users WHERE id = ?', (int(user_id),))
        row = cur.fetchone()
        if row:
            return jsonify({'success': True, 'name': row[0]}), 200
        else:
            return jsonify({'success': False, 'msg': 'User not found'}), 404
    except Exception as e:
        print(f"Get username error: {e}")
        return jsonify({'success': False, 'msg': 'Failed to fetch username'}), 500

@auth_bp.route('/api/auth/session', methods=['DELETE'])
@jwt_required()
def logout():
    """
    Log out the user by clearing JWT cookies (if used).
    For stateless JWT, just return success.
    """
    response = jsonify({"msg": "Logged out"})
    unset_jwt_cookies(response)  # Only needed if you use cookies
    return response, 200