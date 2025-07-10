# routes/notifications.py - Updated notification functions
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from models.user import User
from models.notification import Notification
from models.leave_application import LeaveApplication
from utils.database import db
import json

notifications_bp = Blueprint('notifications', __name__)

# Notification creation functions - FIXED
def create_notification(user_id, title, message, notification_type='info', action_url=None, metadata=None):
    """Create a new notification"""
    try:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            action_url=action_url,
            extra_data=json.dumps(metadata) if metadata else None  # Changed to extra_data
        )
        
        db.session.add(notification)
        db.session.commit()
        
        print(f"✅ Notification created for user {user_id}: {title}")
        return notification
        
    except Exception as e:
        print(f"❌ Error creating notification: {str(e)}")
        db.session.rollback()
        return None

def notify_leave_application_submitted(application):
    """Notify admin when new leave application is submitted"""
    try:
        # Get all admins
        admins = User.query.filter_by(role='admin').all()
        
        for admin in admins:
            create_notification(
                user_id=admin.id,
                title='New Leave Application',
                message=f'{application.employee_name} from {application.department} has submitted a new leave application for {application.from_date} to {application.to_date}.',
                notification_type='warning',
                action_url='/dashboard',
                metadata={
                    'application_id': application.id,
                    'employee_id': application.employee_id,
                    'employee_name': application.employee_name,
                    'department': application.department,
                    'from_date': application.from_date.isoformat(),
                    'to_date': application.to_date.isoformat(),
                    'application_type': 'leave_application'
                }
            )
        
        print(f"✅ Notified {len(admins)} admins about new leave application from {application.employee_name}")
        
    except Exception as e:
        print(f"❌ Error notifying leave application submitted: {str(e)}")

def notify_leave_application_status_changed(application, new_status, admin_comments=None):
    """Notify employee when leave application status changes"""
    try:
        status_messages = {
            'approved': f'Great news! Your leave application for {application.from_date} to {application.to_date} has been approved.',
            'rejected': f'Your leave application for {application.from_date} to {application.to_date} has been rejected.',
        }
        
        message = status_messages.get(new_status, f'Your leave application status has been updated to {new_status}.')
        
        if admin_comments:
            message += f'\n\nAdmin comments: {admin_comments}'
        
        notification_type = 'success' if new_status == 'approved' else 'error'
        
        create_notification(
            user_id=application.employee_id,
            title=f'Leave Application {new_status.title()}',
            message=message,
            notification_type=notification_type,
            action_url='/my-applications',
            metadata={
                'application_id': application.id,
                'status': new_status,
                'admin_comments': admin_comments,
                'from_date': application.from_date.isoformat(),
                'to_date': application.to_date.isoformat(),
                'application_type': 'leave_application'
            }
        )
        
        print(f"✅ Notified employee {application.employee_name} about {new_status} leave application")
        
    except Exception as e:
        print(f"❌ Error notifying leave application status change: {str(e)}")

def notify_user_registration(user):
    """Notify admins about new user registration"""
    try:
        admins = User.query.filter_by(role='admin').all()
        
        for admin in admins:
            create_notification(
                user_id=admin.id,
                title='New User Registration',
                message=f'{user.name} from {user.department} has registered and is pending approval.',
                notification_type='info',
                action_url='/admin/users',
                metadata={
                    'user_id': user.id,
                    'user_name': user.name,
                    'department': user.department,
                    'email': user.email,
                    'registration_type': 'new_user'
                }
            )
        
        print(f"✅ Notified {len(admins)} admins about new user registration: {user.name}")
        
    except Exception as e:
        print(f"❌ Error notifying user registration: {str(e)}")

