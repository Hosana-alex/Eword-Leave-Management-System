from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models.user import User
from models.leave_balance import LeaveBalance
from utils.database import db

user_bp = Blueprint('user', __name__)

@user_bp.route('/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify(user.to_dict()), 200
    
    except Exception as e:
        return jsonify({'message': f'Failed to get profile: {str(e)}'}), 500

@user_bp.route('/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        user.name = data.get('name', user.name)
        user.department = data.get('department', user.department)
        user.designation = data.get('designation', user.designation)
        user.contacts = data.get('contacts', user.contacts)
        user.emergency_contact = data.get('emergency_contact', user.emergency_contact)
        user.emergency_phone = data.get('emergency_phone', user.emergency_phone)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        return jsonify({'message': f'Failed to update profile: {str(e)}'}), 500

@user_bp.route('/user/leave-balance', methods=['GET'])
@jwt_required()
def get_leave_balance():
    try:
        user_id = int(get_jwt_identity())
        current_year = datetime.now().year
        
        # Get or create leave balance for current year
        balance = LeaveBalance.query.filter_by(
            user_id=user_id,
            year=current_year
        ).first()
        
        if not balance:
            # Create new balance for the year
            balance = LeaveBalance(
                user_id=user_id,
                year=current_year
            )
            db.session.add(balance)
            db.session.commit()
        
        return jsonify(balance.to_dict()), 200
        
    except Exception as e:
        print(f"Error fetching leave balance: {str(e)}")
        return jsonify({'message': f'Failed to fetch leave balance: {str(e)}'}), 500