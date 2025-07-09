from flask import Flask, request, jsonify
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
    migrate = Migrate(app, db)
    
    # SIMPLE CORS - Allow everything for now
    CORS(app, 
         origins="*",  # Allow all origins
         methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
         allow_headers="*",  # Allow all headers
         supports_credentials=False  # Disable credentials for now
    )

    jwt = JWTManager(app)
    bcrypt = Bcrypt(app)
    
    # Initialize email service
    init_mail(app)
    
    # Simple OPTIONS handler
    @app.before_request
    def handle_options():
        if request.method == "OPTIONS":
            response = jsonify({'status': 'OK'})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response

    # Add headers to all responses
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', '*')
        return response
    
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
                    email='info.ewordpublishers@gmail.com',
                    name='System Administrator',
                    department='Administration',
                    designation='Eword Admin',
                    contacts='info.ewordpublishers@gmail.com',
                    role='admin',
                    status='approved'
                )
                admin.set_password('Ew0rd@Admin#2025!')
                db.session.add(admin)
                db.session.commit()
                print("✅ Default admin user created with email: info.ewordpublishers@gmail.com")
                print("🔒 Default admin password: Ew0rd@Admin#2025!")
            else:
                # Update existing admin password
                admin.set_password('Ew0rd@Admin#2025!')
                db.session.commit()
                print("🔄 Admin password updated to: Ew0rd@Admin#2025!")
                
            create_tables.tables_created = True
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {
            'status': 'healthy', 
            'service': 'EWORD Leave Management API',
            'cors': 'enabled - all origins'
        }, 200
    
    # Root endpoint
    @app.route('/')
    def root():
        return {
            'message': 'EWORD Leave Management API',
            'version': '1.0.0',
            'status': 'running',
            'cors': 'enabled - all origins'
        }, 200
    
    # Test CORS endpoint
    @app.route('/api/test-cors')
    def test_cors():
        return {
            'message': 'CORS is working!',
            'origin': request.headers.get('Origin', 'No origin header'),
            'method': request.method,
            'cors_status': 'open'
        }, 200
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)