from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    """Base user model."""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'elderly', 'volunteer', 'family'
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    avatar_url = db.Column(db.String(255), nullable=True)
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'avatar_url': self.avatar_url,
            'verified': self.verified,
            'created_at': self.created_at.isoformat(),
        }

class ElderlyProfile(db.Model):
    """Elderly user profile with health and location info."""
    __tablename__ = 'elderly_profiles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    address = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    health_conditions = db.Column(db.JSON, nullable=True)  # [{condition, medication, notes}]
    emergency_contact = db.Column(db.String(20), nullable=False)
    emergency_contact_name = db.Column(db.String(100), nullable=True)
    mobility_level = db.Column(db.String(20))  # 'independent', 'limited', 'wheelchair'
    
    user = db.relationship('User', backref='elderly_profile')

class VolunteerProfile(db.Model):
    """Volunteer profile with skills and availability."""
    __tablename__ = 'volunteer_profiles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    address = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    skills = db.Column(db.JSON, nullable=True)  # [skill1, skill2]
    bio = db.Column(db.Text, nullable=True)
    ratings = db.Column(db.Float, default=5.0)  # average rating
    total_reviews = db.Column(db.Integer, default=0)
    completed_tasks = db.Column(db.Integer, default=0)
    is_verified = db.Column(db.Boolean, default=False)
    
    user = db.relationship('User', backref='volunteer_profile')

class FamilyProfile(db.Model):
    """Family member managing elderly care."""
    __tablename__ = 'family_profiles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    elderly_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    relationship = db.Column(db.String(50))  # 'child', 'grandchild', 'sibling', etc.
    
    user = db.relationship('User', backref='family_profile', foreign_keys=[user_id])
    elderly = db.relationship('User', foreign_keys=[elderly_id])

class ServiceRequest(db.Model):
    """Service request from family for elderly."""
    __tablename__ = 'service_requests'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    family_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    elderly_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    service_type = db.Column(db.String(50), nullable=False)  # 'medical', 'errands', 'companionship'
    description = db.Column(db.Text, nullable=False)
    preferred_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
    assigned_volunteer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    family = db.relationship('User', foreign_keys=[family_id])
    elderly = db.relationship('User', foreign_keys=[elderly_id])
    volunteer = db.relationship('User', foreign_keys=[assigned_volunteer_id])

class ServiceCompletion(db.Model):
    """Completion details and report for a service."""
    __tablename__ = 'service_completions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = db.Column(db.String(36), db.ForeignKey('service_requests.id'), nullable=False)
    volunteer_notes = db.Column(db.Text, nullable=True)
    ai_report = db.Column(db.Text, nullable=True)  # Generated by Claude
    family_rating = db.Column(db.Integer, nullable=True)  # 1-5
    family_feedback = db.Column(db.Text, nullable=True)
    tip_amount = db.Column(db.Float, default=0)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    request = db.relationship('ServiceRequest', backref='completion')

class Payment(db.Model):
    """Payment transactions."""
    __tablename__ = 'payments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = db.Column(db.String(36), db.ForeignKey('service_requests.id'), nullable=True)
    payer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='VND')
    payment_type = db.Column(db.String(20))  # 'service', 'subscription', 'tip'
    stripe_payment_id = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'failed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    request = db.relationship('ServiceRequest')
    payer = db.relationship('User')

class Notification(db.Model):
    """Notifications for users."""
    __tablename__ = 'notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'task_assigned', 'task_completed', etc.
    content = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    data = db.Column(db.JSON, nullable=True)  # Additional context
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications')
