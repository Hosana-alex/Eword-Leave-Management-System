from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from models.user import User
from models.leave_application import LeaveApplication
from models.leave_balance import LeaveBalance
from utils.database import db
from utils.email_service import send_status_update_email
import threading
from routes.notifications import (
    notify_leave_application_status_changed, 
    notify_leave_application_submitted
)

admin_bp = Blueprint('admin', __name__)

# Fixed async email function with Flask app context
def send_email_async(app, email, name, status, details, comments):
    """Send email in background thread with proper Flask application context"""
    with app.app_context():
        try:
            send_status_update_email(email, name, status, details, comments)
            print(f"✅ Email sent successfully to {email}")
        except Exception as e:
            print(f"❌ Background email failed for {email}: {e}")

# ===== USER MANAGEMENT ROUTES =====

@admin_bp.route('/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users with filtering options"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get query parameters
        status = request.args.get('status')  # 'pending', 'approved', 'rejected'
        department = request.args.get('department')
        search = request.args.get('search')
        
        # Build query
        query = User.query.filter(User.role == 'employee')
        
        if status:
            query = query.filter(User.status == status)
        
        if department:
            query = query.filter(User.department.ilike(f'%{department}%'))
        
        if search:
            query = query.filter(
                or_(
                    User.name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    User.department.ilike(f'%{search}%')
                )
            )
        
        users = query.order_by(User.created_at.desc()).all()
        
        users_data = []
        for u in users:
            # Get current year leave balance
            current_year = datetime.now().year
            balance = LeaveBalance.query.filter_by(user_id=u.id, year=current_year).first()
            
            user_data = u.to_dict()
            user_data['leave_balance'] = balance.to_dict() if balance else None
            user_data['tenure_months'] = ((datetime.now() - u.created_at).days // 30) if u.created_at else 0
            
            users_data.append(user_data)
        
        return jsonify({'users': users_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/users/<int:user_id>/approve', methods=['PUT'])
@jwt_required()
def approve_user_registration(user_id):
    """Approve pending user registration"""
    try:
        current_user_id = get_jwt_identity()
        admin = User.query.get(int(current_user_id))
        
        if not admin or admin.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.status = 'approved'
        db.session.commit()
        
        # Create initial leave balance for the user
        current_year = datetime.now().year
        existing_balance = LeaveBalance.query.filter_by(user_id=user.id, year=current_year).first()
        
        if not existing_balance:
            leave_balance = LeaveBalance(
                user_id=user.id,
                year=current_year,
                sick_leave_total=14,  # 7 + 7 as mentioned in requirements
                personal_leave_total=21,  # Annual leave
                maternity_leave_total=90,
                study_leave_total=10,
                bereavement_leave_total=5
            )
            db.session.add(leave_balance)
            db.session.commit()
        
        return jsonify({'message': 'User approved successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/users/<int:user_id>/reject', methods=['PUT'])
@jwt_required()
def reject_user_registration(user_id):
    """Reject pending user registration"""
    try:
        current_user_id = get_jwt_identity()
        admin = User.query.get(int(current_user_id))
        
        if not admin or admin.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.status = 'rejected'
        db.session.commit()
        
        return jsonify({'message': 'User registration rejected'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== LEAVE APPLICATION MANAGEMENT =====

@admin_bp.route('/admin/applications', methods=['GET'])
@jwt_required()
def get_all_applications():
    """Get all leave applications with advanced filtering"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get query parameters for filtering
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        search = request.args.get('search')
        department = request.args.get('department')
        leave_type = request.args.get('leave_type')
        
        # Build query - Fixed to use employee_id
        query = LeaveApplication.query.join(User, LeaveApplication.employee_id == User.id)
        
        # Apply filters
        if status and status != 'all':
            query = query.filter(LeaveApplication.status == status)
        
        if start_date:
            query = query.filter(LeaveApplication.from_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        
        if end_date:
            query = query.filter(LeaveApplication.to_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        
        if department:
            query = query.filter(User.department.ilike(f'%{department}%'))
        
        if leave_type:
            query = query.filter(LeaveApplication.leave_types.ilike(f'%{leave_type}%'))
        
        if search:
            query = query.filter(
                or_(
                    User.name.ilike(f'%{search}%'),
                    User.department.ilike(f'%{search}%'),
                    User.designation.ilike(f'%{search}%'),
                    LeaveApplication.reason.ilike(f'%{search}%')
                )
            )
        
        # Get applications with user data
        applications = query.order_by(LeaveApplication.created_at.desc()).all()
        
        applications_data = []
        for app in applications:
            app_user = User.query.get(app.employee_id)  # Fixed to use employee_id
            app_data = {
                'id': app.id,
                'user_id': app.employee_id,  # For frontend compatibility
                'employee_id': app.employee_id,  # Keep both for safety
                'employee_name': app_user.name if app_user else app.employee_name,
                'department': app_user.department if app_user else app.department,
                'designation': app_user.designation if app_user else app.designation,
                'contacts': app_user.contacts if app_user else app.contacts,
                'leave_types': app.leave_types.split(',') if app.leave_types else [],
                'from_date': app.from_date.strftime('%Y-%m-%d') if app.from_date else None,
                'to_date': app.to_date.strftime('%Y-%m-%d') if app.to_date else None,
                'days_count': (app.to_date - app.from_date).days + 1 if app.from_date and app.to_date else 0,
                'reason': app.reason,
                'status': app.status,
                'employee_signature': app.employee_signature,
                'important_comments': app.important_comments,
                'admin_comments': app.admin_comments,
                'created_at': app.created_at.strftime('%Y-%m-%d %H:%M:%S') if app.created_at else None,
                'submitted_date': app.submitted_date.strftime('%Y-%m-%d') if app.submitted_date else None,
                'approved_date': app.approved_date.strftime('%Y-%m-%d %H:%M:%S') if app.approved_date else None,
                'user_email': app_user.email if app_user else None
            }
            applications_data.append(app_data)
        
        return jsonify({
            'applications': applications_data,
            'total': len(applications_data)
        }), 200
        
    except Exception as e:
        print(f"Error in get_all_applications: {str(e)}")
        return jsonify({'error': str(e)}), 500



@admin_bp.route('/admin/applications/<int:application_id>/status', methods=['PUT'])
@jwt_required()
def update_application_status(application_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        status = data.get('status')
        admin_comments = data.get('admin_comments', '')
        
        if status not in ['approved', 'rejected']:
            return jsonify({'error': 'Invalid status'}), 400
        
        application = LeaveApplication.query.get(application_id)
        if not application:
            return jsonify({'error': 'Application not found'}), 404
        
        # Get employee details
        employee = User.query.get(application.employee_id)
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        # Update application
        application.status = status
        application.admin_comments = admin_comments
        application.approved_date = datetime.utcnow()
        
        # Update leave balance if approved
        if status == 'approved':
            balance = LeaveBalance.query.filter_by(
                user_id=employee.id, 
                year=application.from_date.year
            ).first()
            
            if balance:
                # Calculate days and update balance
                days = (application.to_date - application.from_date).days + 1
                leave_types = application.leave_types.split(',')
                
                for leave_type in leave_types:
                    balance.update_used_leave(leave_type.strip(), days)
        
        db.session.commit()
        
        # 🔔 SEND NOTIFICATION TO EMPLOYEE
        notify_leave_application_status_changed(application, status, admin_comments)
        
        # 📧 SEND EMAIL TO EMPLOYEE (FIXED)
        try:
            leave_details = {
                'leave_types': application.leave_types.split(','),
                'from_date': application.from_date.strftime('%Y-%m-%d'),
                'to_date': application.to_date.strftime('%Y-%m-%d'),
                'reason': application.reason
            }
            
            # Use CORRECT function name and parameters
            send_status_update_email(
                employee.email,           # employee_email
                employee.name,            # employee_name  
                status,                   # status
                leave_details,            # leave_details
                admin_comments            # admin_comments
            )
            print(f"✅ Email sent to {employee.email} about {status} leave application")
            
        except Exception as email_error:
            print(f"❌ Email failed for {employee.email}: {email_error}")
        
        return jsonify({
            'message': f'Application {status} successfully',
            'application': {
                'id': application.id,
                'status': application.status,
                'admin_comments': application.admin_comments,
                'approved_date': application.approved_date.isoformat() if application.approved_date else None
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating application status: {str(e)}")
        return jsonify({'error': str(e)}), 500
# ===== LEGACY APPROVE/REJECT ROUTES (for backward compatibility) =====

@admin_bp.route('/leave-applications/<int:app_id>/approve', methods=['PUT'])
@jwt_required()
def approve_leave_application(app_id):
    """Legacy approve route - redirects to new status route"""
    data = request.get_json(silent=True) or {}
    data['status'] = 'approved'
    
    # Temporarily replace request.get_json to return our data
    original_get_json = request.get_json
    request.get_json = lambda: data
    
    result = update_application_status(app_id)
    
    # Restore original get_json
    request.get_json = original_get_json
    
    return result

@admin_bp.route('/leave-applications/<int:app_id>/reject', methods=['PUT'])
@jwt_required()
def reject_leave_application(app_id):
    """Legacy reject route - redirects to new status route"""
    data = request.get_json(silent=True) or {}
    data['status'] = 'rejected'
    
    # Temporarily replace request.get_json to return our data
    original_get_json = request.get_json
    request.get_json = lambda: data
    
    result = update_application_status(app_id)
    
    # Restore original get_json
    request.get_json = original_get_json
    
    return result

# ===== DASHBOARD STATISTICS =====

@admin_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Basic stats
        total = LeaveApplication.query.count()
        pending = LeaveApplication.query.filter_by(status='pending').count()
        approved = LeaveApplication.query.filter_by(status='approved').count()
        rejected = LeaveApplication.query.filter_by(status='rejected').count()
        
        # User stats
        total_employees = User.query.filter_by(role='employee', status='approved').count()
        pending_registrations = User.query.filter_by(role='employee', status='pending').count()
        
        # This month's stats
        current_month = datetime.now().replace(day=1)
        next_month = (current_month + timedelta(days=32)).replace(day=1)
        
        monthly_applications = LeaveApplication.query.filter(
            LeaveApplication.created_at >= current_month,
            LeaveApplication.created_at < next_month
        ).count()
        
        # Upcoming leaves (next 30 days)
        today = datetime.now().date()
        upcoming_end = today + timedelta(days=30)
        
        upcoming_leaves = LeaveApplication.query.filter(
            LeaveApplication.status == 'approved',
            LeaveApplication.from_date >= today,
            LeaveApplication.from_date <= upcoming_end
        ).count()
        
        return jsonify({
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'total_employees': total_employees,
            'pending_registrations': pending_registrations,
            'monthly_applications': monthly_applications,
            'upcoming_leaves': upcoming_leaves
        }), 200
        
    except Exception as e:
        print(f"Error in get_dashboard_stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ===== DEPARTMENT ANALYTICS =====

@admin_bp.route('/admin/analytics/departments', methods=['GET'])
@jwt_required()
def get_department_analytics():
    """Get analytics by department"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get department-wise leave statistics - Fixed to use employee_id
        dept_stats = db.session.query(
            User.department,
            func.count(LeaveApplication.id).label('total_applications'),
            func.count(func.nullif(LeaveApplication.status == 'approved', False)).label('approved'),
            func.count(func.nullif(LeaveApplication.status == 'pending', False)).label('pending')
        ).join(
            LeaveApplication, User.id == LeaveApplication.employee_id  # Fixed join
        ).group_by(User.department).all()
        
        dept_data = []
        for dept, total, approved, pending in dept_stats:
            dept_data.append({
                'department': dept,
                'total_applications': total,
                'approved': approved,
                'pending': pending,
                'approval_rate': round((approved / total * 100) if total > 0 else 0, 1)
            })
        
        return jsonify({'departments': dept_data}), 200
        
    except Exception as e:
        print(f"Error in get_department_analytics: {str(e)}")
        return jsonify({'error': str(e)}), 500