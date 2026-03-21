from flask import Blueprint, request, jsonify
from app.models import db, Payment, ServiceRequest
from app.routes.auth import token_required
from datetime import datetime

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payments_bp.route('', methods=['POST'])
@token_required
def create_payment():
    """Create a new payment."""
    data = request.get_json()
    
    required_fields = ['amount', 'payment_type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    payment = Payment(
        payer_id=request.user_id,
        amount=data['amount'],
        currency=data.get('currency', 'VND'),
        payment_type=data['payment_type'],
        status='pending'
    )
    
    if 'request_id' in data:
        payment.request_id = data['request_id']
    
    db.session.add(payment)
    db.session.commit()
    
    # TODO: Integrate with Stripe for actual payment processing
    # For now, mark as completed
    payment.status = 'completed'
    db.session.commit()
    
    return jsonify({
        'message': 'Payment created',
        'payment_id': payment.id,
        'status': payment.status
    }), 201

@payments_bp.route('/<payment_id>', methods=['GET'])
@token_required
def get_payment(payment_id):
    """Get payment details."""
    payment = Payment.query.get(payment_id)
    
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    if payment.payer_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify({
        'id': payment.id,
        'amount': payment.amount,
        'currency': payment.currency,
        'payment_type': payment.payment_type,
        'status': payment.status,
        'created_at': payment.created_at.isoformat()
    }), 200

@payments_bp.route('/transactions', methods=['GET'])
@token_required
def get_transactions():
    """Get user's payment transactions."""
    payments = Payment.query.filter_by(payer_id=request.user_id).all()
    
    result = []
    for payment in payments:
        result.append({
            'id': payment.id,
            'amount': payment.amount,
            'currency': payment.currency,
            'payment_type': payment.payment_type,
            'status': payment.status,
            'created_at': payment.created_at.isoformat()
        })
    
    return jsonify(result), 200

@payments_bp.route('/<request_id>/tip', methods=['POST'])
@token_required
def add_tip(request_id):
    """Add a tip for a completed service."""
    service_request = ServiceRequest.query.get(request_id)
    
    if not service_request:
        return jsonify({'error': 'Service request not found'}), 404
    
    if service_request.family_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if not service_request.completion:
        return jsonify({'error': 'Service not completed yet'}), 400
    
    data = request.get_json()
    tip_amount = data.get('amount', 0)
    
    # Create tip payment
    payment = Payment(
        payer_id=request.user_id,
        amount=tip_amount,
        currency='VND',
        payment_type='tip',
        request_id=request_id,
        status='completed'
    )
    
    # Update service completion
    service_request.completion.tip_amount = tip_amount
    
    db.session.add(payment)
    db.session.commit()
    
    return jsonify({
        'message': 'Tip added successfully',
        'tip_amount': tip_amount
    }), 201
