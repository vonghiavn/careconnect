from flask import Blueprint, request, jsonify
from app.models import db, ServiceRequest, User, ServiceCompletion
from app.services import AIMatchingService, ReportGenerationService
from app.routes.auth import token_required
from datetime import datetime

requests_bp = Blueprint('requests', __name__, url_prefix='/api/requests')

@requests_bp.route('', methods=['POST'])
@token_required
def create_request():
    """Create a new service request."""
    if request.user_role != 'family':
        return jsonify({'error': 'Only family members can create requests'}), 403
    
    data = request.get_json()
    
    required_fields = ['elderly_id', 'service_type', 'description', 'preferred_date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    service_req = ServiceRequest(
        family_id=request.user_id,
        elderly_id=data['elderly_id'],
        service_type=data['service_type'],
        description=data['description'],
        preferred_date=datetime.fromisoformat(data['preferred_date']),
        status='pending'
    )
    
    db.session.add(service_req)
    db.session.commit()
    
    # Trigger AI matching
    elderly = User.query.get(data['elderly_id'])
    available_volunteers = User.query.filter_by(role='volunteer').all()
    
    matched = AIMatchingService.match_volunteers(service_req, available_volunteers, elderly)
    
    if matched:
        best_volunteer = matched[0]['volunteer']
        service_req.assigned_volunteer_id = best_volunteer.id
        service_req.status = 'assigned'
        db.session.commit()
        
        # Notify volunteer
        # TODO: Send notification and emit SocketIO event
    
    return jsonify({
        'message': 'Service request created',
        'request_id': service_req.id,
        'assigned_volunteer': best_volunteer.to_dict() if matched else None
    }), 201

@requests_bp.route('/<request_id>', methods=['GET'])
@token_required
def get_request(request_id):
    """Get request details."""
    service_req = ServiceRequest.query.get(request_id)
    
    if not service_req:
        return jsonify({'error': 'Request not found'}), 404
    
    # Check authorization
    if request.user_id not in [service_req.family_id, service_req.assigned_volunteer_id]:
        return jsonify({'error': 'Unauthorized'}), 403
    
    req_data = {
        'id': service_req.id,
        'family_id': service_req.family_id,
        'elderly_id': service_req.elderly_id,
        'service_type': service_req.service_type,
        'description': service_req.description,
        'preferred_date': service_req.preferred_date.isoformat(),
        'status': service_req.status,
        'assigned_volunteer_id': service_req.assigned_volunteer_id,
        'created_at': service_req.created_at.isoformat(),
        'updated_at': service_req.updated_at.isoformat()
    }
    
    if service_req.completion:
        req_data['completion'] = {
            'volunteer_notes': service_req.completion.volunteer_notes,
            'ai_report': service_req.completion.ai_report,
            'family_rating': service_req.completion.family_rating,
            'family_feedback': service_req.completion.family_feedback,
            'tip_amount': service_req.completion.tip_amount
        }
    
    return jsonify(req_data), 200

@requests_bp.route('/<request_id>/accept', methods=['POST'])
@token_required
def accept_request(request_id):
    """Volunteer accepts a service request."""
    service_req = ServiceRequest.query.get(request_id)
    
    if not service_req:
        return jsonify({'error': 'Request not found'}), 404
    
    if service_req.assigned_volunteer_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    service_req.status = 'in_progress'
    db.session.commit()
    
    return jsonify({'message': 'Request accepted'}), 200

@requests_bp.route('/<request_id>/complete', methods=['POST'])
@token_required
def complete_request(request_id):
    """Volunteer completes a service request."""
    service_req = ServiceRequest.query.get(request_id)
    
    if not service_req:
        return jsonify({'error': 'Request not found'}), 404
    
    if service_req.assigned_volunteer_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    volunteer_notes = data.get('notes', '')
    
    # Generate AI report
    elderly = User.query.get(service_req.elderly_id)
    ai_report = ReportGenerationService.generate_service_report(
        volunteer_notes,
        f"{elderly.first_name} {elderly.last_name}",
        service_req.service_type
    )
    
    # Create completion record
    completion = ServiceCompletion(
        request_id=request_id,
        volunteer_notes=volunteer_notes,
        ai_report=ai_report
    )
    
    db.session.add(completion)
    service_req.status = 'completed'
    db.session.commit()
    
    return jsonify({
        'message': 'Request completed',
        'ai_report': ai_report
    }), 200

@requests_bp.route('/<request_id>/rate', methods=['POST'])
@token_required
def rate_completion(request_id):
    """Family rates a completed service."""
    service_req = ServiceRequest.query.get(request_id)
    
    if not service_req:
        return jsonify({'error': 'Request not found'}), 404
    
    if service_req.family_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if not service_req.completion:
        return jsonify({'error': 'No completion record'}), 400
    
    data = request.get_json()
    
    service_req.completion.family_rating = data.get('rating')
    service_req.completion.family_feedback = data.get('feedback')
    service_req.completion.tip_amount = data.get('tip', 0)
    
    # Update volunteer rating
    volunteer = User.query.get(service_req.assigned_volunteer_id)
    profile = volunteer.volunteer_profile
    
    total_rating = (profile.ratings * profile.total_reviews + data.get('rating', 5)) / (profile.total_reviews + 1)
    profile.ratings = total_rating
    profile.total_reviews += 1
    profile.completed_tasks += 1
    
    db.session.commit()
    
    return jsonify({'message': 'Service rated successfully'}), 200

@requests_bp.route('/my-requests', methods=['GET'])
@token_required
def my_requests():
    """Get user's requests."""
    if request.user_role == 'family':
        requests_list = ServiceRequest.query.filter_by(family_id=request.user_id).all()
    elif request.user_role == 'volunteer':
        requests_list = ServiceRequest.query.filter_by(assigned_volunteer_id=request.user_id).all()
    else:
        return jsonify({'error': 'Unauthorized'}), 403
    
    result = []
    for req in requests_list:
        result.append({
            'id': req.id,
            'service_type': req.service_type,
            'status': req.status,
            'preferred_date': req.preferred_date.isoformat(),
            'created_at': req.created_at.isoformat()
        })
    
    return jsonify(result), 200
