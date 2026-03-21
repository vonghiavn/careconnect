from flask import Blueprint, request, jsonify
from app.models import db, Notification
from app.routes.auth import token_required

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('', methods=['GET'])
@token_required
def get_notifications():
    """Get user's notifications."""
    limit = request.args.get('limit', default=20, type=int)
    unread_only = request.args.get('unread_only', default=False, type=bool)
    
    query = Notification.query.filter_by(user_id=request.user_id)
    
    if unread_only:
        query = query.filter_by(read=False)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    result = []
    for notif in notifications:
        result.append({
            'id': notif.id,
            'type': notif.type,
            'content': notif.content,
            'read': notif.read,
            'data': notif.data,
            'created_at': notif.created_at.isoformat()
        })
    
    return jsonify(result), 200

@notifications_bp.route('/<notification_id>/mark-read', methods=['POST'])
@token_required
def mark_as_read(notification_id):
    """Mark notification as read."""
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    if notification.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    notification.read = True
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'}), 200

@notifications_bp.route('/mark-all-read', methods=['POST'])
@token_required
def mark_all_as_read():
    """Mark all notifications as read."""
    Notification.query.filter_by(user_id=request.user_id, read=False).update({'read': True})
    db.session.commit()
    
    return jsonify({'message': 'All notifications marked as read'}), 200

@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@token_required
def delete_notification(notification_id):
    """Delete a notification."""
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    if notification.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(notification)
    db.session.commit()
    
    return jsonify({'message': 'Notification deleted'}), 200
