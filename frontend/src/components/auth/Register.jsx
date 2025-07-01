// components/auth/Register.jsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import './Register.css'; // We'll create this

const Register = ({ onSwitchToLogin }) => {
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [autoApproved, setAutoApproved] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    designation: '',
    contacts: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await register(formData);
      
      if (result.success) {
        setAutoApproved(result.auto_approved || false);
        setShowPendingMessage(true);
        // Clear form
        setFormData({
          name: '', email: '', password: '', department: '', 
          designation: '', contacts: ''
        });
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
      console.error('Registration error:', error);
    }
    
    setLoading(false);
  };

  // Success message after registration
  if (showPendingMessage) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{autoApproved ? 'Registration Successful!' : 'Account Pending Approval'}</h2>
            <p>EWORD PUBLISHERS</p>
          </div>
          
          <div className={`success-message ${autoApproved ? 'auto-approved' : 'pending-approval'}`}>
            <div className="success-icon">
              {autoApproved ? '🎉' : '⏳'}
            </div>
            
            <h3>{autoApproved ? 'Welcome to EWORD Publishers!' : 'Registration Submitted'}</h3>
            
            {autoApproved ? (
              <div>
                <p>Your account has been automatically approved since you're using a company email address.</p>
                <p><strong>You can now log in and start using the leave management system!</strong></p>
              </div>
            ) : (
              <div>
                <p>Your account has been created and is pending admin approval.</p>
                <p>You will be able to login once an administrator approves your account.</p>
                <p style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  Please contact your system administrator if you have any questions.
                </p>
              </div>
            )}
          </div>
          
          <div className="success-actions">
            <button 
              onClick={() => {
                setShowPendingMessage(false);
                onSwitchToLogin();
              }} 
              className="btn btn-primary"
            >
              {autoApproved ? 'Go to Login' : 'Back to Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h2>Join EWORD Publishers</h2>
          <p>Register for Leave Management System</p>
        </div>
        
        <div className="email-hint">
          <p>💡 <strong>Company employees:</strong> Use your @ewordpublishers email for instant approval!</p>
        </div>
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-grid">
            {/* Row 1: Name and Email */}
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="your.name.ewordpublishers@gmail.com"
              />
            </div>
            
            {/* Row 2: Password and Department */}
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-control"
                minLength="6"
                placeholder="Minimum 6 characters"
              />
            </div>
            
            <div className="form-group">
              <label>Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="form-control"
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Editing">Editing</option>
                <option value="Production">Production</option>
                <option value="Design">Design</option>
              </select>
            </div>
            
            {/* Row 3: Designation and Contacts */}
            <div className="form-group">
              <label>Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="form-control"
                placeholder="e.g., Editor, Manager, Developer"
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="contacts"
                value={formData.contacts}
                onChange={handleChange}
                className="form-control"
                placeholder="Your phone number"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-register" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? 
            <button onClick={onSwitchToLogin} className="link-btn">
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;