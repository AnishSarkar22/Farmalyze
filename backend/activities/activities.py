import os
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import libsql

activities_bp = Blueprint('activities', __name__)

# Global connection - reuse across requests
_activities_conn = None

def get_activities_db():
    global _activities_conn
    if _activities_conn is None:
        turso_url = os.getenv("TURSO_DATABASE_URL")
        turso_auth_token = os.getenv("TURSO_AUTH_TOKEN")
        
        if not turso_url or not turso_auth_token:
            raise RuntimeError("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set")
        
        # Remote-only connection to Turso (no local file)
        _activities_conn = libsql.connect(database=turso_url, auth_token=turso_auth_token)
        
    return _activities_conn

@activities_bp.route('/api/activities/create', methods=['POST'])
@jwt_required()
def create_activity():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Debug: Print received data
        print(f"Received data: {data}")
        print(f"User ID: {user_id}")
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        activity_type = data.get('activity_type')
        title = data.get('title')
        status = data.get('status', 'completed')
        result = data.get('result')
        details = data.get('details', {})
        
        # Validate required fields
        if not activity_type:
            return jsonify({'error': 'activity_type is required'}), 400
        if not title:
            return jsonify({'error': 'title is required'}), 400
        if not user_id:
            return jsonify({'error': 'User authentication required'}), 401

        conn = get_activities_db()
        cur = conn.cursor()
        
        # Convert details to JSON string if it's a dict
        details_json = json.dumps(details) if isinstance(details, dict) else details
        
        # Insert new activity
        cur.execute(
            '''INSERT INTO user_activities 
               (user_id, activity_type, title, status, result, details, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (int(user_id), activity_type, title, status, result, 
             details_json, datetime.now().isoformat())
        )
        conn.commit()
        
        # Get the created activity
        activity_id = cur.lastrowid
        
        if activity_id:
            cur.execute(
                'SELECT * FROM user_activities WHERE id = ?',
                (activity_id,)
            )
            activity = cur.fetchone()
            
            if activity:
                return jsonify({
                    'success': True,
                    'activity': {
                        'id': activity[0],
                        'user_id': activity[1],
                        'activity_type': activity[2],
                        'title': activity[3],
                        'status': activity[4],
                        'result': activity[5],
                        'details': json.loads(activity[6]) if activity[6] else {},
                        'created_at': activity[7]
                    }
                }), 201
        
        return jsonify({'error': 'Failed to create activity'}), 500
    
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        return jsonify({'error': 'Invalid JSON in request'}), 400
    except Exception as e:
        print(f"Create activity error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to create activity: {str(e)}'}), 500

@activities_bp.route('/api/activities', methods=['GET'])
@jwt_required()
def get_activities():
    try:
        user_id = get_jwt_identity()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        offset = (page - 1) * limit
        
        conn = get_activities_db()
        cur = conn.cursor()
        
        # Get total count
        cur.execute(
            'SELECT COUNT(*) FROM user_activities WHERE user_id = ?',
            (int(user_id),)
        )
        total_count = cur.fetchone()[0]
        
        # Get activities with pagination
        cur.execute(
            '''SELECT * FROM user_activities 
               WHERE user_id = ? 
               ORDER BY created_at DESC 
               LIMIT ? OFFSET ?''',
            (int(user_id), limit, offset)
        )
        
        activities = cur.fetchall()
        
        activities_list = []
        for activity in activities:
            try:
                details = json.loads(activity[6]) if activity[6] else {}
            except (json.JSONDecodeError, TypeError):
                details = {}
                
            activities_list.append({
                'id': activity[0],
                'user_id': activity[1],
                'activity_type': activity[2],
                'title': activity[3],
                'status': activity[4],
                'result': activity[5],
                'details': details,
                'created_at': activity[7]
            })
        
        has_more = (page * limit) < total_count
        
        return jsonify({
            'success': True,
            'activities': activities_list,
            'pagination': {
                'page': page,
                'limit': limit,
                'total_count': total_count,
                'has_more': has_more
            }
        }), 200
    
    except Exception as e:
        print(f"Get activities error: {e}")
        return jsonify({'error': 'Failed to fetch activities'}), 500

@activities_bp.route('/api/activities/<int:activity_id>', methods=['GET'])
@jwt_required()
def get_activity(activity_id):
    try:
        user_id = get_jwt_identity()
        
        conn = get_activities_db()
        cur = conn.cursor()
        
        cur.execute(
            'SELECT * FROM user_activities WHERE id = ? AND user_id = ?',
            (activity_id, int(user_id))
        )
        
        activity = cur.fetchone()
        
        if not activity:
            return jsonify({'error': 'Activity not found'}), 404
        
        try:
            details = json.loads(activity[6]) if activity[6] else {}
        except (json.JSONDecodeError, TypeError):
            details = {}
        
        return jsonify({
            'success': True,
            'activity': {
                'id': activity[0],
                'user_id': activity[1],
                'activity_type': activity[2],
                'title': activity[3],
                'status': activity[4],
                'result': activity[5],
                'details': details,
                'created_at': activity[7]
            }
        }), 200
    
    except Exception as e:
        print(f"Get activity error: {e}")
        return jsonify({'error': 'Failed to fetch activity'}), 500

@activities_bp.route('/api/activities/<int:activity_id>', methods=['PUT'])
@jwt_required()
def update_activity(activity_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = get_activities_db()
        cur = conn.cursor()
        
        # Check if activity exists and belongs to user
        cur.execute(
            'SELECT * FROM user_activities WHERE id = ? AND user_id = ?',
            (activity_id, int(user_id))
        )
        
        if not cur.fetchone():
            return jsonify({'error': 'Activity not found'}), 404
        
        # Update activity
        status = data.get('status')
        result = data.get('result')
        details = data.get('details')
        
        update_fields = []
        update_values = []
        
        if status is not None:
            update_fields.append('status = ?')
            update_values.append(status)
        
        if result is not None:
            update_fields.append('result = ?')
            update_values.append(result)
        
        if details is not None:
            update_fields.append('details = ?')
            update_values.append(json.dumps(details) if isinstance(details, dict) else details)
        
        if update_fields:
            update_values.extend([activity_id, int(user_id)])
            cur.execute(
                f'''UPDATE user_activities 
                   SET {', '.join(update_fields)} 
                   WHERE id = ? AND user_id = ?''',
                update_values
            )
            conn.commit()
        
        # Get updated activity
        cur.execute(
            'SELECT * FROM user_activities WHERE id = ? AND user_id = ?',
            (activity_id, int(user_id))
        )
        
        activity = cur.fetchone()
        
        try:
            details = json.loads(activity[6]) if activity[6] else {}
        except (json.JSONDecodeError, TypeError):
            details = {}
        
        return jsonify({
            'success': True,
            'activity': {
                'id': activity[0],
                'user_id': activity[1],
                'activity_type': activity[2],
                'title': activity[3],
                'status': activity[4],
                'result': activity[5],
                'details': details,
                'created_at': activity[7]
            }
        }), 200
    
    except Exception as e:
        print(f"Update activity error: {e}")
        return jsonify({'error': 'Failed to update activity'}), 500

@activities_bp.route('/api/activities/<int:activity_id>', methods=['DELETE'])
@jwt_required()
def delete_activity(activity_id):
    try:
        user_id = get_jwt_identity()
        
        conn = get_activities_db()
        cur = conn.cursor()
        
        # Check if activity exists and belongs to user
        cur.execute(
            'SELECT * FROM user_activities WHERE id = ? AND user_id = ?',
            (activity_id, int(user_id))
        )
        
        if not cur.fetchone():
            return jsonify({'error': 'Activity not found'}), 404
        
        # Delete activity
        cur.execute(
            'DELETE FROM user_activities WHERE id = ? AND user_id = ?',
            (activity_id, int(user_id))
        )
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Activity deleted'}), 200
    
    except Exception as e:
        print(f"Delete activity error: {e}")
        return jsonify({'error': 'Failed to delete activity'}), 500