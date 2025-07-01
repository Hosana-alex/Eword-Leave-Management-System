// components/auth/Login.jsx - SIMPLIFIED VERSION
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import Register from './Register';
import './Login.css';

const Login = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [loginType, setLoginType] = useState('employee'); // 'employee' or 'admin'
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(formData.email, formData.password);
    
    if (!result.success && result.status === 'pending') {
      setShowPendingMessage(true);
    }
    setLoading(false);
  };

  // Show Register component
  if (showRegister) {
    return <Register onSwitchToLogin={() => setShowRegister(false)} />;
  }

  // Show pending approval message
  if (showPendingMessage) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Account Pending Approval</h2>
            <p>EWORD PUBLISHERS</p>
          </div>
          
          <div className="pending-message">
            <div className="pending-icon">⏳</div>
            <h3>Account Pending Approval</h3>
            <p>
              Your account is still pending admin approval.
            </p>
            <p>
              Please wait for an administrator to approve your account before logging in.
              Contact your system administrator if you have any questions.
            </p>
          </div>
          
          <div className="pending-actions">
            <button 
              onClick={() => setShowPendingMessage(false)} 
              className="btn btn-primary"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>EWORD PUBLISHERS</p>
        </div>
        
        {/* Login Type Selection */}
        <div className="login-type-selector">
          <label className="login-type-label">
            Login As
          </label>
          <div className="login-type-buttons">
            <button
              type="button"
              onClick={() => setLoginType('employee')}
              className={`login-type-btn ${loginType === 'employee' ? 'active' : ''}`}
            >
              👤 Employee
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`login-type-btn ${loginType === 'admin' ? 'active' : ''}`}
            >
              🔧 Admin
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-control"
              placeholder={loginType === 'admin' ? 'admin@ewordpublishers.com' : 'your.name.ewordpublishers@gmail.com'}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-control"
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            type="submit" 
            className={`btn btn-primary ${loading ? 'btn-loading' : ''}`} 
            disabled={loading}
          >
            {loading ? 'Signing in...' : `Sign in as ${loginType === 'admin' ? 'Admin' : 'Employee'}`}
          </button>
        </form>
        
        <div className="auth-footer">
          {loginType === 'employee' && (
            <p>Don't have an account? 
              <button onClick={() => setShowRegister(true)} className="link-btn">
                Create account
              </button>
            </p>
          )}
          
          {loginType === 'admin' && (
            <div className="admin-notice">
              <strong>Admin Access Only</strong>
              Contact your system administrator for admin credentials.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;