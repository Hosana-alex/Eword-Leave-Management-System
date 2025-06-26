import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  const fetchApplications = async () => {
    try {
      const response = await api.get('/leave-applications');
      setApplications(response.data);
      setFilteredApplications(response.data);
    } catch (error) {
      toast.error('Failed to fetch applications');
    }
  };

  const fetchStats = async () => {
    if (user?.role === 'admin') {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats');
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchApplications(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [user]);

  // Filter applications based on status
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(applications.filter(app => app.status === filter));
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/leave-applications/${id}/approve`, {});
      toast.success('Application approved!');
      await Promise.all([fetchApplications(), fetchStats()]);
    } catch (error) {
      toast.error('Failed to approve application');
      console.error('Approve error:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/leave-applications/${id}/reject`, {});
      toast.success('Application rejected');
      await Promise.all([fetchApplications(), fetchStats()]);
    } catch (error) {
      toast.error('Failed to reject application');
      console.error('Reject error:', error);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'employee') {
    return (
      <div className="form-container" style={{textAlign: 'center', padding: '3rem'}}>
        <h2 style={{color: '#7f8c8d'}}>Access Restricted</h2>
        <p style={{color: '#95a5a6'}}>Dashboard access is restricted.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {user.role === 'admin' && (
        <div className="stats-grid">
          <div 
            className={`stat-card clickable ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterClick('all')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon" style={{color: '#ffc700'}}>
              📋
            </div>
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Applications</div>
          </div>
          
          <div 
            className={`stat-card clickable ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => handleFilterClick('pending')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon" style={{color: '#b88917'}}>
              ⏳
            </div>
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          
          <div 
            className={`stat-card clickable ${activeFilter === 'approved' ? 'active' : ''}`}
            onClick={() => handleFilterClick('approved')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon" style={{color: '#3b3801'}}>
              ✅
            </div>
            <div className="stat-number">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          
          <div 
            className={`stat-card clickable ${activeFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => handleFilterClick('rejected')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon" style={{color: '#b88917'}}>
              ❌
            </div>
            <div className="stat-number">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      )}

      <div className="dashboard">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {user.role === 'admin' 
                ? `${activeFilter === 'all' ? 'All' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Leave Applications`
                : 'My Leave Applications'}
            </h3>
            {user.role === 'admin' && activeFilter !== 'all' && (
              <button 
                className="btn btn-secondary"
                onClick={() => handleFilterClick('all')}
                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                Show All
              </button>
            )}
          </div>
          
          {filteredApplications.length === 0 ? (
            <p style={{textAlign: 'center', color: '#7f8c8d', padding: '2rem'}}>
              {activeFilter !== 'all' 
                ? `No ${activeFilter} applications found`
                : user.role === 'admin' 
                  ? 'No leave applications found' 
                  : 'You have no leave applications yet'}
            </p>
          ) : (
            filteredApplications.map(app => (
              <div key={app.id} className="leave-item">
                <div className="leave-item-header">
                  <strong>
                    {user.role === 'admin' ? app.employee_name : `Application #${app.id}`}
                  </strong>
                  <span className={`status-badge status-${app.status}`}>
                    {app.status.toUpperCase()}
                  </span>
                </div>
                <div className="leave-item-content">
                  <div style={{marginBottom: '0.5rem'}}><strong>Department:</strong> {app.department}</div>
                  {app.designation && (
                    <div style={{marginBottom: '0.5rem'}}><strong>Designation:</strong> {app.designation}</div>
                  )}
                  {app.contacts && (
                    <div style={{marginBottom: '0.5rem'}}><strong>Contacts:</strong> {app.contacts}</div>
                  )}
                  <div style={{marginBottom: '0.5rem'}}><strong>Leave Type:</strong> {app.leave_types.join(', ')}</div>
                  <div style={{marginBottom: '0.5rem'}}><strong>Duration:</strong> {app.from_date} to {app.to_date}</div>
                  <div style={{marginBottom: '0.5rem', padding: '0.5rem', background: '#ffc700', borderRadius: '4px', border: '2px solid #b88917'}}>
                    <strong>Reason for Leave:</strong><br/>
                    <span style={{fontStyle: 'italic', color: '#3b3801'}}>{app.reason}</span>
                  </div>
                  {app.employee_signature && (
                    <div style={{marginBottom: '0.5rem'}}><strong>Employee Signature:</strong> {app.employee_signature}</div>
                  )}
                  {app.important_comments && (
                    <div style={{marginBottom: '0.5rem', padding: '0.5rem', background: '#ffc700', borderRadius: '4px', border: '2px solid #b88917'}}>
                      <strong style={{color: '#3b3801'}}>Important Comments:</strong><br/>
                      <span style={{fontStyle: 'italic', color: '#3b3801'}}>{app.important_comments}</span>
                    </div>
                  )}
                  {app.status !== 'pending' && app.approved_date && (
                    <div style={{marginBottom: '0.5rem', fontSize: '0.8rem', color: '#6c757d'}}>
                      <strong>{app.status === 'approved' ? 'Approved' : 'Rejected'} on:</strong> {new Date(app.approved_date).toLocaleDateString()}
                    </div>
                  )}
                  {app.admin_comments && (
                    <div style={{marginBottom: '0.5rem', padding: '0.5rem', background: '#e8f5e8', borderRadius: '4px', border: '2px solid #3b3801'}}>
                      <strong>Admin Comments:</strong><br/>
                      <span style={{fontStyle: 'italic', color: '#3b3801'}}>{app.admin_comments}</span>
                    </div>
                  )}
                  <div style={{fontSize: '0.8rem', color: '#6c757d', marginTop: '0.5rem'}}>
                    <strong>Submitted:</strong> {app.submitted_date}
                  </div>
                </div>
                
                {user.role === 'admin' && app.status === 'pending' && (
                  <div className="approval-actions">
                    <button 
                      className="btn btn-success"
                      onClick={() => handleApprove(app.id)}
                    >
                      ✅ Approve
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleReject(app.id)}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;