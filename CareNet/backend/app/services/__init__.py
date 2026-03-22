import os
import math
import json
from anthropic import Anthropic
from datetime import datetime
from .service_types import SERVICE_TYPES

client = Anthropic()

class AIMatchingService:
    """AI service for matching volunteers to elderly care requests."""
    
    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates in km."""
        R = 6371  # Earth's radius in km
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    @staticmethod
    def score_volunteer(volunteer, service_request, elderly):
        """Calculate matching score for a volunteer."""
        score = 0
        details = {}
        
        # Distance scoring (max 30 points)
        if volunteer.latitude and volunteer.longitude and elderly.elderly_profile.latitude:
            distance = AIMatchingService.calculate_distance(
                volunteer.latitude,
                volunteer.longitude,
                elderly.elderly_profile.latitude,
                elderly.elderly_profile.longitude
            )
            distance_score = max(0, 30 - distance * 2)
            score += distance_score
            details['distance_score'] = distance_score
        
        # Skills matching (max 30 points)
        service_type = service_request.service_type
        volunteer_skills = volunteer.volunteer_profile.skills or []

        # Get required skills from service configuration
        service_info = SERVICE_TYPES.get(service_type, {})
        required_skills = service_info.get('required_skills', [])

        matching_skills = [s for s in volunteer_skills if any(s.lower() in rs.lower() for rs in required_skills)]
        skills_score = (len(matching_skills) / max(len(required_skills), 1)) * 30
        score += skills_score
        details['skills_score'] = skills_score
        
        # Rating & reviews (max 20 points)
        rating_score = (volunteer.volunteer_profile.ratings / 5.0) * 20
        score += rating_score
        details['rating_score'] = rating_score
        
        # Availability (max 20 points)
        # TODO: Check volunteer's availability against requested time
        score += 20
        details['availability_score'] = 20
        
        return score, details
    
    @staticmethod
    def match_volunteers(service_request, volunteers, elderly):
        """Match and rank volunteers for a service request."""
        scored_volunteers = []
        
        for volunteer in volunteers:
            score, details = AIMatchingService.score_volunteer(volunteer, service_request, elderly)
            scored_volunteers.append({
                'volunteer': volunteer,
                'score': score,
                'details': details
            })
        
        # Sort by score
        scored_volunteers.sort(key=lambda x: x['score'], reverse=True)
        
        return scored_volunteers

class ReportGenerationService:
    """Service for generating AI-powered reports using Claude."""
    
    @staticmethod
    def generate_service_report(volunteer_notes, elderly_name, service_type):
        """Generate a warm, family-friendly report from volunteer notes."""
        
        prompt = f"""
You are a compassionate report writer helping families understand how their elderly loved ones are being cared for.

Based on the volunteer's notes about the service, write a warm, heartfelt report that:
1. Highlights positive interactions and care provided
2. Includes specific details the family will appreciate
3. Shows the elderly person's wellbeing and mood
4. Is concise (3-4 paragraphs)
5. Written in Vietnamese

Elderly person's name: {elderly_name}
Service type: {service_type}

Volunteer's notes:
{volunteer_notes}

Write a report that feels genuine and caring, as if a trusted family member is updating the family about their loved one.
"""
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return message.content[0].text

class HealthMonitoringService:
    """Service for AI-powered health risk assessment from volunteer notes."""
    
    @staticmethod
    def analyze_health_risks(elderly_user, service_completion, db):
        """
        Analyze volunteer notes for health risk indicators.
        Returns assessment and creates notifications if needed.
        """
        from ..models import HealthRiskLog, Notification
        
        if not service_completion.volunteer_notes:
            return None
        
        # Get elderly profile info
        elderly_profile = elderly_user.elderly_profile
        age = datetime.utcnow().year - elderly_user.created_at.year if elderly_user.created_at else 0
        
        prompt = f"""
