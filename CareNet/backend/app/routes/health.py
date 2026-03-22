from flask import Blueprint, request, jsonify
from app.models import db, ServiceCompletion, User, HealthRiskLog
from app.services import HealthMonitoringService
from app.routes.auth import token_required
from datetime import datetime

health_bp = Blueprint('health', __name__, url_prefix='/api/health')

@health_bp.route('/analyze/<completion_id>', methods=['POST'])
@token_required
def analyze_health_risks(completion_id):
    """
    Analyze health risks from a service completion.
    Only accessible to family members or elderly themselves.
    """
    completion = ServiceCompletion.query.get(completion_id)
    if not completion:
        return jsonify({'error': 'Service completion not found'}), 404
    
    elderly = completion.request.elderly
    
    # Verify permission (elderly or family member)
    if request.user_id != elderly.id and request.user_role not in ['family', 'admin']:
        return jsonify({'error': 'Unauthorized access'}), 403
    
    # Perform health risk analysis
    assessment = HealthMonitoringService.analyze_health_risks(elderly, completion, db)
    
    if not assessment:
        return jsonify({'error': 'Could not analyze health risks'}), 500
    
    return jsonify({
        'message': 'Health risk analysis completed',
        'assessment': assessment
    }), 200

@health_bp.route('/history/<elderly_id>', methods=['GET'])
@token_required
def get_health_history(elderly_id):
    """
    Get health risk assessment history for an elderly person.
    Only accessible to family members or the elderly person themselves.
    """
    elderly = User.query.get(elderly_id)
    if not elderly:
        return jsonify({'error': 'Elderly person not found'}), 404
    
    # Verify permission
    if request.user_id != elderly_id and request.user_role not in ['family', 'admin']:
        return jsonify({'error': 'Unauthorized access'}), 403
    
    limit = request.args.get('limit', default=10, type=int)
    history = HealthMonitoringService.get_health_history(elderly_id, db, limit=limit)
    
    return jsonify({
        'elderly_id': elderly_id,
        'elderly_name': f"{elderly.first_name} {elderly.last_name}",
        'history': history
    }), 200

@health_bp.route('/summary/<elderly_id>', methods=['GET'])
@token_required
def get_health_summary(elderly_id):
    """
    Get overall health risk summary for an elderly person.
    Only accessible to family members or the elderly person themselves.
    """
    elderly = User.query.get(elderly_id)
    if not elderly:
        return jsonify({'error': 'Elderly person not found'}), 404
    
    # Verify permission
    if request.user_id != elderly_id and request.user_role not in ['family', 'admin']:
        return jsonify({'error': 'Unauthorized access'}), 403
    
    summary = HealthMonitoringService.get_risk_summary(elderly_id, db)
    
    return jsonify({
        'elderly_id': elderly_id,
        'elderly_name': f"{elderly.first_name} {elderly.last_name}",
        'summary': summary
    }), 200

@health_bp.route('/alerts', methods=['GET'])
@token_required
def get_user_health_alerts():
    """
    Get all unread health alerts for the current user.
    Only for family members and elderly.
    """
    from app.models import Notification
    
    # Get all unread health alerts
    alerts = Notification.query.filter(
        Notification.user_id == request.user_id,
        Notification.type == 'health_alert',
        Notification.read == False
    ).order_by(Notification.created_at.desc()).all()
    
    return jsonify({
        'count': len(alerts),
        'alerts': [{
            'id': alert.id,
            'content': alert.content,
            'risk_level': alert.data.get('risk_level') if alert.data else 'unknown',
            'elderly_name': alert.data.get('elderly_name') if alert.data else 'Unknown',
            'created_at': alert.created_at.isoformat(),
            'read': alert.read
        } for alert in alerts]
    }), 200

@health_bp.route('/alerts/<alert_id>/read', methods=['PUT'])
@token_required
def mark_alert_as_read(alert_id):
    """Mark a health alert as read."""
    from app.models import Notification
    
    alert = Notification.query.get(alert_id)
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404
    
    if alert.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized access'}), 403
    
    alert.read = True
    db.session.commit()
    
    return jsonify({'message': 'Alert marked as read'}), 200

@health_bp.route('/risk-assessment/<elderly_id>', methods=['POST'])
@token_required
def create_manual_health_assessment(elderly_id):
    """
    Create a manual health risk assessment (for volunteer notes without service completion).
    """
    elderly = User.query.get(elderly_id)
    if not elderly:
        return jsonify({'error': 'Elderly person not found'}), 404
    
    # Only volunteers can submit assessments
    if request.user_role != 'volunteer' and request.user_role != 'admin':
        return jsonify({'error': 'Only volunteers can submit health assessments'}), 403
    
    data = request.get_json()
    if not data.get('notes'):
        return jsonify({'error': 'Assessment notes required'}), 400
    
    # Create a mock completion object for analysis
    class MockCompletion:
        def __init__(self, notes):
            self.volunteer_notes = notes
            self.id = 'manual_' + elderly_id
    
    completion = MockCompletion(data.get('notes'))
    
    # Perform health risk analysis
    assessment = HealthMonitoringService.analyze_health_risks(elderly, completion, db)
    
    if not assessment:
        return jsonify({'error': 'Could not analyze health risks'}), 500
    
    return jsonify({
        'message': 'Health assessment completed',
        'assessment': assessment
    }), 200

@health_bp.route('/checklist/<service_type>', methods=['GET'])
@token_required
def get_volunteer_health_checklist(service_type):
    """
    Get an AI-generated health observation checklist for volunteers
    based on the service type.
    """
    prompt = f"""
Tạo một danh sách kiểm tra sức khỏe cho tình nguyện viên khi cung cấp dịch vụ: {service_type}

Danh sách kiểm tra phải:
1. Bao gồm 8-10 items cụ thể để quan sát
2. Được viết bằng ngôn ngữ đơn giản, dễ hiểu
3. Tập trung vào các dấu hiệu sức khỏe có liên quan đến dịch vụ
4. Bao gồm lời nhắc nhở về an toàn

Trả lời dưới dạng JSON:
{{
    "service_type": "{service_type}",
    "checklist": [
        {{
            "item": "Dấu hiệu hoặc hành động cần quan sát",
            "description": "Giải thích chi tiết",
            "red_flags": ["cảnh báo đỏ 1", "cảnh báo đỏ 2"]
        }}
    ],
    "safety_notes": ["lưu ý an toàn 1", "lưu ý an toàn 2"]
}}
"""
    
    from app.services import client
    import json
    
    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        response_text = message.content[0].text
        
        # Parse JSON
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            checklist = json.loads(json_str)
        else:
            checklist = json.loads(response_text)
        
        return jsonify(checklist), 200
        
    except Exception as e:
        return jsonify({'error': f'Could not generate checklist: {str(e)}'}), 500
