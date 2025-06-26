from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import User
from utils.database import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 400
        
        # Create new user
        user = User(
            email=data['email'],
            name=data['name'],
            department=data['department'],
            designation=data.get('designation', ''),
            contacts=data.get('contacts', ''),
            role=data.get('role', 'employee')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'User registered successfully'}), 201
    
    except Exception as e:
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            # Make sure to pass user.id as a string to create_access_token
            access_token = create_access_token(identity=str(user.id))
            return jsonify({
                'access_token': access_token,
                'user': user.to_dict()
            }), 200
        
        return jsonify({'message': 'Invalid email or password'}), 401
    
    except Exception as e:
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
        return jsonify({'message': f'Failed to get profile: {str(e)}'}), 500