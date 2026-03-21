from flask import Blueprint, request, jsonify
from app.models import db, User, ElderlyProfile, VolunteerProfile, FamilyProfile
from app.services import AuthService
from functools import wraps
import os

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def token_required(f):
    """Decorator to check JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        
        payload = AuthService.verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        request.user_id = payload['user_id']
        request.user_role = payload['role']
        return f(*args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    # Validate input
    required_fields = ['email', 'password', 'first_name', 'last_name', 'role', 'phone']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Create user
    user = User(
        email=data['email'],
        phone=data['phone'],
        password_hash=AuthService.hash_password(data['password']),
        role=data['role'],
        first_name=data['first_name'],
        last_name=data['last_name']
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Create role-specific profile
    if data['role'] == 'elderly':
        elderly = ElderlyProfile(
            user_id=user.id,
            address=data.get('address', ''),
            emergency_contact=data.get('emergency_contact', '')
        )
        db.session.add(elderly)
    elif data['role'] == 'volunteer':
        volunteer = VolunteerProfile(
            user_id=user.id,
            address=data.get('address', ''),
            skills=data.get('skills', [])
        )
        db.session.add(volunteer)
    elif data['role'] == 'family':
        family = FamilyProfile(
            user_id=user.id,
            elderly_id=data.get('elderly_id', '')
        )
        db.session.add(family)
    
    db.session.commit()
    
    # Generate token
    token = AuthService.generate_jwt_token(user.id, user.role)
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'token': token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user."""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not AuthService.verify_password(data['password'], user.password_hash):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = AuthService.generate_jwt_token(user.id, user.role)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'token': token
    }), 200

@auth_bp.route('/verify-token', methods=['POST'])
@token_required
def verify_token():
    """Verify current token."""
    return jsonify({
        'valid': True,
        'user_id': request.user_id,
        'role': request.user_role
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Logout user (client-side token removal)."""
    return jsonify({'message': 'Logged out successfully'}), 200
