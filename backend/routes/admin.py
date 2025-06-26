from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models.user import User
from models.leave_application import LeaveApplication
from models.leave_balance import LeaveBalance  # Add this import
from utils.database import db
from utils.email_service import send_status_update_email  # Add this import

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/leave-applications/<int:app_id>/approve', methods=['PUT'])
@jwt_required()
def approve_leave_application(app_id):
    try:
        # Convert JWT identity to int
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Only admin can approve
        if user.role != 'admin':
            return jsonify({'message': 'Unauthorized'}), 403
        
        application = LeaveApplication.query.get(app_id)
        if not application:
            return jsonify({'message': 'Application not found'}), 404
        
        application.status = 'approved'
        application.approved_by = user_id
        application.approved_date = datetime.utcnow()
        
        # Get admin comments if provided
        data = request.get_json(silent=True)
        if data and 'admin_comments' in data:
            application.admin_comments = data['admin_comments']
        
        db.session.commit()
        
        # Update leave balance
        leave_days = (application.to_date - application.from_date).days + 1
        balance = LeaveBalance.query.filter_by(
            user_id=application.employee_id,
            year=application.from_date.year
        ).first()
        
        if balance:
            for leave_type in application.leave_types.split(','):
                leave_type = leave_type.strip()
                balance.update_used_leave(leave_type, leave_days)
            db.session.commit()
        
        # Send email notification
        employee = User.query.get(application.employee_id)
        if employee and employee.email:
            try:
                send_status_update_email(
                    employee.email,
                    employee.name,
                    'approved',
                    {
                        'leave_types': application.leave_types.split(','),
                        'from_date': application.from_date.isoformat(),
                        'to_date': application.to_date.isoformat()
                    },
                    application.admin_comments
                )
            except Exception as email_error:
                print(f"Failed to send email: {email_error}")
                # Continue even if email fails
        
        return jsonify({
            'message': 'Application approved successfully',
            'application': application.to_dict()
        }), 200
    
    except ValueError as ve:
        print(f"JWT Identity error: {str(ve)}")
        return jsonify({'message': 'Invalid user identity'}), 401
    except Exception as e:
        print(f"Error approving application: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to approve application: {str(e)}'}), 500

@admin_bp.route('/leave-applications/<int:app_id>/reject', methods=['PUT'])
@jwt_required()
def reject_leave_application(app_id):
    try:
        # Convert JWT identity to int
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Only admin can reject
        if user.role != 'admin':
            return jsonify({'message': 'Unauthorized'}), 403
        
        application = LeaveApplication.query.get(app_id)
        if not application:
            return jsonify({'message': 'Application not found'}), 404
        
        application.status = 'rejected'
        application.approved_by = user_id
        application.approved_date = datetime.utcnow()
        
        # Get admin comments if provided
        data = request.get_json(silent=True)
        if data and 'admin_comments' in data:
            application.admin_comments = data['admin_comments']
        
        db.session.commit()
        
        # Send email notification
        employee = User.query.get(application.employee_id)
        if employee and employee.email:
            try:
                send_status_update_email(
                    employee.email,
                    employee.name,
                    'rejected',
                    {
                        'leave_types': application.leave_types.split(','),
                        'from_date': application.from_date.isoformat(),
                        'to_date': application.to_date.isoformat()
                    },
                    application.admin_comments
                )
            except Exception as email_error:
                print(f"Failed to send email: {email_error}")
                # Continue even if email fails
        
        return jsonify({
            'message': 'Application rejected',
            'application': application.to_dict()
        }), 200
    
    except ValueError as ve:
        print(f"JWT Identity error: {str(ve)}")
        return jsonify({'message': 'Invalid user identity'}), 401
    except Exception as e:
        print(f"Error rejecting application: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to reject application: {str(e)}'}), 500

@admin_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        # Convert JWT identity to int
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        if user.role != 'admin':
            return jsonify({'message': 'Unauthorized'}), 403
        
        total = LeaveApplication.query.count()
        pending = LeaveApplication.query.filter_by(status='pending').count()
        approved = LeaveApplication.query.filter_by(status='approved').count()
        rejected = LeaveApplication.query.filter_by(status='rejected').count()
        
        return jsonify({
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected
        }), 200
    
    except ValueError as ve:
        print(f"JWT Identity error: {str(ve)}")
        return jsonify({'message': 'Invalid user identity'}), 401
    except Exception as e:
        print(f"Error getting stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to get stats: {str(e)}'}), 500