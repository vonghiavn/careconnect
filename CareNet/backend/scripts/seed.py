import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app import create_app, db, socketio
from app.models import (
    User, ElderlyProfile, VolunteerProfile, FamilyProfile,
    ServiceRequest, ServiceCompletion, Payment, Notification
)
from datetime import datetime, timedelta
import uuid
from app.services import AuthService

def init():
    """Initialize database with seed data."""
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✅ Database tables created")
        
        # Check if database already has data
        if User.query.first():
            print("⚠️  Database already has data. Skipping seed.")
            return
        
        # Create sample users
        print("🌱 Creating sample data...")
        
        # Sample elderly user
        elderly = User(
            id=str(uuid.uuid4()),
            email='elderly@example.com',
            phone='0901234567',
            password_hash=AuthService.hash_password('password123'),
            role='elderly',
            first_name='Nguyễn',
            last_name='Thị A',
            verified=True
        )
        db.session.add(elderly)
        db.session.flush()
        
        elderly_profile = ElderlyProfile(
            user_id=elderly.id,
            address='123 Đường Nguyễn Hữu Cảnh, Q.Bình Thạnh, TP.HCM',
            latitude=10.8231,
            longitude=106.7038,
            health_conditions=[
                {'condition': 'Tiểu đường', 'medication': 'Metformin', 'notes': 'Kiểm tra định kỳ'}
            ],
            emergency_contact='0912345678',
            emergency_contact_name='Nguyễn Văn B',
            mobility_level='limited'
        )
        db.session.add(elderly_profile)
        
        # Sample volunteer
        volunteer = User(
            id=str(uuid.uuid4()),
            email='volunteer@example.com',
            phone='0987654321',
            password_hash=AuthService.hash_password('password123'),
            role='volunteer',
            first_name='Trần',
            last_name='Văn C',
            verified=True
        )
        db.session.add(volunteer)
        db.session.flush()
        
        volunteer_profile = VolunteerProfile(
            user_id=volunteer.id,
            address='456 Đường Lê Lợi, Q.1, TP.HCM',
            latitude=10.7769,
            longitude=106.6961,
            skills=['nursing', 'cooking', 'communication', 'transportation'],
            bio='Tôi là sinh viên năm 4 ngành Điều dưỡng, rất vui vẻ và yêu thích giúp đỡ người khác.',
            ratings=4.8,
            total_reviews=12,
            completed_tasks=15,
            is_verified=True
        )
        db.session.add(volunteer_profile)
        
        # Sample family member
        family = User(
            id=str(uuid.uuid4()),
            email='family@example.com',
            phone='0911111111',
            password_hash=AuthService.hash_password('password123'),
            role='family',
            first_name='Nguyễn',
            last_name='Văn B',
            verified=True
        )
        db.session.add(family)
        db.session.flush()
        
        family_profile = FamilyProfile(
            user_id=family.id,
            elderly_id=elderly.id,
            relationship='child'
        )
        db.session.add(family_profile)
        
        # Sample service request
        service_req = ServiceRequest(
            family_id=family.id,
            elderly_id=elderly.id,
            service_type='medical',
            description='Cần sự hỗ trợ đi khám bệnh và mua thuốc',
            preferred_date=datetime.utcnow() + timedelta(days=2),
            status='assigned',
            assigned_volunteer_id=volunteer.id
        )
        db.session.add(service_req)
        db.session.flush()
        
        # Sample notification
        notification = Notification(
            user_id=volunteer.id,
            type='task_assigned',
            content='Bạn được giao một công việc mới: Khám bệnh cho bà Nguyễn Thị A',
            read=False,
            data={'request_id': service_req.id}
        )
        db.session.add(notification)
        
        db.session.commit()
        print("✅ Sample data created successfully!")
        print("")
        print("Sample login credentials:")
        print("  Elderly:   elderly@example.com / password123")
        print("  Volunteer: volunteer@example.com / password123")
        print("  Family:    family@example.com / password123")

if __name__ == '__main__':
    init()
