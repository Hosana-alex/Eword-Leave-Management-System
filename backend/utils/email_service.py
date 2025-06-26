# utils/email_service.py
from flask_mail import Mail, Message
from flask import current_app
import os

mail = Mail()

def init_mail(app):
    """Initialize Flask-Mail with app configuration"""
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@ewordpublishers.com')
    
    mail.init_app(app)

def send_leave_application_email(admin_email, employee_name, leave_details):
    """Send email to admin when new leave application is submitted"""
    try:
        msg = Message(
            subject=f'New Leave Application from {employee_name}',
            recipients=[admin_email]
        )
        
        msg.body = f"""
Dear Admin,

A new leave application has been submitted:

Employee: {employee_name}
Department: {leave_details['department']}
Leave Type: {', '.join(leave_details['leave_types'])}
Duration: {leave_details['from_date']} to {leave_details['to_date']}
Reason: {leave_details['reason']}

Please log in to the Leave Management System to review this application.

Best regards,
Leave Management System
        """
        
        msg.html = f"""
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b3801 0%, #b88917 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">New Leave Application</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
            <p>Dear Admin,</p>
            <p>A new leave application has been submitted:</p>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Employee:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{employee_name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Department:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{leave_details['department']}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Leave Type:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{', '.join(leave_details['leave_types'])}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Duration:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{leave_details['from_date']} to {leave_details['to_date']}</td>
                </tr>
                <tr>
                    <td style="padding: 10px;"><strong>Reason:</strong></td>
                    <td style="padding: 10px;">{leave_details['reason']}</td>
                </tr>
            </table>
            <div style="margin-top: 20px; padding: 15px; background: #ffc700; border-radius: 5px;">
                <p style="margin: 0; text-align: center;">
                    <a href="{os.environ.get('APP_URL', 'http://localhost:3000')}" style="color: #3b3801; text-decoration: none; font-weight: bold;">
                        Click here to review this application
                    </a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
        """
        
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def send_status_update_email(employee_email, employee_name, status, leave_details, admin_comments=None):
    """Send email to employee when leave status is updated"""
    try:
        status_color = "#27ae60" if status == "approved" else "#e74c3c"
        status_text = "Approved" if status == "approved" else "Rejected"
        
        msg = Message(
            subject=f'Your Leave Application has been {status_text}',
            recipients=[employee_email]
        )
        
        msg.body = f"""
Dear {employee_name},

Your leave application has been {status_text}.

Leave Details:
- Type: {', '.join(leave_details['leave_types'])}
- Duration: {leave_details['from_date']} to {leave_details['to_date']}
- Status: {status_text}
{f'- Admin Comments: {admin_comments}' if admin_comments else ''}

Best regards,
Leave Management System
        """
        
        msg.html = f"""
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: {status_color}; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">Leave Application {status_text}</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
            <p>Dear {employee_name},</p>
            <p>Your leave application has been <strong>{status_text}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Leave Type:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{', '.join(leave_details['leave_types'])}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Duration:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{leave_details['from_date']} to {leave_details['to_date']}</td>
                </tr>
                <tr>
                    <td style="padding: 10px;"><strong>Status:</strong></td>
                    <td style="padding: 10px; color: {status_color}; font-weight: bold;">{status_text}</td>
                </tr>
            </table>
            {f'''
            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px; border: 1px solid #ffeeba;">
                <p style="margin: 0;"><strong>Admin Comments:</strong> {admin_comments}</p>
            </div>
            ''' if admin_comments else ''}
        </div>
    </div>
</body>
</html>
        """
        
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False