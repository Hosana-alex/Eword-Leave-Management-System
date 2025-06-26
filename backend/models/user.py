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
    status = db.Column(db.String(20), default='approved')  # 'pending', 'approved', 'rejected'
    emergency_contact = db.Column(db.String(100))
    emergency_phone = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with leave applications - fix the foreign key reference
    leave_applications = db.relationship('LeaveApplication', 
                                       foreign_keys='LeaveApplication.employee_id',
                                       backref='employee', 
                                       lazy=True)
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'department': self.department,
            'designation': self.designation,
            'contacts': self.contacts,
            'role': self.role,
            'status': self.status,  # Include status in the dictionary
            'emergency_contact': self.emergency_contact,
            'emergency_phone': self.emergency_phone,
            'created_at': self.created_at.isoformat()
        }