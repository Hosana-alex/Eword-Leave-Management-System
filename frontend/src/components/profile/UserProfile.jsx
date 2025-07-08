// components/profile/UserProfile.jsx - Sidebar Navigation Design
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './UserProfile.css';

const UserProfile = ({ onClose }) => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [balanceError, setBalanceError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic'); // New: Tab state
  
  const [formData, setFormData] = useState({
    // Basic Information (existing)
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    designation: user?.designation || '',
    contacts: user?.contacts || '',
    
    // Emergency Contact (existing)
    emergency_contact: user?.emergency_contact || '',
    emergency_phone: user?.emergency_phone || '',
    emergency_relationship: user?.emergency_relationship || '',
    
    // NEW: Personal Information
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    
    // NEW: Address Information
    address: user?.address || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
    
    // NEW: Employment Details (simplified)
    employment_type: user?.employment_type || 'full-time'
  });

  useEffect(() => {
    fetchLeaveBalance();
  }, []);

  const fetchLeaveBalance = async () => {
    try {
      const response = await userAPI.getLeaveBalance();
      setLeaveBalance(response.data);
      setBalanceError(null);
    } catch (error) {
      setBalanceError(error.response?.data?.error || 'Failed to load leave balance');
    }
  };

  const refreshBalance = () => {
    fetchLeaveBalance();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await userAPI.updateProfile(formData);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
    
    setLoading(false);
  };

  const LeaveBalanceCard = ({ type, data }) => (
    <div className="balance-card">
      <div className="balance-header">
        <strong className="balance-type">
          {type.replace('_', ' ')}
        </strong>
        <div className="balance-info">
          <span className="balance-usage">
            Used: {data.used}/{data.total}
          </span>
          <div className={`balance-remaining ${data.remaining > 0 ? 'positive' : 'negative'}`}>
            {data.remaining} days left
          </div>
        </div>
      </div>
      <div className="balance-progress">
        <div 
          className={`balance-progress-bar ${data.remaining > 0 ? 'normal' : 'exceeded'}`}
          style={{ width: `${Math.min((data.used / data.total) * 100, 100)}%` }}
        />
      </div>
    </div>
  );

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const capitalize = (str) => {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : 'Not specified';
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  // Navigation items
  const navItems = [
    { id: 'basic', label: 'Basic Information', icon: '👤' },
    { id: 'personal', label: 'Personal Details', icon: '📋' },
    { id: 'employment', label: 'Employment', icon: '🏢' },
    { id: 'balance', label: 'Leave Balance', icon: '📊' }
  ];

  return (
    <div className="profile-overlay">
      <div className="profile-modal sidebar-modal">
        {/* Close button */}
        <button
          onClick={onClose}
          className="profile-close-sidebar"
          aria-label="Close profile"
        >
          ×
        </button>

        <div className="profile-sidebar-layout">
          {/* Sidebar Navigation */}
          <div className="profile-sidebar">
            {/* User Info Section */}
            <div className="sidebar-user-info">
              <div className="sidebar-avatar">
                {getInitials(user?.name)}
              </div>
              <h3 className="sidebar-user-name">{user?.name}</h3>
              <p className="sidebar-user-role">{user?.designation} • {user?.department}</p>
              <div className="sidebar-user-status">
                <span className={`status-badge status-${user?.status}`}>
                  {user?.status}
                </span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
              <p className="sidebar-footer-text">
                EWORD Publishers<br />
                Leave Management System
              </p>
            </div>
          </div>

          {/* Content Area */}
          <div className="profile-content-area">
            {/* Header */}
            <div className="content-header">
              <h2 className="content-title">
                {navItems.find(item => item.id === activeTab)?.label || 'Profile'}
              </h2>
              {(activeTab === 'basic' || activeTab === 'personal') && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary edit-btn"
                >
                  ✏️ Edit
                </button>
              )}
              {activeTab === 'balance' && (
                <button
                  onClick={refreshBalance}
                  className="btn btn-secondary refresh-btn"
                  title="Refresh leave balance"
                >
                  🔄 Refresh
                </button>
              )}
            </div>

            {/* Content Body */}
            <div className="content-body">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <>
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="profile-form">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Full Name</label>
                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            name="email"
                            className="form-control disabled"
                            value={formData.email}
                            disabled
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Department</label>
                          <input
                            type="text"
                            name="department"
                            className="form-control"
                            value={formData.department}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Designation</label>
                          <input
                            type="text"
                            name="designation"
                            className="form-control"
                            value={formData.designation}
                            onChange={handleChange}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Contact Number</label>
                          <input
                            type="text"
                            name="contacts"
                            className="form-control"
                            value={formData.contacts}
                            onChange={handleChange}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Emergency Contact Name</label>
                          <input
                            type="text"
                            name="emergency_contact"
                            className="form-control"
                            value={formData.emergency_contact}
                            onChange={handleChange}
                            placeholder="Emergency contact person"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Emergency Contact Phone</label>
                          <input
                            type="text"
                            name="emergency_phone"
                            className="form-control"
                            value={formData.emergency_phone}
                            onChange={handleChange}
                            placeholder="Emergency contact number"
                          />
                        </div>

                        <div className="form-group">
                          <label>Relationship to Emergency Contact</label>
                          <select
                            name="emergency_relationship"
                            className="form-control"
                            value={formData.emergency_relationship}
                            onChange={handleChange}
                          >
                            <option value="">Select relationship</option>
                            <option value="spouse">Spouse</option>
                            <option value="parent">Parent</option>
                            <option value="sibling">Sibling</option>
                            <option value="child">Child</option>
                            <option value="friend">Friend</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="form-actions">
                        <button 
                          type="submit" 
                          className="btn btn-primary" 
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="content-grid">
                      <div className="content-card">
                        <h4 className="card-title">Contact Information</h4>
                        <div className="detail-item">
                          <strong>Name:</strong> <span>{user?.name}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Email:</strong> <span>{user?.email}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Contact:</strong> <span>{user?.contacts || 'Not specified'}</span>
                        </div>
                      </div>

                      <div className="content-card">
                        <h4 className="card-title">Emergency Contact</h4>
                        <div className="detail-item">
                          <strong>Contact:</strong> <span>{user?.emergency_contact || 'Not specified'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Phone:</strong> <span>{user?.emergency_phone || 'Not specified'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Relationship:</strong> <span>{capitalize(user?.emergency_relationship)}</span>
                        </div>
                      </div>

                      <div className="content-card">
                        <h4 className="card-title">Work Information</h4>
                        <div className="detail-item">
                          <strong>Department:</strong> <span>{user?.department}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Designation:</strong> <span>{user?.designation || 'Not specified'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Role:</strong> 
                          <span className="status-badge status-approved">{user?.role}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Personal Details Tab */}
              {activeTab === 'personal' && (
                <>
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="profile-form">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Date of Birth</label>
                          <input
                            type="date"
                            name="date_of_birth"
                            className="form-control"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="form-group">
                          <label>Gender</label>
                          <select
                            name="gender"
                            className="form-control"
                            value={formData.gender}
                            onChange={handleChange}
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Employment Type</label>
                          <select
                            name="employment_type"
                            className="form-control"
                            value={formData.employment_type}
                            onChange={handleChange}
                          >
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="intern">Intern</option>
                          </select>
                        </div>

                        <div className="form-group full-width">
                          <label>Address</label>
                          <textarea
                            name="address"
                            className="form-control"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Street address"
                            rows="3"
                          />
                        </div>

                        <div className="form-group">
                          <label>City</label>
                          <input
                            type="text"
                            name="city"
                            className="form-control"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City"
                          />
                        </div>

                        <div className="form-group">
                          <label>Postal Code</label>
                          <input
                            type="text"
                            name="postal_code"
                            className="form-control"
                            value={formData.postal_code}
                            onChange={handleChange}
                            placeholder="Postal/ZIP code"
                          />
                        </div>
                      </div>
                      
                      <div className="form-actions">
                        <button 
                          type="submit" 
                          className="btn btn-primary" 
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="content-grid">
                      <div className="content-card">
                        <h4 className="card-title">Personal Information</h4>
                        <div className="detail-item">
                          <strong>Date of Birth:</strong> <span>{formatDate(user?.date_of_birth)}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Gender:</strong> <span>{capitalize(user?.gender)}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Employment Type:</strong> <span>{capitalize(user?.employment_type)}</span>
                        </div>
                      </div>

                      <div className="content-card full-width">
                        <h4 className="card-title">Address Information</h4>
                        <div className="detail-item">
                          <strong>Address:</strong> <span>{user?.address || 'Not specified'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>City:</strong> <span>{user?.city || 'Not specified'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Postal Code:</strong> <span>{user?.postal_code || 'Not specified'}</span>
                        </div>
                      </div>

                      <div className="content-card">
                        <h4 className="card-title">System Information</h4>
                        <div className="detail-item">
                          <strong>Member Since:</strong> <span>{formatDate(user?.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Employment Tab */}
              {activeTab === 'employment' && (
                <div className="content-grid">
                  <div className="content-card">
                    <h4 className="card-title">Current Position</h4>
                    <div className="detail-item">
                      <strong>Department:</strong> <span>{user?.department}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Designation:</strong> <span>{user?.designation || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Employment Type:</strong> <span>{capitalize(user?.employment_type)}</span>
                    </div>
                  </div>

                  <div className="content-card">
                    <h4 className="card-title">Account Status</h4>
                    <div className="detail-item">
                      <strong>Status:</strong> 
                      <span className={`status-badge status-${user?.status}`}>{user?.status}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Role:</strong> 
                      <span className="status-badge status-approved">{user?.role}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Member Since:</strong> <span>{formatDate(user?.created_at)}</span>
                    </div>
                  </div>

                  <div className="content-card full-width">
                    <div className="employment-note">
                      <p>
                        <strong>Note:</strong> Employment details like hire date, salary grade, and manager assignment 
                        are typically managed by Admin. Contact your administrator to update these fields.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Leave Balance Tab */}
              {activeTab === 'balance' && (
                <>
                  {leaveBalance && leaveBalance.balance && leaveBalance.balance.balances ? (
                    <div className="balance-list">
                      {Object.entries(leaveBalance.balance.balances).map(([type, data]) => (
                        <LeaveBalanceCard key={type} type={type} data={data} />
                      ))}
                    </div>
                  ) : (
                    <div className="no-balance-message">
                      <p className="message-title">
                        <strong>No leave balance data available.</strong>
                      </p>
                      <p className="message-subtitle">This might be because:</p>
                      <ul className="message-list">
                        <li>Your account is still pending approval</li>
                        <li>Leave balances haven't been set up yet</li>
                        <li>You're a new employee</li>
                      </ul>
                      <p className="message-contact">
                        Contact your administrator if you think this is an error.
                      </p>
                    </div>
                  )}
                  
                  <div className="balance-note">
                    <p>
                      <strong>Note:</strong> Leave balances are reset at the beginning of each year. 
                      Unused leaves do not carry forward.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;