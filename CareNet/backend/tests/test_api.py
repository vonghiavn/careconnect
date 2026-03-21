"""
Test suite for CareConnect API endpoints
"""

import pytest
import json
from app import create_app, db
from app.models import User
from app.services import AuthService

@pytest.fixture
def app():
    """Create app for testing."""
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def auth_token(client):
    """Create test user and return auth token."""
    response = client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'password123',
        'first_name': 'Test',
        'last_name': 'User',
        'phone': '0912345678',
        'role': 'family',
        'address': 'Test Address'
    })
    data = json.loads(response.data)
    return data['token']

class TestAuth:
    """Test authentication endpoints."""
    
    def test_register(self, client):
        """Test user registration."""
        response = client.post('/api/auth/register', json={
            'email': 'newuser@example.com',
            'password': 'password123',
            'first_name': 'New',
            'last_name': 'User',
            'phone': '0912345678',
            'role': 'volunteer',
            'address': 'Test Address'
        })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['user']['email'] == 'newuser@example.com'
        assert 'token' in data
    
    def test_login(self, client):
        """Test user login."""
        # Register first
        client.post('/api/auth/register', json={
            'email': 'login@example.com',
            'password': 'password123',
            'first_name': 'Login',
            'last_name': 'User',
            'phone': '0912345678',
            'role': 'family',
            'address': 'Test Address'
        })
        
        # Login
        response = client.post('/api/auth/login', json={
            'email': 'login@example.com',
            'password': 'password123'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'token' in data
        assert data['user']['email'] == 'login@example.com'
    
    def test_login_invalid_password(self, client):
        """Test login with wrong password."""
        client.post('/api/auth/register', json={
            'email': 'test2@example.com',
            'password': 'password123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone': '0912345678',
            'role': 'family',
            'address': 'Test Address'
        })
        
        response = client.post('/api/auth/login', json={
            'email': 'test2@example.com',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401

class TestUsers:
    """Test user endpoints."""
    
    def test_get_user(self, client, auth_token):
        """Test getting user details."""
        # First get the user ID from token
        from app.services import AuthService
        payload = AuthService.verify_jwt_token(auth_token)
        user_id = payload['user_id']
        
        response = client.get(f'/api/users/{user_id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['email'] == 'test@example.com'
    
    def test_update_user(self, client, auth_token):
        """Test updating user details."""
        from app.services import AuthService
        payload = AuthService.verify_jwt_token(auth_token)
        user_id = payload['user_id']
        
        response = client.put(
            f'/api/users/{user_id}',
            json={'first_name': 'Updated'},
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['user']['first_name'] == 'Updated'

class TestRequests:
    """Test service request endpoints."""
    
    def test_create_request(self, client, auth_token):
        """Test creating a service request."""
        response = client.post(
            '/api/requests',
            json={
                'elderly_id': 'test-elderly-id',
                'service_type': 'medical',
                'description': 'Need medical check-up',
                'preferred_date': '2024-03-25T10:00:00'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'request_id' in data

class TestPayments:
    """Test payment endpoints."""
    
    def test_create_payment(self, client, auth_token):
        """Test creating a payment."""
        response = client.post(
            '/api/payments',
            json={
                'amount': 100000,
                'payment_type': 'service',
                'currency': 'VND'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['status'] == 'completed'

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
