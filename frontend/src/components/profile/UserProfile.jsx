// components/profile/UserProfile.jsx
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
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    designation: user?.designation || '',
    contacts: user?.contacts || '',
    emergency_contact: user?.emergency_contact || '',
    emergency_phone: user?.emergency_phone || ''
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

  return (
    <div className="profile-overlay">
      <div className="profile-modal">
        <div className="profile-header">
          <h2 className="profile-title">My Profile</h2>
          <button
            onClick={onClose}
            className="profile-close"
            aria-label="Close profile"
          >
            ×
          </button>
        </div>

        <div className="profile-content">
          {/* Profile Information Section */}
          <div className="profile-section">
            <div className="section-header">
              <h3 className="section-title">Personal Information</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary edit-btn"
                >
                  ✏️ Edit
                </button>
              )}
            </div>
            
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
              <div className="profile-details">
                <div className="detail-item">
                  <strong>Name:</strong> <span>{user?.name}</span>
                </div>
                <div className="detail-item">
                  <strong>Email:</strong> <span>{user?.email}</span>
                </div>
                <div className="detail-item">
                  <strong>Department:</strong> <span>{user?.department}</span>
                </div>
                <div className="detail-item">
                  <strong>Designation:</strong> <span>{user?.designation || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <strong>Contact:</strong> <span>{user?.contacts || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <strong>Emergency Contact:</strong> <span>{user?.emergency_contact || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <strong>Emergency Phone:</strong> <span>{user?.emergency_phone || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <strong>Role:</strong> 
                  <span className="status-badge status-approved">{user?.role}</span>
                </div>
                <div className="detail-item">
                  <strong>Status:</strong> 
                  <span className={`status-badge status-${user?.status}`}>{user?.status}</span>
                </div>
                <div className="detail-item">
                  <strong>Member Since:</strong> 
                  <span>{new Date(user?.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Leave Balance Section */}
          <div className="profile-section">
            <div className="section-header">
              <h3 className="section-title">
                Leave Balance ({new Date().getFullYear()})
              </h3>
              <button
                onClick={refreshBalance}
                className="btn btn-secondary refresh-btn"
                title="Refresh leave balance"
              >
                🔄 Refresh
              </button>
            </div>
              
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;