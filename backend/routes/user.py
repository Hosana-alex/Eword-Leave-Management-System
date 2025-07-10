# routes/user.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models.user import User
from models.leave_balance import LeaveBalance
from models.leave_application import LeaveApplication
from utils.database import db

user_bp = Blueprint('user', __name__)

@user_bp.route('/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get current user's profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict(include_sensitive=True)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/user/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    """Update current user's profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = [
            'name', 'contacts', 'emergency_contact', 'emergency_phone', 
            'emergency_relationship', 'address', 'city', 'postal_code',
            'notification_preferences'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/user/leave-balance', methods=['GET'])
@jwt_required()
def get_user_leave_balance():
    """Get current user's leave balance"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        year = request.args.get('year', datetime.now().year, type=int)
        
        balance = LeaveBalance.query.filter_by(user_id=user.id, year=year).first()
        
        if not balance:
            # Create default balance if doesn't exist
            balance = LeaveBalance(
                user_id=user.id,
                year=year,
                sick_leave_total=14,
                personal_leave_total=21,
                maternity_leave_total=90,
                study_leave_total=10,
                bereavement_leave_total=5
            )
            db.session.add(balance)
            db.session.commit()
        
        return jsonify({'balance': balance.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/user/applications', methods=['GET'])
@jwt_required()
def get_user_applications():
    """Get current user's leave applications"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        status = request.args.get('status')
        year = request.args.get('year', type=int)
        
        # Build query
        query = LeaveApplication.query.filter_by(employee_id=user.id)
        
        if status:
            query = query.filter(LeaveApplication.status == status)
        
        if year:
            query = query.filter(
                db.extract('year', LeaveApplication.from_date) == year
            )
        
        applications = query.order_by(LeaveApplication.created_at.desc()).all()
        
        applications_data = []
        for app in applications:
            app_data = app.to_dict()
            app_data['days_count'] = (app.to_date - app.from_date).days + 1
            applications_data.append(app_data)
        
        return jsonify({'applications': applications_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/user/calendar', methods=['GET'])
@jwt_required()
def get_user_calendar():
    """Get current user's calendar data"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        year = request.args.get('year', datetime.now().year, type=int)
        month = request.args.get('month', type=int)
        
        # Build query for approved leaves
        query = LeaveApplication.query.filter_by(
            employee_id=user.id, 
            status='approved'
        )
        
        if month:
            query = query.filter(
                db.or_(
                    db.and_(
                        db.extract('year', LeaveApplication.from_date) == year,
                        db.extract('month', LeaveApplication.from_date) == month
                    ),
                    db.and_(
                        db.extract('year', LeaveApplication.to_date) == year,
                        db.extract('month', LeaveApplication.to_date) == month
                    )
                )
            )
        else:
            query = query.filter(
                db.or_(
                    db.extract('year', LeaveApplication.from_date) == year,
                    db.extract('year', LeaveApplication.to_date) == year
                )
            )
        
        applications = query.all()
        
        events = []
        for app in applications:
            events.append({
                'id': app.id,
                'title': f"{', '.join(app.leave_types.split(','))} - {app.employee_name}",
                'start': app.from_date.isoformat(),
                'end': app.to_date.isoformat(),
                'type': 'leave',
                'status': app.status,
                'leave_types': app.leave_types.split(','),
                'reason': app.reason
            })
        
        return jsonify({'events': events}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500