import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import AdminCommentsModal from '../modal/AdminCommentsModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [modalAction, setModalAction] = useState('');
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [departmentFilter, setDepartmentFilter] = useState('');

  const fetchApplications = async () => {
    try {
      let endpoint = '/leave-applications';
      
      // Use admin endpoint if user is admin for enhanced data
      if (user?.role === 'admin') {
        endpoint = '/admin/applications';
      }
      
      const response = await api.get(endpoint);
      setApplications(response.data.applications || response.data);
      applyFilters(response.data.applications || response.data);
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

  // Apply all filters
  const applyFilters = (apps = applications) => {
    let filtered = [...apps];

    // Status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(app => app.status === activeFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter.start) {
      filtered = filtered.filter(app => app.from_date >= dateFilter.start);
    }
    if (dateFilter.end) {
      filtered = filtered.filter(app => app.to_date <= dateFilter.end);
    }

    // Department filter
    if (departmentFilter) {
      filtered = filtered.filter(app => 
        app.department?.toLowerCase().includes(departmentFilter.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [activeFilter, searchTerm, dateFilter, departmentFilter, applications]);

  // Handle stat card clicks for filtering
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  // Handle approve/reject button clicks
  const handleApproveClick = (application) => {
    setSelectedApplication(application);
    setModalAction('approved');
    setIsModalOpen(true);
  };

  const handleRejectClick = (application) => {
    setSelectedApplication(application);
    setModalAction('rejected');
    setIsModalOpen(true);
  };

  // Handle modal submission
  const handleModalSubmit = async (applicationId, action, comments) => {
    try {
      const endpoint = `/admin/applications/${applicationId}/status`;
      const payload = {
        status: action,
        admin_comments: comments
      };

      await api.put(endpoint, payload);
      
      toast.success(`Application ${action} successfully!`);
      
      // Refresh data
      await Promise.all([fetchApplications(), fetchStats()]);
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || `Failed to ${action} application`;
      toast.error(errorMessage);
      throw error; // Re-throw to be handled by modal
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilter('all');
    setSearchTerm('');
    setDateFilter({ start: '', end: '' });
    setDepartmentFilter('');
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
      {/* Stats Cards - Admin Only */}
      {user.role === 'admin' && (
        <div className="stats-grid">
          <div 
            className={`stat-card clickable ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterClick('all')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon" style={{color: '#ffc700'}}>📋</div>
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Applications</div>
          </div>
          
          <div 
            className={`stat-card clickable ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => handleFilterClick('pending')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon" style={{color: '#b88917'}}>⏳</div>
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          
          <div 
            className={`stat-card clickable ${activeFilter === 'approved' ? 'active' : ''}`}
            onClick={() => handleFilterClick('approved')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon" style={{color: '#27ae60'}}>✅</div>
            <div className="stat-number">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          
          <div 
            className={`stat-card clickable ${activeFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => handleFilterClick('rejected')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon" style={{color: '#e74c3c'}}>❌</div>
            <div className="stat-number">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      )}

      {/* Advanced Filters - Admin Only */}
      {user.role === 'admin' && (
        <div className="filters-section" style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '2px solid #ffc700'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="🔍 Search by name, department, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            
            <div>
              <input
                type="date"
                placeholder="From Date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            <div>
              <input
                type="date"
                placeholder="To Date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            <div>
              <input
                type="text"
                placeholder="Department"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  width: '150px'
                }}
              />
            </div>
            
            <button 
              onClick={clearFilters}
              style={{
                padding: '10px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              Clear Filters
            </button>
          </div>
          
          <div style={{ 
            marginTop: '12px', 
            fontSize: '0.85rem', 
            color: '#6c757d',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Showing {filteredApplications.length} of {applications.length} applications</span>
            {activeFilter !== 'all' && (
              <span style={{ color: '#ffc700', fontWeight: '500' }}>
                Filtered by: {activeFilter.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="dashboard">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {user.role === 'admin' 
                ? `${activeFilter === 'all' ? 'All' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Leave Applications`
                : 'My Leave Applications'}
            </h3>
          </div>
          
          {filteredApplications.length === 0 ? (
            <p style={{textAlign: 'center', color: '#7f8c8d', padding: '2rem'}}>
              {activeFilter !== 'all' || searchTerm || dateFilter.start || dateFilter.end || departmentFilter
                ? 'No applications match your filters'
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
                  <div style={{marginBottom: '0.5rem'}}><strong>Leave Type:</strong> {app.leave_types?.join(', ')}</div>
                  <div style={{marginBottom: '0.5rem'}}><strong>Duration:</strong> {app.from_date} to {app.to_date}</div>
                  {app.days_count && (
                    <div style={{marginBottom: '0.5rem'}}><strong>Total Days:</strong> {app.days_count} days</div>
                  )}
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
                    <div style={{marginBottom: '0.5rem', padding: '0.5rem', background: '#e8f5e8', borderRadius: '4px', border: '2px solid #27ae60'}}>
                      <strong>Admin Comments:</strong><br/>
                      <span style={{fontStyle: 'italic', color: '#27ae60'}}>{app.admin_comments}</span>
                    </div>
                  )}
                  <div style={{fontSize: '0.8rem', color: '#6c757d', marginTop: '0.5rem'}}>
                    <strong>Submitted:</strong> {app.submitted_date || (app.created_at && new Date(app.created_at).toLocaleDateString())}
                  </div>
                </div>
                
                {user.role === 'admin' && app.status === 'pending' && (
                  <div className="approval-actions">
                    <button 
                      className="btn btn-success"
                      onClick={() => handleApproveClick(app)}
                    >
                      ✅ Approve
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleRejectClick(app)}
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

      {/* Admin Comments Modal */}
      <AdminCommentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        application={selectedApplication}
        action={modalAction}
      />
    </div>
  );
};

export default Dashboard;