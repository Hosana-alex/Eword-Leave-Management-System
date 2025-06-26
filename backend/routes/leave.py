from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models.user import User
from models.leave_application import LeaveApplication
from models.leave_balance import LeaveBalance
from utils.database import db
from utils.email_service import send_leave_application_email, send_status_update_email

leave_bp = Blueprint('leave', __name__)

@leave_bp.route('/leave-applications', methods=['POST'])
@jwt_required()
def submit_leave_application():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['employee_name', 'department', 'leave_types', 'from_date', 'to_date', 'reason']
        missing_fields = []
        
        for field in required_fields:
            if field not in data or not data[field]:
                missing_fields.append(field)
        
        if missing_fields:
            return jsonify({
                'message': f'Missing required fields: {", ".join(missing_fields)}',
                'missing_fields': missing_fields
            }), 422
        
        # Validate leave_types
        if not isinstance(data['leave_types'], list) or len(data['leave_types']) == 0:
            return jsonify({'message': 'At least one leave type must be selected'}), 422
        
        # Parse dates
        try:
            from_date = datetime.strptime(data['from_date'], '%Y-%m-%d').date()
            to_date = datetime.strptime(data['to_date'], '%Y-%m-%d').date()
        except ValueError as e:
            return jsonify({'message': f'Invalid date format: {str(e)}'}), 422
        
        # Validate date range
        if from_date > to_date:
            return jsonify({'message': 'From date cannot be after to date'}), 422
        
        # Check for overlapping leave requests
        overlapping = LeaveApplication.query.filter(
            LeaveApplication.employee_id == user_id,
            LeaveApplication.status.in_(['pending', 'approved']),
            LeaveApplication.from_date <= to_date,
            LeaveApplication.to_date >= from_date
        ).first()
        
        if overlapping:
            return jsonify({
                'message': 'You already have a leave application for this period',
                'overlapping_id': overlapping.id
            }), 400
        
        # Calculate leave days
        leave_days = (to_date - from_date).days + 1
        
        # Check leave balance for each type
        current_year = from_date.year
        balance = LeaveBalance.query.filter_by(user_id=user_id, year=current_year).first()
        
        if not balance:
            balance = LeaveBalance(user_id=user_id, year=current_year)
            db.session.add(balance)
            db.session.commit()
        
        # Validate balance for non-unpaid leave types
        for leave_type in data['leave_types']:
            if leave_type not in ['Unpaid Leave', 'Other']:
                remaining = balance.get_balance_for_type(leave_type)
                if remaining is not None and remaining < leave_days:
                    return jsonify({
                        'message': f'Insufficient {leave_type} balance. You have {remaining} days remaining.',
                        'leave_type': leave_type,
                        'remaining': remaining,
                        'requested': leave_days
                    }), 400
        
        # Create leave application
        leave_app = LeaveApplication(
            employee_id=user_id,
            employee_name=data['employee_name'],
            department=data['department'],
            designation=data.get('designation', ''),
            contacts=data.get('contacts', ''),
            leave_types=','.join(data['leave_types']),
            from_date=from_date,
            to_date=to_date,
            reason=data['reason'],
            employee_signature=data.get('employee_signature', ''),
            important_comments=data.get('important_comments', '')
        )
        
        db.session.add(leave_app)
        db.session.commit()
        
        # Send email to all admins
        admins = User.query.filter_by(role='admin').all()
        for admin in admins:
            send_leave_application_email(
                admin.email,
                user.name,
                {
                    'department': data['department'],
                    'leave_types': data['leave_types'],
                    'from_date': from_date.isoformat(),
                    'to_date': to_date.isoformat(),
                    'reason': data['reason']
                }
            )
        
        return jsonify({
            'message': 'Leave application submitted successfully',
            'application': leave_app.to_dict()
        }), 201
    
    except Exception as e:
        print(f"Error submitting leave application: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to submit application: {str(e)}'}), 500

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