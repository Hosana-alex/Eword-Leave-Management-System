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
    print("🚀 Starting EWORD Leave Management System...")
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-for-development')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///leave_management.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-string')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    
    print("✅ Flask app configuration loaded")
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    bcrypt = Bcrypt(app)
    
    print("✅ Flask extensions initialized")
    
    # Initialize email service
    try:
        init_mail(app)
        print("✅ Email service initialized")
    except Exception as e:
        print(f"⚠️ Email service failed: {e}")
    
    # FLASK-CORS CONFIGURATION
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "supports_credentials": True
        }
    })
    print("✅ Flask-CORS configured")

    @app.before_request
    def handle_request():
        # Database initialization
        if not hasattr(handle_request, 'tables_created'):
            try:
                print("🔍 Initializing database...")
                db.create_all()
                print("✅ Database tables created")
                
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
                    
                handle_request.tables_created = True
                print("✅ Database initialization complete")
            except Exception as e:
                print(f"❌ Database error: {e}")
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(leave_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')
    app.register_blueprint(notifications_bp, url_prefix='/api')
    
    print("✅ Blueprints registered")
    
    # BASIC ENDPOINTS
    @app.route('/')
    def root():
        return {
            'message': 'EWORD Leave Management API',
            'version': '1.0.0',
            'status': 'running',
            'cors': 'Flask-CORS enabled',
            'timestamp': str(timedelta())
        }, 200
    
    @app.route('/health')
    def health_check():
        return {
            'status': 'healthy', 
            'service': 'EWORD Leave Management API',
            'cors': 'Flask-CORS active',
            'database': 'connected'
        }, 200
    
    @app.route('/api/test-cors')
    def cors_test():
        return {
            'message': 'CORS test with Flask-CORS!',
            'origin': request.headers.get('Origin', 'No origin'),
            'method': request.method,
            'cors_status': 'Flask-CORS'
        }, 200
    
    @app.route('/debug/info')
    def debug_info():
        return {
            'app_name': 'EWORD Leave Management',
            'flask_cors': 'enabled',
            'blueprints_registered': len(app.blueprints),
            'database_url_type': 'PostgreSQL' if 'postgresql' in app.config['SQLALCHEMY_DATABASE_URI'] else 'SQLite',
            'environment': os.environ.get('FLASK_ENV', 'production'),
            'python_version': os.sys.version.split()[0],
            'routes_count': len(app.url_map._rules)
        }, 200
    
    print("✅ Routes defined")
    print("🎉 EWORD Leave Management System ready!")
    return app

print("📦 Loading EWORD Leave Management System...")
app = create_app()
print("🚀 Application created successfully!")

if __name__ == '__main__':
    print("🔥 Starting development server...")
    app.run(debug=True, host='0.0.0.0', port=5000)