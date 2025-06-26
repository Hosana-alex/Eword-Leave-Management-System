// components/profile/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { toast } from 'react-toastify';

const UserProfile = ({ onClose }) => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(null);
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
      const response = await api.get('/user/leave-balance');
      setLeaveBalance(response.data);
    } catch (error) {
      console.error('Failed to fetch leave balance');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.put('/user/profile', formData);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
    
    setLoading(false);
  };

  const LeaveBalanceCard = ({ type, data }) => (
    <div style={{
      padding: '1rem',
      background: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #ffc700',
      marginBottom: '0.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ color: '#3b3801', textTransform: 'capitalize' }}>
          {type.replace('_', ' ')}
        </strong>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: '#6c757d', fontSize: '0.85rem' }}>
            Used: {data.used}/{data.total}
          </span>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: data.remaining > 0 ? '#27ae60' : '#e74c3c'
          }}>
            {data.remaining} days left
          </div>
        </div>
      </div>
      <div style={{
        marginTop: '0.5rem',
        height: '8px',
        background: '#e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${(data.used / data.total) * 100}%`,
          background: data.remaining > 0 ? '#ffc700' : '#e74c3c',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '2px solid #ffc700'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #ffc700'
        }}>
          <h2 style={{ margin: 0, color: '#3b3801' }}>My Profile</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Profile Information */}
          <div>
            <h3 style={{ color: '#3b3801', marginBottom: '1rem' }}>
              Personal Information
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary"
                  style={{ marginLeft: '1rem', fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                >
                  ✏️ Edit
                </button>
              )}
            </h3>
            
            {isEditing ? (
              <form onSubmit={handleSubmit}>
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
                    className="form-control"
                    value={formData.email}
                    disabled
                    style={{ background: '#f5f5f5' }}
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
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
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
              <div>
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Department:</strong> {user?.department}</p>
                <p><strong>Designation:</strong> {user?.designation || 'Not specified'}</p>
                <p><strong>Contact:</strong> {user?.contacts || 'Not specified'}</p>
                <p><strong>Emergency Contact:</strong> {user?.emergency_contact || 'Not specified'}</p>
                <p><strong>Emergency Phone:</strong> {user?.emergency_phone || 'Not specified'}</p>
                <p><strong>Role:</strong> <span className="status-badge status-approved">{user?.role}</span></p>
                <p><strong>Member Since:</strong> {new Date(user?.created_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Leave Balance */}
          <div>
            <h3 style={{ color: '#3b3801', marginBottom: '1rem' }}>
              Leave Balance ({new Date().getFullYear()})
            </h3>
            
            {leaveBalance ? (
              <div>
                {Object.entries(leaveBalance.balances).map(([type, data]) => (
                  <LeaveBalanceCard key={type} type={type} data={data} />
                ))}
              </div>
            ) : (
              <p style={{ color: '#6c757d' }}>Loading leave balance...</p>
            )}
            
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#fff3cd',
              borderRadius: '8px',
              border: '1px solid #ffeeba'
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#856404' }}>
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