Bạn là một trợ lý AI chuyên về sức khỏe. Phân tích những ghi chú từ tình nguyện viên về người cao tuổi và so sánh với lịch sử sức khỏe của họ. 

NHÂN VẬT:
- Tên: {elderly_user.first_name} {elderly_user.last_name}
- Tuổi: {age}
- Tình trạng sức khỏe hiện tại: {elderly_profile.health_conditions if elderly_profile.health_conditions else 'Không cập nhật'}
- Mức độ hoạt động: {elderly_profile.mobility_level if elderly_profile.mobility_level else 'Không xác định'}

GHI CHÚ CỦA TÌNH NGUYỆN VIÊN:
{service_completion.volunteer_notes}

PHÂN TÍCH:
1. Có dấu hiệu tình trạng sức khỏe suy giảm không? (ngôn ngữ tinh tế)
2. Có thay đổi hành vi chỉ ra vấn đề sức khỏe không?
3. Có bất thường nào về ăn uống, vệ sinh, hay sức khỏe tâm lý không?
4. Có nguy hiểm hay dấu hiệu bơi vơ không?

Trả lời dưới định dạng JSON:
{
    "risk_level": "low|medium|high",
    "detected_issues": ["vấn đề 1", "vấn đề 2"],
    "recommended_actions": ["hành động 1", "hành động 2"],
    "alert_family": true/false,
    "suggested_specialist": "Loại bác sĩ hoặc null",
    "confidence": 0.0-1.0,
    "reasoning": "Giải thích chi tiết"
}
"""
        
        try:
            message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )
            
            response_text = message.content[0].text
            
            # Parse JSON response
            # Try to extract JSON from the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                assessment = json.loads(json_str)
            else:
                assessment = json.loads(response_text)
            
            # Create health risk log
            risk_log = HealthRiskLog(
                elderly_id=elderly_user.id,
                service_completion_id=service_completion.id,
                risk_level=assessment.get('risk_level', 'low'),
                detected_issues=assessment.get('detected_issues', []),
                recommended_actions=assessment.get('recommended_actions', []),
                specialist_recommended=assessment.get('suggested_specialist'),
                volume_notes=service_completion.volunteer_notes,
                ai_analysis=response_text
            )
            
            db.session.add(risk_log)
            db.session.commit()
            
            # Alert family if needed
            if assessment.get('alert_family'):
                HealthMonitoringService.notify_family(
                    elderly_user,
                    assessment,
                    db
                )
                risk_log.notified_family = True
            
            if assessment.get('risk_level') in ['medium', 'high']:
                risk_log.alert_sent = True
            
            db.session.commit()
            
            return {
                'risk_level': assessment.get('risk_level', 'low'),
                'detected_issues': assessment.get('detected_issues', []),
                'recommended_actions': assessment.get('recommended_actions', []),
                'specialist_recommended': assessment.get('suggested_specialist'),
                'confidence': assessment.get('confidence', 0.0),
                'reasoning': assessment.get('reasoning', '')
            }
            
        except json.JSONDecodeError as e:
            print(f"JSON decode error in health assessment: {e}")
            return None
        except Exception as e:
            print(f"Error in health risk analysis: {e}")
            return None
    
    @staticmethod
    def notify_family(elderly_user, assessment, db):
        """Send health risk notification to family members."""
        from ..models import FamilyProfile, Notification
        
        # Find family members
        family_members = FamilyProfile.query.filter_by(elderly_id=elderly_user.id).all()
        
        risk_level = assessment.get('risk_level', 'low')
        issues = assessment.get('detected_issues', [])
        
        # Create notification message
        if risk_level == 'high':
            emoji = '🚨'
            subject = 'CẢNH BÁO SỨC KHỎE CAP CẤP'
        elif risk_level == 'medium':
            emoji = '⚠️'
            subject = 'Cảnh báo sức khỏe'
        else:
            emoji = 'ℹ️'
            subject = 'Cập nhật sức khỏe'
        
        message = f"{emoji} {subject}\\n\\nMột số vấn đề được phát hiện:\\n"
        for issue in issues[:3]:  # Top 3 issues
            message += f"• {issue}\\n"
        
        if assessment.get('recommended_actions'):
            message += f"\\nHanh động đề xuất:\\n"
            for action in assessment.get('recommended_actions', [])[:3]:
                message += f"• {action}\\n"
        
        if assessment.get('suggested_specialist'):
            message += f"\\n👨‍⚕️ Nên liên hệ: {assessment.get('suggested_specialist')}"
        
        # Send to all family members
        for family in family_members:
            notification = Notification(
                user_id=family.user_id,
                type='health_alert',
                content=message,
                data={
                    'risk_level': risk_level,
                    'elderly_id': elderly_user.id,
                    'elderly_name': f"{elderly_user.first_name} {elderly_user.last_name}",
                    'detected_issues': issues
                }
            )
            db.session.add(notification)
        
        db.session.commit()
    
    @staticmethod
    def get_health_history(elderly_id, db, limit=10):
        """Get recent health risk assessments for an elderly person."""
        from ..models import HealthRiskLog
        
        logs = HealthRiskLog.query.filter_by(elderly_id=elderly_id)\
            .order_by(HealthRiskLog.created_at.desc())\
            .limit(limit)\
            .all()
        
        return [{
            'id': log.id,
            'risk_level': log.risk_level,
            'detected_issues': log.detected_issues,
            'recommended_actions': log.recommended_actions,
            'specialist_recommended': log.specialist_recommended,
            'created_at': log.created_at.isoformat(),
            'alert_sent': log.alert_sent
        } for log in logs]
    
    @staticmethod
    def get_risk_summary(elderly_id, db):
        """Get overall health risk summary for an elderly person."""
        from ..models import HealthRiskLog
        
        recent_logs = HealthRiskLog.query.filter_by(elderly_id=elderly_id)\
            .order_by(HealthRiskLog.created_at.desc())\
            .limit(5)\
            .all()
        
        if not recent_logs:
            return {
                'current_risk_level': 'low',
                'total_alerts': 0,
                'recent_issues': [],
                'last_assessment': None
            }
        
        # Aggregate risk levels
        risk_counts = {'low': 0, 'medium': 0, 'high': 0}
        all_issues = []
        
        for log in recent_logs:
            risk_counts[log.risk_level] += 1
            all_issues.extend(log.detected_issues or [])
        
        # Determine current risk level
        if risk_counts['high'] > 0:
            current_risk = 'high'
        elif risk_counts['medium'] > 0:
            current_risk = 'medium'
        else:
            current_risk = 'low'
        
        # Get unique issues
        unique_issues = list(set(all_issues))[:5]
        
        return {
            'current_risk_level': current_risk,
            'total_assessments': len(recent_logs),
            'high_alerts': risk_counts['high'],
            'medium_alerts': risk_counts['medium'],
            'recent_issues': unique_issues,
            'last_assessment': recent_logs[0].created_at.isoformat() if recent_logs else None
        }

class AuthService:
    """Service for authentication and authorization."""
    
    @staticmethod
    def hash_password(password):
        """Hash a password using bcrypt."""
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(password, password_hash):
        """Verify a password against a hash."""
        import bcrypt
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    @staticmethod
    def generate_jwt_token(user_id, role):
        """Generate a JWT token."""
        import jwt
        from datetime import datetime, timedelta
        
        payload = {
            'user_id': user_id,
            'role': role,
            'exp': datetime.utcnow() + timedelta(days=30),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, os.getenv('JWT_SECRET_KEY', 'your-secret-key'), algorithm='HS256')
        return token
    
    @staticmethod
    def verify_jwt_token(token):
        """Verify and decode a JWT token."""
        import jwt
        try:
            payload = jwt.decode(token, os.getenv('JWT_SECRET_KEY', 'your-secret-key'), algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
