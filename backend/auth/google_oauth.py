import os
import requests
from flask import Blueprint, request, jsonify, redirect
from flask_jwt_extended import create_access_token
from authlib.integrations.flask_client import OAuth
from werkzeug.security import generate_password_hash
import libsql
import secrets

oauth_bp = Blueprint('oauth', __name__)

# Global connection - reuse across requests
_conn = None

def get_oauth_db():
    global _conn
    if _conn is None:
        turso_url = os.getenv("TURSO_DATABASE_URL")
        turso_auth_token = os.getenv("TURSO_AUTH_TOKEN")
        
        if not turso_url or not turso_auth_token:
            raise RuntimeError("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set")
        
        _conn = libsql.connect(database=turso_url, auth_token=turso_auth_token)
        
    return _conn

# Initialize OAuth
oauth = OAuth()

def init_oauth(app):
    """Initialize OAuth with Flask app"""
    oauth.init_app(app)
    
    # Configure Google OAuth
    google = oauth.register(
        name='google',
        client_id=os.getenv('GOOGLE_CLIENT_ID'),
        client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
        server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )
    
    return google

# Store for OAuth state (in production, use Redis or database)
oauth_states = {}

@oauth_bp.route('/api/auth/google/login', methods=['POST'])
def google_login():
    """Initiate Google OAuth login"""
    try:
        # Generate a secure random state
        state = secrets.token_urlsafe(32)
        
        # Get the frontend URL from request or environment
        data = request.get_json() or {}
        frontend_url = data.get('frontend_url', os.getenv('FRONTEND_URL', 'http://localhost:5173'))
        
        # Store state with frontend URL for later verification
        oauth_states[state] = {
            'frontend_url': frontend_url,
            'timestamp': requests.utils.get_environ_proxies('')  # Simple timestamp
        }
        
        # Clean up old states (keep only last 100)
        if len(oauth_states) > 100:
            # Remove oldest entries
            sorted_states = sorted(oauth_states.items(), key=lambda x: x[1].get('timestamp', 0))
            for old_state, _ in sorted_states[:len(oauth_states)-100]:
                del oauth_states[old_state]
        
        # Build Google OAuth URL manually
        google_oauth_url = (
            "https://accounts.google.com/o/oauth2/auth"
            f"?client_id={os.getenv('GOOGLE_CLIENT_ID')}"
            f"&redirect_uri={os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback')}"
            "&scope=openid email profile"
            "&response_type=code"
            f"&state={state}"
            "&access_type=offline"
            "&prompt=consent"
        )
        
        return jsonify({
            'success': True,
            'auth_url': google_oauth_url,
            'state': state
        }), 200
        
    except Exception as e:
        print(f"Google login initiation error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to initiate Google login'
        }), 500

# @oauth_bp.route('/api/auth/google/callback', methods=['GET'])
# def google_callback():
#     """Handle Google OAuth callback"""
#     try:
#         # Get authorization code and state from callback
#         code = request.args.get('code')
#         state = request.args.get('state')
#         error = request.args.get('error')
        
#         if error:
#             return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=oauth_error")
        
#         if not code or not state:
#             return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=missing_params")
        
#         # Verify state
#         if state not in oauth_states:
#             return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=invalid_state")
        
#         frontend_url = oauth_states[state]['frontend_url']
#         del oauth_states[state]  # Clean up used state
        
#         # Exchange authorization code for access token
#         token_url = "https://oauth2.googleapis.com/token"
#         token_data = {
#             'client_id': os.getenv('GOOGLE_CLIENT_ID'),
#             'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
#             'code': code,
#             'grant_type': 'authorization_code',
#             'redirect_uri': os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback')
#         }
        
#         token_response = requests.post(token_url, data=token_data)
#         token_json = token_response.json()
        
#         if not token_response.ok:
#             print(f"Token exchange error: {token_json}")
#             return redirect(f"{frontend_url}/login?error=token_exchange_failed")
        
#         access_token = token_json.get('access_token')
#         if not access_token:
#             return redirect(f"{frontend_url}/login?error=no_access_token")
        
#         # Get user info from Google
#         user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
#         user_response = requests.get(user_info_url)
#         user_data = user_response.json()
        
#         if not user_response.ok:
#             print(f"User info error: {user_data}")
#             return redirect(f"{frontend_url}/login?error=user_info_failed")
        
#         # Extract user information
#         google_id = user_data.get('id')
#         email = user_data.get('email')
#         name = user_data.get('name')
#         picture = user_data.get('picture')
        
#         if not google_id or not email:
#             return redirect(f"{frontend_url}/login?error=incomplete_user_data")
        
#         # Save or update user in database
#         conn = get_oauth_db()
#         cur = conn.cursor()
        
#         # Check if user exists by email
#         cur.execute('SELECT id, google_id FROM users WHERE email = ?', (email,))
#         existing_user = cur.fetchone()
        
#         if existing_user:
#             user_id = existing_user[0]
#             # Update Google ID if not set
#             if not existing_user[1]:
#                 cur.execute(
#                     'UPDATE users SET google_id = ?, profile_picture = ? WHERE id = ?',
#                     (google_id, picture, user_id)
#                 )
#                 conn.commit()
#         else:
#             # Create new user
#             cur.execute(
#                 'INSERT INTO users (email, name, google_id, profile_picture, password) VALUES (?, ?, ?, ?, ?)',
#                 (email, name, google_id, picture, generate_password_hash(secrets.token_urlsafe(32)))  # Random password for OAuth users
#             )
#             conn.commit()
#             user_id = cur.lastrowid
        
