# models/notification.py - Fixed version
from datetime import datetime
from utils.database import db
import json

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='info')  # info, success, warning, error
    read = db.Column(db.Boolean, default=False)
    action_url = db.Column(db.String(200))
    extra_data = db.Column(db.Text)  # Changed from 'metadata' to 'extra_data'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime)
    
    # Relationship
    user = db.relationship('User', backref='notifications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'read': self.read,
            'action_url': self.action_url,
            'metadata': json.loads(self.extra_data) if self.extra_data else None,  # Still return as 'metadata' for frontend
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None
        }