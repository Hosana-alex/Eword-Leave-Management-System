from datetime import datetime
from utils.database import db, bcrypt

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    designation = db.Column(db.String(100))
    contacts = db.Column(db.String(100))
    role = db.Column(db.String(20), default='employee')  # 'employee' or 'admin'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected', 'deactivated'
    
    # Enhanced fields for comprehensive user management
    employee_id = db.Column(db.String(50), unique=True)  # Company employee ID
    date_of_birth = db.Column(db.Date)
    hire_date = db.Column(db.Date, default=datetime.utcnow)
    gender = db.Column(db.String(10))  # For maternity/paternity leave eligibility
    manager_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # Reporting manager
    
    # Emergency contact information
    emergency_contact = db.Column(db.String(100))
    emergency_phone = db.Column(db.String(50))
    emergency_relationship = db.Column(db.String(50))  # Relationship to emergency contact
    
    # Address information
    address = db.Column(db.Text)
    city = db.Column(db.String(50))
    postal_code = db.Column(db.String(20))
    
    # Employment details
    employment_type = db.Column(db.String(30), default='full-time')  # full-time, part-time, contract
    salary_grade = db.Column(db.String(10))
    probation_end_date = db.Column(db.Date)
    
    # Profile and preferences
    profile_picture = db.Column(db.String(255))  # URL to profile picture
    notification_preferences = db.Column(db.Text)  # JSON string for notification settings
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # NEW: Phase 1 Fields for Enhanced User Management
    password_reset_required = db.Column(db.Boolean, default=False)  # Force password change on next login
    deactivated_at = db.Column(db.DateTime)  # When user was deactivated
    deactivated_by = db.Column(db.Integer, db.ForeignKey('user.id'))  # Who deactivated the user
    reactivated_at = db.Column(db.DateTime)  # When user was reactivated
    reactivated_by = db.Column(db.Integer, db.ForeignKey('user.id'))  # Who reactivated the user
    approved_at = db.Column(db.DateTime)  # When user was approved
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'))  # Who approved the user
    rejected_at = db.Column(db.DateTime)  # When user was rejected
    rejected_by = db.Column(db.Integer, db.ForeignKey('user.id'))  # Who rejected the user
    
    # Audit fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))  # Admin who approved
    
    # Relationships - FIXED to use employee_id
    leave_applications = db.relationship('LeaveApplication', 
                                       foreign_keys='LeaveApplication.employee_id',
                                       backref='employee', 
                                       lazy=True)
    
    # Self-referential relationship for manager
    subordinates = db.relationship('User', 
                                 backref=db.backref('manager', remote_side=[id]),
                                 foreign_keys=[manager_id])
    
    # NEW: Relationships for tracking admin actions
    deactivated_by_user = db.relationship('User', 
                                        foreign_keys=[deactivated_by], 
                                        remote_side=[id],
                                        backref='users_deactivated')
    reactivated_by_user = db.relationship('User', 
                                        foreign_keys=[reactivated_by], 
                                        remote_side=[id],
                                        backref='users_reactivated')
    approved_by_user = db.relationship('User', 
                                     foreign_keys=[approved_by], 
                                     remote_side=[id],
                                     backref='users_approved')
    rejected_by_user = db.relationship('User', 
                                     foreign_keys=[rejected_by], 
                                     remote_side=[id],
                                     backref='users_rejected')
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def get_tenure_months(self):
        """Calculate tenure in months"""
        if not self.hire_date:
            return 0
        today = datetime.now().date()
        return ((today.year - self.hire_date.year) * 12 + 
                (today.month - self.hire_date.month))
    
    def get_tenure_years(self):
        """Calculate tenure in years"""
        return self.get_tenure_months() // 12
    
    def is_eligible_for_maternity_leave(self):
        """Check if user is eligible for maternity leave"""
        return (self.gender and self.gender.lower() in ['female', 'f'] and 
                self.get_tenure_months() >= 12)  # Assuming 1 year minimum service
    
    def is_eligible_for_paternity_leave(self):
        """Check if user is eligible for paternity leave"""
        return (self.gender and self.gender.lower() in ['male', 'm'] and 
                self.get_tenure_months() >= 12)  # Assuming 1 year minimum service
    
    @property
    def is_admin(self):
        """Check if user is admin"""
        return self.role == 'admin'
    
    @property
    def is_approved(self):
        """Check if user registration is approved"""
        return self.status == 'approved'
    
    @property
    def is_deactivated(self):
        """Check if user is deactivated"""
        return self.status == 'deactivated'
    
    @property
    def can_login(self):
        """Check if user can log in"""
        return self.status == 'approved' and self.is_active
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    # NEW: Phase 1 Methods
    def deactivate(self, admin_user_id):
        """Deactivate user"""
        self.status = 'deactivated'
        self.deactivated_at = datetime.utcnow()
        self.deactivated_by = admin_user_id
        self.is_active = False
    
    def reactivate(self, admin_user_id):
        """Reactivate user"""
        self.status = 'approved'
        self.reactivated_at = datetime.utcnow()
        self.reactivated_by = admin_user_id
        self.is_active = True
    
    def approve(self, admin_user_id):
        """Approve user registration"""
        self.status = 'approved'
        self.approved_at = datetime.utcnow()
        self.approved_by = admin_user_id
        self.is_active = True
    
    def reject(self, admin_user_id):
        """Reject user registration"""
        self.status = 'rejected'
        self.rejected_at = datetime.utcnow()
        self.rejected_by = admin_user_id
        self.is_active = False
    
    def reset_password_required(self):
        """Mark user as requiring password reset"""
        self.password_reset_required = True
    
    def get_action_history(self):
        """Get history of admin actions on this user"""
        history = []
        
        if self.approved_at:
            history.append({
                'action': 'approved',
                'timestamp': self.approved_at,
                'admin': self.approved_by_user.name if self.approved_by_user else 'System'
            })
        
        if self.rejected_at:
            history.append({
                'action': 'rejected',
                'timestamp': self.rejected_at,
                'admin': self.rejected_by_user.name if self.rejected_by_user else 'System'
            })
        
        if self.deactivated_at:
            history.append({
                'action': 'deactivated',
                'timestamp': self.deactivated_at,
                'admin': self.deactivated_by_user.name if self.deactivated_by_user else 'System'
            })
        
        if self.reactivated_at:
            history.append({
                'action': 'reactivated',
                'timestamp': self.reactivated_at,
                'admin': self.reactivated_by_user.name if self.reactivated_by_user else 'System'
            })
        
        # Sort by timestamp, most recent first
        return sorted(history, key=lambda x: x['timestamp'], reverse=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'department': self.department,
            'designation': self.designation,
            'contacts': self.contacts,
            'role': self.role,
            'status': self.status,
            
            # Emergency contact information
            'emergency_contact': self.emergency_contact,
            'emergency_phone': self.emergency_phone,
            'emergency_relationship': self.emergency_relationship,
            
            # Personal information
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            
            # Address information
            'address': self.address,
            'city': self.city,
            'postal_code': self.postal_code,
            
            # Employment details
            'employment_type': self.employment_type,
            
            # System fields
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            
            # Computed fields
            'password_reset_required': bool(self.password_reset_required) if self.password_reset_required else False
        }
        
    def to_dict_summary(self):
        """Get a summary version for listings"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'department': self.department,
            'designation': self.designation,
            'status': self.status,
            'tenure_years': self.get_tenure_years(),
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'can_login': self.can_login,
            'is_active': self.is_active
        }
    
    def to_dict_admin(self):
        """Get admin view with action history"""
        base_dict = self.to_dict()
        base_dict['action_history'] = self.get_action_history()
        return base_dict
    
    def __repr__(self):
        return f'<User {self.email}>'