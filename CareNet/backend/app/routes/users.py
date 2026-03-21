from flask import Blueprint, request, jsonify
from app.models import db, User, ElderlyProfile, VolunteerProfile, FamilyProfile
from app.routes.auth import token_required

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user details."""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_data = user.to_dict()
    
    # Include profile data
    if user.role == 'elderly' and user.elderly_profile:
        user_data['profile'] = {
            'address': user.elderly_profile.address,
            'latitude': user.elderly_profile.latitude,
            'longitude': user.elderly_profile.longitude,
            'health_conditions': user.elderly_profile.health_conditions,
            'emergency_contact': user.elderly_profile.emergency_contact,
            'mobility_level': user.elderly_profile.mobility_level
        }
    elif user.role == 'volunteer' and user.volunteer_profile:
        user_data['profile'] = {
            'address': user.volunteer_profile.address,
            'latitude': user.volunteer_profile.latitude,
            'longitude': user.volunteer_profile.longitude,
            'skills': user.volunteer_profile.skills,
            'bio': user.volunteer_profile.bio,
            'ratings': user.volunteer_profile.ratings,
            'completed_tasks': user.volunteer_profile.completed_tasks,
            'is_verified': user.volunteer_profile.is_verified
        }
    
    return jsonify(user_data), 200

@users_bp.route('/<user_id>', methods=['PUT'])
@token_required
def update_user(user_id):
    """Update user details."""
    if request.user_id != user_id and request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update basic fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    
    # Update role-specific profile
    if user.role == 'elderly' and 'profile' in data:
        profile = user.elderly_profile
        if 'address' in data['profile']:
            profile.address = data['profile']['address']
        if 'latitude' in data['profile']:
            profile.latitude = data['profile']['latitude']
        if 'longitude' in data['profile']:
            profile.longitude = data['profile']['longitude']
        if 'health_conditions' in data['profile']:
            profile.health_conditions = data['profile']['health_conditions']
        if 'emergency_contact' in data['profile']:
            profile.emergency_contact = data['profile']['emergency_contact']
        if 'mobility_level' in data['profile']:
            profile.mobility_level = data['profile']['mobility_level']
    
    elif user.role == 'volunteer' and 'profile' in data:
        profile = user.volunteer_profile
        if 'address' in data['profile']:
            profile.address = data['profile']['address']
        if 'latitude' in data['profile']:
            profile.latitude = data['profile']['latitude']
        if 'longitude' in data['profile']:
            profile.longitude = data['profile']['longitude']
        if 'skills' in data['profile']:
            profile.skills = data['profile']['skills']
        if 'bio' in data['profile']:
            profile.bio = data['profile']['bio']
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict()
    }), 200

@users_bp.route('/volunteers/nearby', methods=['GET'])
def get_nearby_volunteers():
    """Get nearby volunteers for a location."""
    latitude = request.args.get('latitude', type=float)
    longitude = request.args.get('longitude', type=float)
    radius = request.args.get('radius', default=5, type=float)
    
    if not latitude or not longitude:
        return jsonify({'error': 'Latitude and longitude required'}), 400
    
    # Simple implementation - can be enhanced with proper geospatial queries
    volunteers = VolunteerProfile.query.all()
    nearby = []
    
    for vol in volunteers:
        if vol.latitude and vol.longitude:
            # Rough distance calculation
            dx = abs(vol.latitude - latitude)
            dy = abs(vol.longitude - longitude)
            distance = (dx**2 + dy**2)**0.5
            
            if distance * 111 < radius:  # ~111 km per degree
                nearby.append({
                    'user': vol.user.to_dict(),
                    'distance_km': distance * 111
                })
    
    nearby.sort(key=lambda x: x['distance_km'])
    
    return jsonify(nearby), 200

@users_bp.route('/search', methods=['GET'])
def search_users():
    """Search users by name or email."""
    query = request.args.get('q', '')
    role = request.args.get('role', '')
    
    if len(query) < 2:
        return jsonify({'error': 'Query too short'}), 400
    
    users = User.query.filter(
        (User.first_name.ilike(f'%{query}%')) |
        (User.last_name.ilike(f'%{query}%')) |
        (User.email.ilike(f'%{query}%'))
    )
    
    if role:
        users = users.filter_by(role=role)
    
    results = [user.to_dict() for user in users.limit(20)]
    
    return jsonify(results), 200
