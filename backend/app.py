from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from datetime import timedelta
import os
from dotenv import load_dotenv

# Import database and models
from utils.database import db
from models.user import User
from models.leave_application import LeaveApplication

# Import email service
from utils.email_service import init_mail

# Import routes
from routes.auth import auth_bp
from routes.leave import leave_bp
from routes.admin import admin_bp
from routes.user import user_bp
from routes.analytics import analytics_bp

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-for-development')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///leave_management.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-string')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    jwt = JWTManager(app)
    bcrypt = Bcrypt(app)
    
    # Initialize email service
    init_mail(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(leave_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')
    
    # Initialize database and create default admin
    @app.before_request
    def create_tables():
        # Only run this once
        if not hasattr(create_tables, 'tables_created'):
            db.create_all()
            
            # Create default admin user if it doesn't exist
            admin = User.query.filter_by(email='admin@ewordpublishers.com').first()
            if not admin:
                admin = User(
                    email='admin@ewordpublishers.com',
                    name='System Administrator',
                    department='Administration',
                    designation='System Admin',
                    contacts='admin@ewordpublishers.com',
                    role='admin'
                )
                admin.set_password('admin123')  # Change this in production!
                db.session.add(admin)
                db.session.commit()
                print("Default admin user created: admin@ewordpublishers.com / admin123")
            
            create_tables.tables_created = True
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)