#         # Create JWT token
#         jwt_token = create_access_token(identity=str(user_id))
        
#         # Redirect to frontend with token
#         return redirect(f"{frontend_url}/auth/callback?token={jwt_token}&success=true")
        
#     except Exception as e:
#         print(f"Google callback error: {e}")
#         frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
#         return redirect(f"{frontend_url}/login?error=callback_error")

@oauth_bp.route('/api/auth/google/callback', methods=['GET'])
def google_callback():
    try:
        print("Google callback hit")
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        print(f"code={code}, state={state}, error={error}")

        if error:
            print("OAuth error param:", error)
            return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=oauth_error")

        if not code or not state:
            print("Missing code or state")
            return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=missing_params")

        if state not in oauth_states:
            print("Invalid state:", state)
            return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=invalid_state")

        frontend_url = oauth_states[state]['frontend_url']
        del oauth_states[state]

        # Exchange code for token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            'client_id': os.getenv('GOOGLE_CLIENT_ID'),
            'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback')
        }
        print("Token data:", token_data)
        token_response = requests.post(token_url, data=token_data)
        token_json = token_response.json()
        print("Token response:", token_json)

        if not token_response.ok:
            print(f"Token exchange error: {token_json}")
            return redirect(f"{frontend_url}/login?error=token_exchange_failed")

        access_token = token_json.get('access_token')
        if not access_token:
            print("No access token in token_json")
            return redirect(f"{frontend_url}/login?error=no_access_token")

        # Get user info from Google
        user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
        user_response = requests.get(user_info_url)
        user_data = user_response.json()
        print("User info:", user_data)

        if not user_response.ok:
            print(f"User info error: {user_data}")
            return redirect(f"{frontend_url}/login?error=user_info_failed")

        google_id = user_data.get('id')
        email = user_data.get('email')
        name = user_data.get('name')
        picture = user_data.get('picture')

        if not google_id or not email:
            print("Missing google_id or email")
            return redirect(f"{frontend_url}/login?error=incomplete_user_data")

        # Save or update user in database
        conn = get_oauth_db()
        cur = conn.cursor()
        cur.execute('SELECT id, google_id FROM users WHERE email = ?', (email,))
        existing_user = cur.fetchone()

        if existing_user:
            user_id = existing_user[0]
            if not existing_user[1]:
                cur.execute(
                    'UPDATE users SET google_id = ?, profile_picture = ? WHERE id = ?',
                    (google_id, picture, user_id)
                )
                conn.commit()
        else:
            cur.execute(
                'INSERT INTO users (email, name, google_id, profile_picture, password) VALUES (?, ?, ?, ?, ?)',
                (email, name, google_id, picture, generate_password_hash(secrets.token_urlsafe(32)))
            )
            conn.commit()
            user_id = cur.lastrowid

        jwt_token = create_access_token(identity=str(user_id))
        print("JWT token created, redirecting to frontend")
        return redirect(f"{frontend_url}/auth/callback?token={jwt_token}&success=true")

    except Exception as e:
        print(f"Google callback error: {e}")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/login?error=callback_error")

@oauth_bp.route('/api/auth/google/link', methods=['POST'])
def link_google_account():
    """Link Google account to existing user account"""
    try:
        from flask_jwt_extended import jwt_required, get_jwt_identity
        
        # This endpoint requires authentication
        @jwt_required()
        def _link_account():
            data = request.get_json()
            code = data.get('code')
            
            if not code:
                return jsonify({'success': False, 'error': 'Authorization code required'}), 400
            
            # Exchange code for token (similar to callback)
            token_url = "https://oauth2.googleapis.com/token"
            token_data = {
                'client_id': os.getenv('GOOGLE_CLIENT_ID'),
                'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': 'postmessage'  # For client-side flow
            }
            
            token_response = requests.post(token_url, data=token_data)
            token_json = token_response.json()
            
            if not token_response.ok:
                return jsonify({'success': False, 'error': 'Token exchange failed'}), 400
            
            access_token = token_json.get('access_token')
            
            # Get user info
            user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
            user_response = requests.get(user_info_url)
            user_data = user_response.json()
            
            if not user_response.ok:
                return jsonify({'success': False, 'error': 'Failed to get user info'}), 400
            
            google_id = user_data.get('id')
            google_email = user_data.get('email')
            
            # Update current user with Google ID
            user_id = get_jwt_identity()
            conn = get_oauth_db()
            cur = conn.cursor()
            
            # Check if Google account is already linked to another user
            cur.execute('SELECT id FROM users WHERE google_id = ? AND id != ?', (google_id, int(user_id)))
            if cur.fetchone():
                return jsonify({'success': False, 'error': 'Google account already linked to another user'}), 409
            
            # Update current user
            cur.execute(
                'UPDATE users SET google_id = ?, profile_picture = ? WHERE id = ?',
                (google_id, user_data.get('picture'), int(user_id))
            )
            conn.commit()
            
            return jsonify({'success': True, 'message': 'Google account linked successfully'}), 200
        
        return _link_account()
        
    except Exception as e:
        print(f"Link Google account error: {e}")
        return jsonify({'success': False, 'error': 'Failed to link Google account'}), 500