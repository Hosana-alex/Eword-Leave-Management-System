from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from datetime import timedelta
import os
import logging
import sys
from dotenv import load_dotenv

# Force all output to stdout/stderr for Railway logs
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s',
    stream=sys.stdout
)

print("🔍 Starting imports...")
logging.info("Beginning app initialization...")

try:
    # Import database and models
    print("📦 Importing database...")
    from utils.database import db
    print("✅ Database imported")
    
    print("📦 Importing models...")
    from models.user import User
    from models.leave_application import LeaveApplication
    from models.leave_balance import LeaveBalance
    from models.notification import Notification
    print("✅ Models imported")

    # Import email service
    print("📦 Importing email service...")
    from utils.email_service import init_mail
    print("✅ Email service imported")

    # Import routes
    print("📦 Importing routes...")
    from routes.auth import auth_bp
    from routes.leave import leave_bp
    from routes.admin import admin_bp
    from routes.user import user_bp
    from routes.analytics import analytics_bp
    from routes.notifications import notifications_bp
    print("✅ Routes imported")
    
except Exception as e:
    print(f"❌ IMPORT ERROR: {e}")
    logging.error(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
    raise

# Load environment variables
print("🔧 Loading environment variables...")
load_dotenv()
print("✅ Environment variables loaded")

def create_app():
    try:
        print("🚀 Starting EWORD Leave Management System...")
        logging.info("Creating Flask app...")
        
        app = Flask(__name__)
        
        # Configuration
        print("⚙️ Setting up configuration...")
        app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-for-development')
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///leave_management.db')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-string')
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
        
        print("✅ Flask app configuration loaded")
        logging.info("Configuration set successfully")
        
        # Test database connection early
        print("🔍 Testing database connection...")
        db_url = app.config['SQLALCHEMY_DATABASE_URI']
        print(f"🔗 Database URL (masked): {db_url[:20]}...{db_url[-10:]}")
        
        try:
            import psycopg2
            # Extract connection details for testing
            psycopg2.connect(db_url)
            print("✅ Database connection test PASSED")
        except Exception as db_test_error:
            print(f"❌ Database connection test FAILED: {db_test_error}")
            logging.error(f"Database test failed: {db_test_error}")
            # Don't raise here, let Flask handle it
        
        # Initialize extensions
        print("🔧 Initializing Flask extensions...")
        db.init_app(app)
        migrate = Migrate(app, db)
        jwt = JWTManager(app)
        bcrypt = Bcrypt(app)
        
        print("✅ Flask extensions initialized")
        logging.info("Extensions initialized successfully")
        
        # Initialize email service
        print("📧 Initializing email service...")
        try:
            init_mail(app)
            print("✅ Email service initialized")
        except Exception as e:
            print(f"⚠️ Email service failed: {e}")
            logging.warning(f"Email service failed: {e}")
        
        # CORS Configuration
        print("🔒 Setting up CORS...")
        CORS(app, 
             origins=[
                 "https://eword-management-system.vercel.app",
                 "http://localhost:3000",
                 "http://127.0.0.1:3000"
             ],
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
             allow_headers=['Content-Type', 'Authorization'],
             supports_credentials=True,
             automatic_options=True
        )
        print("✅ Targeted CORS configured for specific origins")
        logging.info("CORS configured successfully")

        @app.before_request
        def handle_request():
            # Database initialization
            if not hasattr(handle_request, 'tables_created'):
                try:
                    print("🔍 Initializing database tables...")
                    logging.info("Creating database tables...")
                    db.create_all()
                    print("✅ Database tables created")
                    
                    print("👤 Setting up admin user...")
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
                    logging.info("Database initialization successful")
                except Exception as e:
                    print(f"❌ Database error: {e}")
                    logging.error(f"Database initialization failed: {e}")
                    import traceback
                    traceback.print_exc()
        
        # Register blueprints
        print("📋 Registering blueprints...")
        app.register_blueprint(auth_bp, url_prefix='/api')
        app.register_blueprint(leave_bp, url_prefix='/api')
        app.register_blueprint(admin_bp, url_prefix='/api')
        app.register_blueprint(user_bp, url_prefix='/api')
        app.register_blueprint(analytics_bp, url_prefix='/api')
        app.register_blueprint(notifications_bp, url_prefix='/api')
        
        print("✅ Blueprints registered")
        logging.info("Blueprints registered successfully")
        
        # BASIC ENDPOINTS
        print("🛣️ Setting up basic endpoints...")
        
        @app.route('/')
        def root():
            return {
                'message': 'EWORD Leave Management API',
                'version': '1.0.0',
                'status': 'running',
                'cors': 'Targeted CORS enabled',
                'platform': 'Railway',
                'timestamp': str(timedelta())
            }, 200
        
        @app.route('/health')
        def health_check():
            return {
                'status': 'healthy', 
                'service': 'EWORD Leave Management API',
                'cors': 'Targeted CORS active',
                'database': 'connected',
                'platform': 'Railway'
            }, 200
        
        @app.route('/api/test-cors')
        def cors_test():
            return {
                'message': 'CORS test with targeted origins!',
                'origin': request.headers.get('Origin', 'No origin'),
                'method': request.method,
                'cors_status': 'Targeted CORS',
                'platform': 'Railway'
            }, 200
        
        @app.route('/debug/info')
        def debug_info():
            return {
                'app_name': 'EWORD Leave Management',
                'cors_method': 'targeted-global',
                'blueprints_registered': len(app.blueprints),
                'database_url_type': 'PostgreSQL' if 'postgresql' in app.config['SQLALCHEMY_DATABASE_URI'] else 'SQLite',
                'environment': os.environ.get('FLASK_ENV', 'production'),
                'python_version': sys.version.split()[0],
                'routes_count': len([rule for rule in app.url_map.iter_rules()]),
                'platform': 'Railway'
            }, 200
        
        print("✅ Routes defined")
        print("🎉 EWORD Leave Management System ready!")
        logging.info("Flask app created successfully!")
        return app
        
    except Exception as e:
        print(f"❌ CRITICAL ERROR in create_app(): {e}")
        logging.error(f"App creation failed: {e}")
        import traceback
        traceback.print_exc()
        raise

print("📦 Loading EWORD Leave Management System...")
logging.info("Starting app creation...")

try:
    app = create_app()
    print("🚀 Application created successfully!")
    logging.info("Application instance created successfully!")
except Exception as e:
    print(f"❌ FAILED TO CREATE APP: {e}")
    logging.error(f"Failed to create app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

if __name__ == '__main__':
    try:
        print("🔥 Starting development server...")
        port = int(os.environ.get('PORT', 8000))
        print(f"🌐 Server starting on port {port}")
        logging.info(f"Starting server on port {port}")
        app.run(debug=False, host='0.0.0.0', port=port)
    except Exception as e:
        print(f"❌ SERVER START FAILED: {e}")
        logging.error(f"Server start failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)