# models/leave_balance.py
from datetime import datetime
from utils.database import db

class LeaveBalance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    
    # Leave types and their balances
    sick_leave_total = db.Column(db.Integer, default=10)
    sick_leave_used = db.Column(db.Integer, default=0)
    
    personal_leave_total = db.Column(db.Integer, default=5)
    personal_leave_used = db.Column(db.Integer, default=0)
    
    maternity_leave_total = db.Column(db.Integer, default=90)  # 90 days for maternity
    maternity_leave_used = db.Column(db.Integer, default=0)
    
    study_leave_total = db.Column(db.Integer, default=10)
    study_leave_used = db.Column(db.Integer, default=0)
    
    bereavement_leave_total = db.Column(db.Integer, default=5)
    bereavement_leave_used = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='leave_balances')
    
    def get_balance_for_type(self, leave_type):
        """Get remaining balance for a specific leave type"""
        leave_type_map = {
            'Sick Leave': ('sick_leave_total', 'sick_leave_used'),
            'Personal Leave': ('personal_leave_total', 'personal_leave_used'),
            'Maternity Leave/Paternity Leave': ('maternity_leave_total', 'maternity_leave_used'),
            'Study Leave': ('study_leave_total', 'study_leave_used'),
            'Bereavement': ('bereavement_leave_total', 'bereavement_leave_used')
        }
        
        if leave_type in leave_type_map:
            total_field, used_field = leave_type_map[leave_type]
            total = getattr(self, total_field, 0)
            used = getattr(self, used_field, 0)
            return total - used
        
        return None  # For 'Other' or 'Unpaid Leave'
    
    def update_used_leave(self, leave_type, days):
        """Update used leave for a specific type"""
        leave_type_map = {
            'Sick Leave': 'sick_leave_used',
            'Personal Leave': 'personal_leave_used',
            'Maternity Leave/Paternity Leave': 'maternity_leave_used',
            'Study Leave': 'study_leave_used',
            'Bereavement': 'bereavement_leave_used'
        }
        
        if leave_type in leave_type_map:
            used_field = leave_type_map[leave_type]
            current_used = getattr(self, used_field, 0)
            setattr(self, used_field, current_used + days)
            self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'year': self.year,
            'balances': {
                'sick_leave': {
                    'total': self.sick_leave_total,
                    'used': self.sick_leave_used,
                    'remaining': self.sick_leave_total - self.sick_leave_used
                },
                'personal_leave': {
                    'total': self.personal_leave_total,
                    'used': self.personal_leave_used,
                    'remaining': self.personal_leave_total - self.personal_leave_used
                },
                'maternity_leave': {
                    'total': self.maternity_leave_total,
                    'used': self.maternity_leave_used,
                    'remaining': self.maternity_leave_total - self.maternity_leave_used
                },
                'study_leave': {
                    'total': self.study_leave_total,
                    'used': self.study_leave_used,
                    'remaining': self.study_leave_total - self.study_leave_used
                },
                'bereavement_leave': {
                    'total': self.bereavement_leave_total,
                    'used': self.bereavement_leave_used,
                    'remaining': self.bereavement_leave_total - self.bereavement_leave_used
                }
            }
        }