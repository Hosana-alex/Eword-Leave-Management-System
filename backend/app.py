from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from datetime import timedelta
import os
import logging
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application"""
    
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-for-development')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///leave_management.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-string')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    
    logger.info("Flask app configuration loaded")
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    bcrypt = Bcrypt(app)
    
    logger.info("Flask extensions initialized")
    
    # Initialize email service
    try:
        init_mail(app)
        logger.info("Email service initialized")
    except Exception as e:
        logger.warning(f"Email service initialization failed: {e}")
    
    # CORS Configuration
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
    logger.info("CORS configured for production")

    @app.before_request
    def initialize_database():
        """Initialize database tables and admin user on first request"""
        if not hasattr(initialize_database, 'initialized'):
            try:
                logger.info("Initializing database tables...")
                db.create_all()
                
                # Create default admin user
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
                    logger.info("Default admin user created")
                else:
                    # Update admin password on startup
                    admin.set_password('Ew0rd@Admin#2025!')
                    db.session.commit()
                    logger.info("Admin password updated")
                    
                initialize_database.initialized = True
                logger.info("Database initialization complete")
                
            except Exception as e:
                logger.error(f"Database initialization failed: {e}")
                # Don't raise - let the app continue and fail gracefully on DB operations
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(leave_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')
    app.register_blueprint(notifications_bp, url_prefix='/api')
    
    logger.info("Application blueprints registered")
    
    # Health check and utility endpoints
    @app.route('/')
    def root():
        """Root endpoint - API information"""
        return {
            'message': 'EWORD Leave Management API',
            'version': '1.0.0',
            'status': 'running',
            'platform': 'Railway'
        }, 200
    
    @app.route('/health')
    def health_check():
        """Health check endpoint for monitoring"""
        try:
            # Test database connection
            db.session.execute('SELECT 1')
            db_status = 'connected'
        except Exception:
            db_status = 'disconnected'
            
        return {
            'status': 'healthy',
            'service': 'EWORD Leave Management API',
            'database': db_status,
            'platform': 'Railway'
        }, 200
    
    @app.route('/api/test-cors')
    def cors_test():
        """CORS testing endpoint"""
        return {
            'message': 'CORS test successful',
            'origin': request.headers.get('Origin', 'No origin'),
            'method': request.method,
            'platform': 'Railway'
        }, 200
    
    @app.route('/debug/info')
    def debug_info():
        """Debug information endpoint"""
        return {
            'app_name': 'EWORD Leave Management',
            'blueprints': len(app.blueprints),
            'database_type': 'PostgreSQL' if 'postgresql' in app.config['SQLALCHEMY_DATABASE_URI'] else 'SQLite',
            'environment': os.environ.get('FLASK_ENV', 'production'),
            'routes_count': len([rule for rule in app.url_map.iter_rules()]),
            'platform': 'Railway'
        }, 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        logger.error(f"Internal server error: {error}")
        return jsonify({'error': 'Internal server error'}), 500
    
    logger.info("EWORD Leave Management System ready")
    return app

# Create application instance
app = create_app()

if __name__ == '__main__':
    # Development server (not used in production)
    port = int(os.environ.get('PORT', 8000))
    logger.info(f"Starting development server on port {port}")
    app.run(debug=False, host='0.0.0.0', port=port)