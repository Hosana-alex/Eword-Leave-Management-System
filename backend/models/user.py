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
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected'
    
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
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary, optionally including sensitive data"""
        base_dict = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'department': self.department,
            'designation': self.designation,
            'contacts': self.contacts,
            'role': self.role,
            'status': self.status,
            'employee_id': self.employee_id,
            'gender': self.gender,
            'employment_type': self.employment_type,
            'hire_date': self.hire_date.isoformat() if self.hire_date else None,
            'tenure_months': self.get_tenure_months(),
            'tenure_years': self.get_tenure_years(),
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'manager_id': self.manager_id,
            'manager_name': self.manager.name if self.manager else None
        }
        
        # Include sensitive data only if explicitly requested (for profile editing)
        if include_sensitive:
            base_dict.update({
                'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
                'emergency_contact': self.emergency_contact,
                'emergency_phone': self.emergency_phone,
                'emergency_relationship': self.emergency_relationship,
                'address': self.address,
                'city': self.city,
                'postal_code': self.postal_code,
                'salary_grade': self.salary_grade,
                'probation_end_date': self.probation_end_date.isoformat() if self.probation_end_date else None,
                'profile_picture': self.profile_picture,
                'notification_preferences': self.notification_preferences
            })
        
        return base_dict
    
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
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    
    def __repr__(self):
        return f'<User {self.email}>'