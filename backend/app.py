from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from datetime import timedelta
import os
from dotenv import load_dotenv

# Import database and models
from utils.database import db
from models.user import User
from models.leave_application import LeaveApplication
from models.leave_balance import LeaveBalance
from models.notification import Notification

# Import email service
from utils.email_service import init_mail

# Import routes
from routes.auth import auth_bp
from routes.leave import leave_bp
from routes.admin import admin_bp
from routes.user import user_bp
from routes.analytics import analytics_bp
from routes.notifications import notifications_bp


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
    migrate = Migrate(app, db)  # Add this line
    CORS(app, origins=["https://eword-management-system.vercel.app"], supports_credentials=True)

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
    app.register_blueprint(notifications_bp, url_prefix='/api')    
    # Initialize database and create default admin
    @app.before_request
    def create_tables():
        # Only run this once
        if not hasattr(create_tables, 'tables_created'):
            db.create_all()
            
            # Create default admin user if it doesn't exist
            admin = User.query.filter_by(email='info.ewordpublishers@gmail.com').first()
            if not admin:
                admin = User(
                    email='info.ewordpublishers@gmail.com',  # Updated email
                    name='System Administrator',
                    department='Administration',
                    designation='Eword Admin',
                    contacts='info.ewordpublishers@gmail.com',  # Updated contact
                    role='admin',
                    status='approved'
                )
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()
                
            create_tables.tables_created = True
    
    return app

app = create_app()

