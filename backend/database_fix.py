# setup_notifications.py
# Run this script to set up notifications without Flask-Migrate

import os
import sys
import sqlite3
from datetime import datetime

# Add the current directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def setup_notifications_table():
    """Add notifications table to existing database"""
    
    db_path = 'instance/leave_management.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        print("Please ensure your Flask app has been run at least once to create the database.")
        return False
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if notifications table already exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='notifications';
        """)
        
        if cursor.fetchone():
            print("✅ Notifications table already exists!")
            conn.close()
            return True
        
        print("📋 Creating notifications table...")
        
        # Create notifications table
        cursor.execute("""
            CREATE TABLE notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                read BOOLEAN DEFAULT 0,
                action_url VARCHAR(200),
                extra_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                read_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES user (id)
            );
        """)
        
        # Create index for better performance
        cursor.execute("""
            CREATE INDEX idx_notifications_user_id ON notifications(user_id);
        """)
        
        cursor.execute("""
            CREATE INDEX idx_notifications_read ON notifications(read);
        """)
        
        # Commit changes
        conn.commit()
        conn.close()
        
        print("✅ Notifications table created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating notifications table: {e}")
        return False

def test_notifications():
    """Test notifications by creating some sample data"""
    try:
        # Import after ensuring the table exists
        from app import create_app
        from utils.database import db
        from models.user import User
        from models.notification import Notification
        import json
        
        app = create_app()
        with app.app_context():
            
            # Get admin and employee users
            admin = User.query.filter_by(role='admin').first()
            employee = User.query.filter_by(role='employee').first()
            
            if not admin:
                print("⚠️  No admin user found. Creating test admin...")
                admin = User(
                    email='admin@ewordpublishers.com',
                    name='System Administrator',
                    department='Administration',
                    role='admin',
                    status='approved'
                )
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()
                print("✅ Test admin created")
            
            if not employee:
                print("⚠️  No employee user found. You can create one via registration.")
            
            # Create test notifications
            test_notifications = []
            
            # Admin notifications
            if admin:
                admin_notif = Notification(
                    user_id=admin.id,
                    title='System Setup Complete',
                    message='Notification system has been successfully set up and is ready to use.',
                    type='success',
                    extra_data=json.dumps({'setup_type': 'system_initialization'})
                )
                test_notifications.append(admin_notif)
                
                admin_notif2 = Notification(
                    user_id=admin.id,
                    title='Welcome to EWORD PUBLISHERS',
                    message='Your leave management system is now fully operational with notifications.',
                    type='info',
                    action_url='/dashboard'
                )
                test_notifications.append(admin_notif2)
            
            # Employee notifications (if employee exists)
            if employee:
                emp_notif = Notification(
                    user_id=employee.id,
                    title='Welcome to Leave Management',
                    message='You can now submit leave applications and receive instant notifications.',
                    type='info',
                    action_url='/apply'
                )
                test_notifications.append(emp_notif)
            
            # Add all test notifications
            for notif in test_notifications:
                db.session.add(notif)
            
            db.session.commit()
            
            print(f"✅ Created {len(test_notifications)} test notifications")
            
            # Display notification counts
            admin_count = Notification.query.filter_by(user_id=admin.id).count() if admin else 0
            employee_count = Notification.query.filter_by(user_id=employee.id).count() if employee else 0
            
            print(f"📊 Notification counts:")
            print(f"   Admin: {admin_count} notifications")
            print(f"   Employee: {employee_count} notifications")
            
            return True
            
    except Exception as e:
        print(f"❌ Error testing notifications: {e}")
        return False

def update_app_py():
    """Update app.py to include notifications blueprint"""
    
    app_py_path = 'app.py'
    
    if not os.path.exists(app_py_path):
        print(f"❌ app.py not found!")
        return False
    
    try:
        # Read current app.py
        with open(app_py_path, 'r') as f:
            content = f.read()
        
        # Check if notifications are already imported
        if 'from routes.notifications import notifications_bp' in content:
            print("✅ Notifications blueprint already imported in app.py")
            return True
        
        # Add the import and registration
        lines = content.split('\n')
        
        # Find where to add the import (after other route imports)
        import_line_idx = -1
        for i, line in enumerate(lines):
            if 'from routes.' in line and 'import' in line:
                import_line_idx = i
        
        if import_line_idx >= 0:
            # Add notification import after other route imports
            lines.insert(import_line_idx + 1, 'from routes.notifications import notifications_bp')
            
            # Find where blueprints are registered
            register_line_idx = -1
            for i, line in enumerate(lines):
                if 'app.register_blueprint(' in line:
                    register_line_idx = i
            
            if register_line_idx >= 0:
                # Add notification blueprint registration
                lines.insert(register_line_idx + 1, "app.register_blueprint(notifications_bp, url_prefix='/api')")
            else:
                # If no blueprint registration found, add at the end before if __name__
                for i, line in enumerate(lines):
                    if 'if __name__' in line:
                        lines.insert(i, "app.register_blueprint(notifications_bp, url_prefix='/api')")
                        lines.insert(i, "")
                        break
            
            # Write back to file
            with open(app_py_path, 'w') as f:
                f.write('\n'.join(lines))
            
            print("✅ Updated app.py with notifications blueprint")
            return True
        else:
            print("⚠️  Could not find route imports in app.py. Please manually add:")
            print("   from routes.notifications import notifications_bp")
            print("   app.register_blueprint(notifications_bp, url_prefix='/api')")
            return False
            
    except Exception as e:
        print(f"❌ Error updating app.py: {e}")
        return False

def main():
    """Main setup function"""
    print("🔧 Setting up Notification System for EWORD PUBLISHERS")
    print("=" * 50)
    
    # Step 1: Create notifications table
    if not setup_notifications_table():
        print("❌ Failed to set up notifications table")
        return
    
    # Step 2: Update app.py
    if not update_app_py():
        print("⚠️  app.py update failed, but you can do it manually")
    
    # Step 3: Test notifications
    print("\n📝 Testing notification system...")
    if test_notifications():
        print("✅ Notification system test passed!")
    else:
        print("⚠️  Notification test failed, but table was created")
    
    print("\n🎉 Setup Complete!")
    print("=" * 50)
    print("Next steps:")
    print("1. Restart your Flask application")
    print("2. Login and check the notification bell icon")
    print("3. Admin login: admin@ewordpublishers.com / admin123")
    print("4. Notifications will appear when users submit leave applications")

if __name__ == "__main__":
    main()