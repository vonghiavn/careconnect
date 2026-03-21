import os
import math
from anthropic import Anthropic

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
        
        skill_map = {
            'medical': ['nursing', 'healthcare', 'first_aid'],
            'errands': ['cooking', 'shopping', 'transportation'],
            'companionship': ['languages', 'patience', 'communication']
        }
        
        required_skills = skill_map.get(service_type, [])
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
