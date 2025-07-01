# routes/analytics.py - Updated to match frontend expectations
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_, extract
from models.user import User
from models.leave_application import LeaveApplication
from models.leave_balance import LeaveBalance
from utils.database import db

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/dashboard', methods=['GET'])
@jwt_required()
def get_analytics_dashboard():
    """Get comprehensive analytics for dashboard - matching frontend expectations"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        current_year = datetime.now().year
        
        # Department-wise statistics (renamed to match frontend)
        dept_stats = db.session.query(
            User.department,
            func.count(LeaveApplication.id).label('count')
        ).join(
            LeaveApplication, User.id == LeaveApplication.employee_id
        ).filter(
            extract('year', LeaveApplication.from_date) == current_year
        ).group_by(User.department).all()
        
        department_stats = []
        for dept, count in dept_stats:
            department_stats.append({
                'department': dept or 'Unknown',
                'count': count
            })
        
        # Monthly trends
        monthly_stats = db.session.query(
            extract('month', LeaveApplication.from_date).label('month'),
            func.count(
                func.case([(LeaveApplication.status == 'approved', 1)])
            ).label('approved'),
            func.count(
                func.case([(LeaveApplication.status == 'rejected', 1)])
            ).label('rejected')
        ).filter(
            extract('year', LeaveApplication.from_date) == current_year
        ).group_by(extract('month', LeaveApplication.from_date)).all()
        
        monthly_trends = []
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        # Initialize all months with zero
        month_data = {i: {'approved': 0, 'rejected': 0} for i in range(1, 13)}
        
        # Fill in actual data
        for month, approved, rejected in monthly_stats:
            month_data[int(month)] = {
                'approved': approved,
                'rejected': rejected
            }
        
        # Convert to expected format
        for month_num in range(1, 13):
            monthly_trends.append({
                'month': month_names[month_num - 1],
                'approved': month_data[month_num]['approved'],
                'rejected': month_data[month_num]['rejected']
            })
        
        # Leave type distribution
        leave_type_stats = db.session.query(
            LeaveApplication.leave_types,
            func.count(LeaveApplication.id).label('count')
        ).filter(
            extract('year', LeaveApplication.from_date) == current_year,
            LeaveApplication.status == 'approved'
        ).group_by(LeaveApplication.leave_types).all()
        
        leave_type_data = {}
        for leave_types, count in leave_type_stats:
            # Split multiple leave types and count each
            types = [lt.strip() for lt in leave_types.split(',')]
            for leave_type in types:
                if leave_type in leave_type_data:
                    leave_type_data[leave_type] += count
                else:
                    leave_type_data[leave_type] = count
        
        leave_type_stats_formatted = []
        for leave_type, count in leave_type_data.items():
            leave_type_stats_formatted.append({
                'type': leave_type,
                'count': count
            })
        
        # Upcoming leaves (next 7 days)
        today = datetime.now().date()
        next_week = today + timedelta(days=7)
        
        upcoming_leaves = db.session.query(
            LeaveApplication, User
        ).join(
            User, LeaveApplication.employee_id == User.id
        ).filter(
            LeaveApplication.status == 'approved',
            LeaveApplication.from_date >= today,
            LeaveApplication.from_date <= next_week
        ).order_by(LeaveApplication.from_date).all()
        
        upcoming_data = []
        for app, emp in upcoming_leaves:
            upcoming_data.append({
                'id': app.id,
                'employee_name': emp.name,
                'department': emp.department,
                'from_date': app.from_date.isoformat(),
                'leave_types': app.leave_types.split(',')
            })
        
        # Calculate summary statistics
        total_applications = LeaveApplication.query.filter(
            extract('year', LeaveApplication.from_date) == current_year
        ).count()
        
        approved_applications = LeaveApplication.query.filter(
            extract('year', LeaveApplication.from_date) == current_year,
            LeaveApplication.status == 'approved'
        ).count()
        
        rejected_applications = LeaveApplication.query.filter(
            extract('year', LeaveApplication.from_date) == current_year,
            LeaveApplication.status == 'rejected'
        ).count()
        
        # Average leave duration
        avg_duration = db.session.query(
            func.avg(
                func.julianday(LeaveApplication.to_date) - 
                func.julianday(LeaveApplication.from_date) + 1
            )
        ).filter(
            extract('year', LeaveApplication.from_date) == current_year,
            LeaveApplication.status == 'approved'
        ).scalar()
        
        # Most common leave type
        most_common_type = 'Personal Leave'  # Default
        if leave_type_stats_formatted:
            most_common_type = max(leave_type_stats_formatted, key=lambda x: x['count'])['type']
        
        # Current active leaves
        active_leaves = LeaveApplication.query.filter(
            LeaveApplication.status == 'approved',
            LeaveApplication.from_date <= today,
            LeaveApplication.to_date >= today
        ).count()
        
        return jsonify({
            'departmentStats': department_stats,
            'monthlyTrends': monthly_trends,
            'leaveTypeStats': leave_type_stats_formatted,
            'upcomingLeaves': upcoming_data,
            'averageLeaveDuration': round(avg_duration, 1) if avg_duration else 0,
            'mostCommonLeaveType': most_common_type,
            'approvalRate': round((approved_applications / total_applications * 100) if total_applications > 0 else 0, 1),
            'activeLeaves': active_leaves,
            'totalApplications': total_applications,
            'year': current_year
        }), 200
        
    except Exception as e:
        print(f"Error in analytics dashboard: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# Keep all other existing analytics endpoints as they are
@analytics_bp.route('/analytics/absence-rates', methods=['GET'])
@jwt_required()
def get_absence_rates():
    """Get absence rates by period"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        period = request.args.get('period', 'monthly')
        year = request.args.get('year', datetime.now().year, type=int)
        
        if period == 'monthly':
            # Monthly absence rates
            monthly_rates = []
            for month in range(1, 13):
                # Get approved leave days for the month
                leave_days = db.session.query(
                    func.sum(
                        func.julianday(LeaveApplication.to_date) - 
                        func.julianday(LeaveApplication.from_date) + 1
                    )
                ).filter(
                    LeaveApplication.status == 'approved',
                    extract('year', LeaveApplication.from_date) == year,
                    extract('month', LeaveApplication.from_date) == month
                ).scalar() or 0
                
                # Get total working days (assuming 22 working days per month)
                total_employees = User.query.filter_by(role='employee', status='approved').count()
                total_working_days = total_employees * 22
                
                absence_rate = (leave_days / total_working_days * 100) if total_working_days > 0 else 0
                
                monthly_rates.append({
                    'month': month,
                    'absence_rate': round(absence_rate, 2),
                    'leave_days': int(leave_days),
                    'total_working_days': total_working_days
                })
            
            return jsonify({'absence_rates': monthly_rates, 'period': 'monthly'}), 200
        
        return jsonify({'error': 'Invalid period'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/analytics/utilization', methods=['GET'])
@jwt_required()
def get_utilization_data():
    """Get leave utilization vs entitlement"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        year = request.args.get('year', datetime.now().year, type=int)
        
        # Get all employees with their leave balances
        employees = User.query.filter_by(role='employee', status='approved').all()
        
        utilization_data = []
        for emp in employees:
            balance = LeaveBalance.query.filter_by(user_id=emp.id, year=year).first()
            
            if balance:
                total_entitlement = (
                    balance.sick_leave_total + 
                    balance.personal_leave_total +
                    balance.study_leave_total +
                    balance.bereavement_leave_total
                )
                
                total_used = (
                    balance.sick_leave_used +
                    balance.personal_leave_used +
                    balance.study_leave_used +
                    balance.bereavement_leave_used
                )
                
                utilization_rate = (total_used / total_entitlement * 100) if total_entitlement > 0 else 0
                
                utilization_data.append({
                    'employee_name': emp.name,
                    'department': emp.department,
                    'total_entitlement': total_entitlement,
                    'total_used': total_used,
                    'utilization_rate': round(utilization_rate, 1),
                    'remaining': total_entitlement - total_used
                })
        
        return jsonify({'utilization': utilization_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/analytics/coverage-risk', methods=['GET'])
@jwt_required()
def get_coverage_risk():
    """Get coverage risk analysis"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date:
            start_date = datetime.now().date()
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        if not end_date:
            end_date = start_date + timedelta(days=30)
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get all approved leaves in the date range
        overlapping_leaves = LeaveApplication.query.filter(
            LeaveApplication.status == 'approved',
            or_(
                and_(
                    LeaveApplication.from_date <= end_date,
                    LeaveApplication.to_date >= start_date
                )
            )
        ).all()
        
        # Group by department and date
        coverage_data = {}
        
        for leave in overlapping_leaves:
            emp = User.query.get(leave.employee_id)
            if not emp:
                continue
                
            dept = emp.department
            if dept not in coverage_data:
                coverage_data[dept] = {
                    'department': dept,
                    'total_employees': User.query.filter_by(department=dept, role='employee', status='approved').count(),
                    'leaves_by_date': {}
                }
            
            # Add leave days to the department's data
            current_date = max(leave.from_date, start_date)
            end_leave_date = min(leave.to_date, end_date)
            
            while current_date <= end_leave_date:
                date_str = current_date.isoformat()
                if date_str not in coverage_data[dept]['leaves_by_date']:
                    coverage_data[dept]['leaves_by_date'][date_str] = []
                
                coverage_data[dept]['leaves_by_date'][date_str].append({
                    'employee': emp.name,
                    'leave_type': leave.leave_types
                })
                
                current_date += timedelta(days=1)
        
        # Calculate risk levels
        risk_analysis = []
        for dept_data in coverage_data.values():
            max_absent = 0
            risk_dates = []
            
            for date_str, absent_employees in dept_data['leaves_by_date'].items():
                absent_count = len(absent_employees)
                if absent_count > max_absent:
                    max_absent = absent_count
                
                absence_rate = (absent_count / dept_data['total_employees'] * 100) if dept_data['total_employees'] > 0 else 0
                
                if absence_rate > 30:  # High risk threshold
                    risk_dates.append({
                        'date': date_str,
                        'absent_count': absent_count,
                        'absence_rate': round(absence_rate, 1),
                        'employees': absent_employees
                    })
            
            risk_level = 'Low'
            if max_absent / dept_data['total_employees'] > 0.3:
                risk_level = 'High'
            elif max_absent / dept_data['total_employees'] > 0.15:
                risk_level = 'Medium'
            
            risk_analysis.append({
                'department': dept_data['department'],
                'total_employees': dept_data['total_employees'],
                'max_absent_on_single_day': max_absent,
                'risk_level': risk_level,
                'high_risk_dates': risk_dates
            })
        
        return jsonify({
            'coverage_risk': risk_analysis,
            'analysis_period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500