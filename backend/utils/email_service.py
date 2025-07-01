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
EWORD PUBLISHERS - Making Printing Easy
        """
        
        msg.html = f"""
<html>
<body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b3801 0%, #b88917 50%, #ffc700 100%); color: white; padding: 30px 25px; text-align: center;">
            <div style="background: #ffc700; color: #3b3801; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px; margin-bottom: 15px;">
                EP
            </div>
            <h1 style="margin: 0 0 5px 0; font-size: 24px; font-weight: 600;">EWORD PUBLISHERS</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">Making Printing Easy</p>
            <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <h2 style="margin: 0; font-size: 18px;">📋 New Leave Application</h2>
            </div>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px 25px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Dear Admin,</p>
            <p style="margin: 0 0 25px 0; color: #666; line-height: 1.5;">A new leave application has been submitted and requires your review:</p>
            
            <!-- Application Details Card -->
            <div style="background: #fafafa; border: 2px solid #ffc700; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #3b3801; width: 30%;">Employee:</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #333;">{employee_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #3b3801;">Department:</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #333;">{leave_details['department']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #3b3801;">Leave Type:</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #333;">{', '.join(leave_details['leave_types'])}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #3b3801;">Duration:</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #333;">{leave_details['from_date']} to {leave_details['to_date']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; font-weight: 600; color: #3b3801; vertical-align: top;">Reason:</td>
                        <td style="padding: 12px 0; color: #333; line-height: 1.4;">{leave_details['reason']}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{os.environ.get('APP_URL', 'http://localhost:3000')}" 
                   style="background: linear-gradient(135deg, #b88917 0%, #ffc700 100%); 
                          color: #3b3801; 
                          text-decoration: none; 
                          font-weight: 600; 
                          padding: 15px 30px; 
                          border-radius: 8px; 
                          display: inline-block;
                          box-shadow: 0 4px 12px rgba(255,199,0,0.3);
                          transition: all 0.3s ease;">
                    📊 Review Application
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #3b3801; color: white; padding: 20px 25px; text-align: center;">
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                EWORD PUBLISHERS - Making Printing Easy
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">
                Leave Management System
            </p>
        </div>
    </div>
</body>
</html>
        """
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Failed to send admin email: {str(e)}")
        return False

def send_status_update_email(employee_email, employee_name, status, leave_details, admin_comments=None):
    """Send email to employee when leave status is updated"""
    try:
        status_color = "#27ae60" if status == "approved" else "#e74c3c"
        status_text = "Approved" if status == "approved" else "Rejected"
        status_icon = "✅" if status == "approved" else "❌"
        
        msg = Message(
            subject=f'Leave Application {status_text} - EWORD PUBLISHERS',
            recipients=[employee_email]
        )
        
        msg.sender = current_app.config.get('MAIL_DEFAULT_SENDER')
        
        msg.body = f"""
Dear {employee_name},

Your leave application has been {status_text}.

Leave Details:
- Type: {', '.join(leave_details['leave_types']) if leave_details.get('leave_types') else 'N/A'}
- Duration: {leave_details.get('from_date', 'N/A')} to {leave_details.get('to_date', 'N/A')}
- Status: {status_text}
{f'- Admin Comments: {admin_comments}' if admin_comments else ''}

Best regards,
EWORD PUBLISHERS - Making Printing Easy
        """
        
        msg.html = f"""
<html>
<body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b3801 0%, #b88917 50%, #ffc700 100%); color: white; padding: 30px 25px; text-align: center;">
            <div style="background: #ffc700; color: #3b3801; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px; margin-bottom: 15px;">
                EP
            </div>
            <h1 style="margin: 0 0 5px 0; font-size: 24px; font-weight: 600;">EWORD PUBLISHERS</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">Making Printing Easy</p>
        </div>
        
        <!-- Status Banner -->
        <div style="background: {status_color}; color: white; padding: 20px 25px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 600;">
                {status_icon} Leave Application {status_text}
            </h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px 25px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Dear {employee_name},</p>
            <p style="margin: 0 0 25px 0; color: #666; line-height: 1.5;">
                Your leave application has been <strong style="color: {status_color};">{status_text}</strong>.
            </p>
            
            <!-- Application Details Card -->
            <div style="background: #fafafa; border: 2px solid #ffc700; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #3b3801; font-size: 16px;">Application Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #3b3801; width: 30%;">Leave Type:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #333;">{', '.join(leave_details['leave_types']) if leave_details.get('leave_types') else 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #3b3801;">Duration:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #333;">{leave_details.get('from_date', 'N/A')} to {leave_details.get('to_date', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; font-weight: 600; color: #3b3801;">Status:</td>
                        <td style="padding: 10px 0; color: {status_color}; font-weight: 600; font-size: 16px;">{status_icon} {status_text}</td>
                    </tr>
                </table>
            </div>
            
            {f'''
            <!-- Admin Comments -->
            <div style="background: #fff9e6; border: 2px solid #ffc700; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; color: #3b3801; font-size: 16px;">💬 Admin Comments</h3>
                <p style="margin: 0; color: #333; line-height: 1.5; font-style: italic;">"{admin_comments}"</p>
            </div>
            ''' if admin_comments else ''}
        </div>
        
        <!-- Footer -->
        <div style="background: #3b3801; color: white; padding: 25px; text-align: center;">
            <div style="background: rgba(255,199,0,0.1); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #ffc700;">
                    EWORD PUBLISHERS - Making Printing Easy
                </p>
            </div>
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                Leave Management System | Thank you for being part of our team
            </p>
        </div>
    </div>
</body>
</html>
        """
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Failed to send status email: {str(e)}")
        return False