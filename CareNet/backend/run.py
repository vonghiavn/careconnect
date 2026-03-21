#!/usr/bin/env python
"""Entry point for CareConnect application."""

import os
from dotenv import load_dotenv
from app import create_app, socketio

load_dotenv()

app = create_app(os.getenv('FLASK_ENV', 'development'))

# SocketIO event handlers
@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    print(f'Client connected: {socketio.server.client_manager.get_participants()}')

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    print('Client disconnected')

@socketio.on('volunteer:location_update')
def handle_location_update(data):
    """Handle volunteer location update."""
    volunteer_id = data.get('volunteer_id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    
    # Broadcast to family members watching this volunteer
    socketio.emit('volunteer:location_updated', {
        'volunteer_id': volunteer_id,
        'latitude': latitude,
        'longitude': longitude
    }, room=f'volunteer_{volunteer_id}')

@socketio.on('request:status_change')
def handle_request_status(data):
    """Handle request status changes."""
    request_id = data.get('request_id')
    status = data.get('status')
    
    socketio.emit('request:status_updated', {
        'request_id': request_id,
        'status': status
    }, room=f'request_{request_id}')

@socketio.on('user:join_room')
def on_join(data):
    """Join a room for real-time updates."""
    room = data.get('room')
    socketio.server.enter_room(socketio.server.client_manager.get_connected_clients()[0], room)
    socketio.emit('message', {'data': f'User joined room {room}'}, room=room)

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    socketio.run(app, host='0.0.0.0', port=5000, debug=debug_mode)