def notify_user_approved(user):
    """Notify user when their registration is approved"""
    try:
        create_notification(
            user_id=user.id,
            title='Account Approved',
            message=f'Welcome to EWORD PUBLISHERS! Your account has been approved and you can now submit leave applications.',
            notification_type='success',
            action_url='/apply',
            metadata={
                'approval_type': 'account_approved'
            }
        )
        
        print(f"✅ Notified user {user.name} about account approval")
        
    except Exception as e:
        print(f"❌ Error notifying user approval: {str(e)}")

def notify_leave_balance_updated(user_id, balance_type, new_balance):
    """Notify user when leave balance is updated"""
    try:
        user = User.query.get(user_id)
        if not user:
            return
            
        create_notification(
            user_id=user_id,
            title='Leave Balance Updated',
            message=f'Your {balance_type.replace("_", " ").title()} balance has been updated. You now have {new_balance} days remaining.',
            notification_type='info',
            metadata={
                'balance_type': balance_type,
                'new_balance': new_balance,
                'update_type': 'balance_update'
            }
        )
        
        print(f"✅ Notified user {user.name} about {balance_type} balance update")
        
    except Exception as e:
        print(f"❌ Error notifying leave balance update: {str(e)}")

def notify_upcoming_leave_reminder(application, days_until):
    """Notify user about upcoming approved leave"""
    try:
        create_notification(
            user_id=application.employee_id,
            title='Upcoming Leave Reminder',
            message=f'Reminder: Your approved leave starts in {days_until} day{"s" if days_until != 1 else ""} ({application.from_date.strftime("%B %d, %Y")}).',
            notification_type='warning',
            action_url='/calendar',
            metadata={
                'application_id': application.id,
                'days_until': days_until,
                'from_date': application.from_date.isoformat(),
                'to_date': application.to_date.isoformat(),
                'reminder_type': 'upcoming_leave'
            }
        )
        
        print(f"✅ Sent upcoming leave reminder to {application.employee_name}")
        
    except Exception as e:
        print(f"❌ Error notifying upcoming leave reminder: {str(e)}")

# All the API endpoints remain the same...

@notifications_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user's notifications with filtering and pagination"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        filter_type = request.args.get('filter', 'all')  # all, unread, read
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query
        query = Notification.query.filter_by(user_id=user.id)
        
        if filter_type == 'unread':
            query = query.filter_by(read=False)
        elif filter_type == 'read':
            query = query.filter_by(read=True)
        
        # Paginate
        notifications = query.order_by(
            Notification.created_at.desc()
        ).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'notifications': [notif.to_dict() for notif in notifications.items],
            'total': notifications.total,
            'pages': notifications.pages,
            'current_page': notifications.page,
            'per_page': notifications.per_page,
            'has_next': notifications.has_next,
            'has_prev': notifications.has_prev,
            'unread_count': Notification.query.filter_by(user_id=user.id, read=False).count()
        }), 200
        
    except Exception as e:
        print(f"Error fetching notifications: {str(e)}")
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        current_user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        if not notification.read:
            notification.read = True
            notification.read_at = datetime.utcnow()
            db.session.commit()
        
        return jsonify({
            'message': 'Notification marked as read',
            'notification': notification.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Error marking notification as read: {str(e)}")
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        updated_count = Notification.query.filter_by(
            user_id=current_user_id,
            read=False
        ).update({
            'read': True,
            'read_at': datetime.utcnow()
        })
        
        db.session.commit()
        
        return jsonify({
            'message': f'Marked {updated_count} notifications as read',
            'updated_count': updated_count
        }), 200
        
    except Exception as e:
        print(f"Error marking all notifications as read: {str(e)}")
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        current_user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({'message': 'Notification deleted'}), 200
        
    except Exception as e:
        print(f"Error deleting notification: {str(e)}")
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications"""
    try:
        current_user_id = get_jwt_identity()
        
        count = Notification.query.filter_by(
            user_id=current_user_id,
            read=False
        ).count()
        
        return jsonify({'unread_count': count}), 200
        
    except Exception as e:
        print(f"Error getting unread count: {str(e)}")
        return jsonify({'error': str(e)}), 500