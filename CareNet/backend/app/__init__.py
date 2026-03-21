from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
import os
from dotenv import load_dotenv

from config import config
from app.models import db

load_dotenv()

socketio = SocketIO(cors_allowed_origins="*")

def create_app(config_name=None):
    """Application factory."""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    socketio.init_app(app)
    CORS(app)
    
    # Register blueprints
    from app.routes import auth_bp, users_bp, requests_bp, payments_bp, notifications_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(requests_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(notifications_bp)
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app
