# routes/analytics.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func
from models.user import User
from models.leave_application import LeaveApplication
from utils.database import db

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_analytics():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'message': 'Unauthorized'}), 403
        
        # Department-wise stats
        department_stats = db.session.query(
            LeaveApplication.department,
            func.count(LeaveApplication.id).label('count')
        ).group_by(LeaveApplication.department).all()
        
        # Monthly trends (last 6 months)
        monthly_data = []
        
        for i in range(6):
            month_start = datetime.now() - timedelta(days=30*(5-i))
            month_end = month_start + timedelta(days=30)
            
            approved = LeaveApplication.query.filter(
                LeaveApplication.created_at >= month_start,
                LeaveApplication.created_at < month_end,
                LeaveApplication.status == 'approved'
            ).count()
            
            rejected = LeaveApplication.query.filter(
                LeaveApplication.created_at >= month_start,
                LeaveApplication.created_at < month_end,
                LeaveApplication.status == 'rejected'
            ).count()
            
            monthly_data.append({
                'month': month_start.strftime('%B'),
                'approved': approved,
                'rejected': rejected
            })
        
        # Leave type distribution
        leave_type_stats = []
        all_applications = LeaveApplication.query.all()
        leave_type_count = {}
        
        for app in all_applications:
            types = app.leave_types.split(',')
            for leave_type in types:
                leave_type = leave_type.strip()
                if leave_type in leave_type_count:
                    leave_type_count[leave_type] += 1
                else:
                    leave_type_count[leave_type] = 1
        
        for leave_type, count in leave_type_count.items():
            leave_type_stats.append({
                'type': leave_type,
                'count': count
            })
        
        # Upcoming leaves (next 7 days)
        today = datetime.now().date()
        week_later = today + timedelta(days=7)
        
        upcoming_leaves = LeaveApplication.query.filter(
            LeaveApplication.from_date >= today,
            LeaveApplication.from_date <= week_later,
            LeaveApplication.status == 'approved'
        ).all()
        
        # Calculate average leave duration
        approved_leaves = LeaveApplication.query.filter_by(status='approved').all()
        if approved_leaves:
            total_days = sum([(app.to_date - app.from_date).days + 1 for app in approved_leaves])
            avg_duration = round(total_days / len(approved_leaves), 1)
        else:
            avg_duration = 0
        
        # Most common leave type
        most_common_type = max(leave_type_count.items(), key=lambda x: x[1])[0] if leave_type_count else 'None'
        
        # Approval rate
        total_processed = LeaveApplication.query.filter(
            LeaveApplication.status.in_(['approved', 'rejected'])
        ).count()
        approved_count = LeaveApplication.query.filter_by(status='approved').count()
        approval_rate = round((approved_count / total_processed * 100) if total_processed > 0 else 0, 1)
        
        # Active leaves today
        active_leaves = LeaveApplication.query.filter(
            LeaveApplication.from_date <= today,
            LeaveApplication.to_date >= today,
            LeaveApplication.status == 'approved'
        ).count()
        
        return jsonify({
            'departmentStats': [{'department': d[0], 'count': d[1]} for d in department_stats],
            'monthlyTrends': monthly_data,
            'leaveTypeStats': leave_type_stats,
            'upcomingLeaves': [app.to_dict() for app in upcoming_leaves],
            'averageLeaveDuration': avg_duration,
            'mostCommonLeaveType': most_common_type,
            'approvalRate': approval_rate,
            'activeLeaves': active_leaves
        }), 200
        
    except Exception as e:
        print(f"Error fetching analytics: {str(e)}")
        return jsonify({'message': f'Failed to fetch analytics: {str(e)}'}), 500