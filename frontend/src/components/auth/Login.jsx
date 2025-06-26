import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const [loginType, setLoginType] = useState('employee'); // 'employee' or 'admin'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    department: '',
    designation: '',
    contacts: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData.email, formData.password);
    
    if (!result.success && result.status === 'pending') {
      setShowPendingMessage(true);
    }
    setLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await register(formData);
      
      if (result.success) {
        setIsRegistering(false);
        if (result.status === 'pending') {
          setShowPendingMessage(true);
        } else {
          toast.success('Registration successful! Please login.');
        }
        setFormData({ email: '', password: '', name: '', department: '', designation: '', contacts: '' });
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    }
    
    setLoading(false);
  };

  // Show pending approval message
  if (showPendingMessage) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Account Pending Approval</h2>
            <p>EWORD PUBLISHERS</p>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: '#fff3cd',
            borderRadius: '8px',
            margin: '1rem 0'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h3 style={{ color: '#856404', marginBottom: '1rem' }}>Registration Successful!</h3>
            <p style={{ color: '#856404', marginBottom: '1rem' }}>
              Your account has been created and is pending admin approval.
            </p>
            <p style={{ color: '#856404', fontSize: '0.9rem' }}>
              You will be able to login once an administrator approves your account.
              Please contact your system administrator if you have any questions.
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
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

  if (isRegistering) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Register for Leave Management System</h2>
            <p>EWORD PUBLISHERS</p>
          </div>
          
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-control"
                  placeholder="your.email@example.com"
                />
              </div>
              
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
                </select>
              </div>
              
              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Contacts</label>
                <input
                  type="text"
                  name="contacts"
                  value={formData.contacts}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Phone/Alternative Email"
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Already have an account? 
              <button onClick={() => setIsRegistering(false)} className="link-btn">
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Login to Leave Management System</h2>
          <p>EWORD PUBLISHERS</p>
        </div>
        
        {/* Login Type Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            fontWeight: '600', 
            color: '#3b3801', 
            marginBottom: '0.5rem', 
            display: 'block',
            fontSize: '0.9rem'
          }}>
            Login As
          </label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '0.5rem' 
          }}>
            <button
              type="button"
              onClick={() => setLoginType('employee')}
              className={`btn ${loginType === 'employee' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '0.75rem',
                fontSize: '0.9rem'
              }}
            >
              👤 Employee
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`btn ${loginType === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '0.75rem',
                fontSize: '0.9rem'
              }}
            >
              🔧 Admin
            </button>
          </div>
        </div>
        
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-control"
              placeholder={loginType === 'admin' ? 'Admin email address' : 'Employee email address'}
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
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : `Login as ${loginType === 'admin' ? 'Admin' : 'Employee'}`}
          </button>
        </form>
        
        <div className="auth-footer">
          {loginType === 'employee' && (
            <p>Don't have an account? 
              <button onClick={() => setIsRegistering(true)} className="link-btn">
                Register here
              </button>
            </p>
          )}
          
          {loginType === 'admin' && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#ffc700',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: '#3b3801',
              textAlign: 'center'
            }}>
              <strong>Admin Access Only</strong><br/>
              Contact your system administrator for admin credentials.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;