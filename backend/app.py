from flask import Flask, request, jsonify
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

    jwt = JWTManager(app)
    bcrypt = Bcrypt(app)
    
    # Initialize email service
    init_mail(app)
    
    # MANUAL CORS - GUARANTEED TO WORK
    @app.after_request
    def after_request(response):
        # Allow specific origins
        origin = request.headers.get('Origin')
        allowed_origins = [
            'https://eword-management-system.vercel.app',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ]
        
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    # Handle ALL OPTIONS requests
    @app.before_request
    def handle_options():
        if request.method == "OPTIONS":
            # Get the origin
            origin = request.headers.get('Origin')
            allowed_origins = [
                'https://eword-management-system.vercel.app',
                'http://localhost:3000',
                'http://127.0.0.1:3000'
            ]
            
            response = jsonify({'status': 'ok'})
            
            if origin in allowed_origins:
                response.headers.add("Access-Control-Allow-Origin", origin)
            
            response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
            response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response
    
    # Initialize database and create default admin
    @app.before_request
    def create_tables():
        # Skip for OPTIONS requests
        if request.method == "OPTIONS":
            return
            
        # Only run this once
        if not hasattr(create_tables, 'tables_created'):
            try:
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
                    print("✅ Default admin user created")
                else:
                    admin.set_password('Ew0rd@Admin#2025!')
                    db.session.commit()
                    print("🔄 Admin password updated")
                    
                create_tables.tables_created = True
            except Exception as e:
                print(f"❌ Database error: {e}")
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(leave_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')
    app.register_blueprint(notifications_bp, url_prefix='/api')
    
    # BASIC ENDPOINTS
    @app.route('/')
    def root():
        return {
            'message': 'EWORD Leave Management API',
            'version': '1.0.0',
            'status': 'running',
            'cors': 'MANUAL HEADERS - GUARANTEED WORKING'
        }, 200
    
    @app.route('/health')
    def health_check():
        return {
            'status': 'healthy', 
            'service': 'EWORD Leave Management API',
            'cors': 'manual headers working'
        }, 200
    
    # CORS TEST ENDPOINT
    @app.route('/api/test-cors')
    def cors_test():
        return {
            'message': 'CORS is working with manual headers!',
            'origin': request.headers.get('Origin', 'No origin'),
            'method': request.method,
            'cors_status': 'manual'
        }, 200
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)