from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
from models.user import User
from models.leave_balance import LeaveBalance
from utils.database import db
from routes.notifications import notify_user_registration, notify_user_approved

auth_bp = Blueprint('auth', __name__)


def is_company_email(email):
    """
    Check if email follows EWORD Publishers pattern
    Pattern: xxxxx.ewordpublishers@gmail.com
    Examples:
    - john.ewordpublishers@gmail.com ✅
    - mary.doe.ewordpublishers@gmail.com ✅  
    - external@gmail.com ❌
    - someone@yahoo.com ❌
    """
    return email.lower().endswith('.ewordpublishers@gmail.com')


@auth_bp.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email', '').lower()
        
        # Check if user exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Auto-approval logic for EWORD Publishers emails
        if is_company_email(email):
            initial_status = 'approved'
            print(f"✅ Auto-approving company email: {email}")
        else:
            initial_status = 'pending'
            print(f"⏳ Requiring manual approval for external email: {email}")
        
        # Create user
        user = User(
            name=data['name'],
            email=email,
            department=data['department'],
            designation=data.get('designation', ''),
            contacts=data.get('contacts', ''),
            emergency_contact=data.get('emergency_contact', ''),
            emergency_phone=data.get('emergency_phone', ''),
            role='employee',
            status=initial_status  # Auto-approve company emails or set to pending
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.flush()  # Get the user ID before committing
        
        # If auto-approved, create leave balance immediately
        if initial_status == 'approved':
            current_year = datetime.now().year
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
            print(f"✅ Created leave balance for auto-approved user: {email}")
            
            # 🔔 NOTIFY USER ABOUT AUTO-APPROVAL
            notify_user_approved(user)
        else:
            # 🔔 NOTIFY ADMINS ABOUT NEW REGISTRATION REQUIRING APPROVAL
            notify_user_registration(user)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Registration successful. You can now log in.' if initial_status == 'approved' else 'Registration successful. Your account is pending admin approval.',
            'user': user.to_dict(),
            'auto_approved': initial_status == 'approved'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Registration error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').lower()
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(data['password']):
            # Check if user account is approved
            if user.status != 'approved':
                return jsonify({
                    'error': 'Account pending approval',
                    'message': 'Your account is still pending admin approval. Please wait for approval before logging in.',
                    'status': user.status
                }), 403
            
            # Make sure to pass user.id as a string to create_access_token
            access_token = create_access_token(identity=str(user.id))
            return jsonify({
                'access_token': access_token,
                'user': user.to_dict()
            }), 200
        
        return jsonify({'message': 'Invalid email or password'}), 401
    
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return jsonify({'message': f'Login failed: {str(e)}'}), 500


@auth_bp.route('/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        # get_jwt_identity() returns a string, so convert to int for database query
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify(user.to_dict()), 200
    
    except Exception as e:
        print(f"❌ Profile fetch error: {str(e)}")
        return jsonify({'message': f'Failed to get profile: {str(e)}'}), 500


@auth_bp.route('/auth/user', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user - alias for profile endpoint"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
    
    except Exception as e:
        print(f"❌ Current user fetch error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/auth/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Allow users to change their password"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Verify current password
        if not user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Update password
        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Password change error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout endpoint (mainly for frontend to clear tokens)"""
    try:
        # In a JWT system, logout is typically handled on the frontend
        # by clearing the stored token. This endpoint exists for consistency.
        return jsonify({'message': 'Logged out successfully'}), 200
    
    except Exception as e:
        print(f"❌ Logout error: {str(e)}")
        return jsonify({'error': str(e)}), 500