#models/leave_application.py
from datetime import datetime
from utils.database import db

class LeaveApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    employee_name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    designation = db.Column(db.String(100))
    contacts = db.Column(db.String(100))
    leave_types = db.Column(db.Text, nullable=False)  # JSON string of selected leave types
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    employee_signature = db.Column(db.String(100))
    important_comments = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected'
    submitted_date = db.Column(db.Date, default=datetime.utcnow().date)
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    approved_date = db.Column(db.DateTime)
    admin_comments = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee_name': self.employee_name,
            'department': self.department,
            'designation': self.designation,
            'contacts': self.contacts,
            'leave_types': self.leave_types.split(',') if self.leave_types else [],
            'from_date': self.from_date.isoformat(),
            'to_date': self.to_date.isoformat(),
            'reason': self.reason,
            'employee_signature': self.employee_signature,
            'important_comments': self.important_comments,
            'status': self.status,
            'submitted_date': self.submitted_date.isoformat(),
            'approved_by': self.approved_by,
            'approved_date': self.approved_date.isoformat() if self.approved_date else None,
            'admin_comments': self.admin_comments,
            'created_at': self.created_at.isoformat()
        }