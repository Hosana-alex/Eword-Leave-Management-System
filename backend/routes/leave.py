from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models.user import User
from models.leave_application import LeaveApplication
from models.leave_balance import LeaveBalance
from utils.database import db
from utils.email_service import send_leave_application_email, send_status_update_email
from routes.notifications import notify_leave_application_submitted

leave_bp = Blueprint('leave', __name__)


@leave_bp.route('/leave-applications', methods=['POST'])
@jwt_required()
def submit_leave_application():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # 🚨 ADD THIS CHECK: Prevent unapproved users from submitting leave
        if user.status != 'approved':
            return jsonify({
                'error': 'Account pending approval',
                'message': 'Your account is still pending admin approval. You cannot submit leave applications until your account is approved.'
            }), 403
        
        data = request.get_json()
        
        # Validate that user has sufficient leave balance
        year = datetime.strptime(data['from_date'], '%Y-%m-%d').year
        balance = LeaveBalance.query.filter_by(user_id=user.id, year=year).first()
        
        if not balance:
            return jsonify({
                'error': 'No leave balance found',
                'message': 'No leave balance record found for the current year. Please contact HR.'
            }), 400
        
        # Calculate requested days
        from_date = datetime.strptime(data['from_date'], '%Y-%m-%d').date()
        to_date = datetime.strptime(data['to_date'], '%Y-%m-%d').date()
        requested_days = (to_date - from_date).days + 1
        
        # Check if user has sufficient balance for each leave type
        leave_types = data.get('leave_types', [])
        for leave_type in leave_types:
            available_balance = balance.get_balance_for_type(leave_type)
            if available_balance is not None and available_balance < requested_days:
                return jsonify({
                    'error': 'Insufficient leave balance',
                    'message': f'Insufficient {leave_type} balance. Available: {available_balance} days, Requested: {requested_days} days'
                }), 400
        
        # Create application
        application = LeaveApplication(
            employee_id=user.id,
            employee_name=user.name,
            department=user.department,
            designation=user.designation or '',
            contacts=user.contacts or '',
            leave_types=','.join(data.get('leave_types', [])),
            from_date=from_date,
            to_date=to_date,
            reason=data['reason'],
            employee_signature=data.get('employee_signature', ''),
            important_comments=data.get('important_comments', ''),
            submitted_date=datetime.now().date()
        )
        
        db.session.add(application)
        db.session.commit()
        
        # 🔔 NOTIFY ALL ADMINS
        notify_leave_application_submitted(application)
        
        # 📧 SEND EMAIL TO ALL ADMINS
        try:
            # Get all admin users
            admins = User.query.filter_by(role='admin').all()
            
            # Prepare leave details for email
            leave_details = {
                'department': user.department,
                'leave_types': data.get('leave_types', []),
                'from_date': data['from_date'],
                'to_date': data['to_date'],
                'reason': data['reason']
            }
            
            # Send email to each admin
            for admin in admins:
                try:
                    send_leave_application_email(
                        admin.email,        # admin_email
                        user.name,          # employee_name
                        leave_details       # leave_details
                    )
                    print(f"✅ Email sent to admin {admin.email} about new leave application from {user.name}")
                    
                except Exception as admin_email_error:
                    print(f"❌ Email failed for admin {admin.email}: {admin_email_error}")
            
        except Exception as email_error:
            print(f"❌ Admin email process failed: {email_error}")
        
        return jsonify({
            'message': 'Leave application submitted successfully',
            'application': {
                'id': application.id,
                'employee_name': application.employee_name,
                'department': application.department,
                'leave_types': application.leave_types,
                'from_date': application.from_date.strftime('%Y-%m-%d'),
                'to_date': application.to_date.strftime('%Y-%m-%d'),
                'status': application.status,
                'submitted_date': application.submitted_date.strftime('%Y-%m-%d') if application.submitted_date else None
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error submitting leave application: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
    
@leave_bp.route('/leave-applications', methods=['GET'])
@jwt_required()
def get_leave_applications():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Get query parameters for filtering
        search = request.args.get('search', '')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        status = request.args.get('status')
        
        # Base query
        if user.role == 'admin':
            query = LeaveApplication.query
        else:
            query = LeaveApplication.query.filter_by(employee_id=user_id)
        
        # Apply search filter
        if search:
            query = query.filter(LeaveApplication.employee_name.ilike(f'%{search}%'))
        
        # Apply date filters
        if from_date:
            query = query.filter(LeaveApplication.from_date >= datetime.strptime(from_date, '%Y-%m-%d').date())
        if to_date:
            query = query.filter(LeaveApplication.to_date <= datetime.strptime(to_date, '%Y-%m-%d').date())
        
        # Apply status filter
        if status and status != 'all':
            query = query.filter_by(status=status)
        
        # Order by creation date
        applications = query.order_by(LeaveApplication.created_at.desc()).all()
        
        return jsonify([app.to_dict() for app in applications]), 200
    
    except Exception as e:
        print(f"Error fetching applications: {str(e)}")
        return jsonify({'message': f'Failed to get applications: {str(e)}'}), 500

@leave_bp.route('/leave-applications/calendar', methods=['GET'])
@jwt_required()
def get_calendar_data():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        # Get date range
        current_year = datetime.now().year
        start_date = datetime(current_year, 1, 1).date()
        end_date = datetime(current_year, 12, 31).date()
        
        # Query leaves within date range
        query = LeaveApplication.query.filter(
            LeaveApplication.from_date <= end_date,
            LeaveApplication.to_date >= start_date
        )
        
        # If not admin, only show approved leaves
        if user.role != 'admin':
            query = query.filter_by(status='approved')
        
        applications = query.all()
        
        return jsonify([app.to_dict() for app in applications]), 200
        
    except Exception as e:
        print(f"Error fetching calendar data: {str(e)}")
        return jsonify({'message': f'Failed to fetch calendar data: {str(e)}'}), 500