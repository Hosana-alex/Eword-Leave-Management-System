// components/admin/UserManagement.jsx - Dashboard Tiles Design
import React, { useState, useEffect } from 'react';
import { api, adminUserAPI } from '../../services/api';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/ConfirmationModal';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk Operations State
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning',
    confirmText: 'Confirm',
    loading: false
  });

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  // Update bulk actions visibility when selection changes
  useEffect(() => {
    setShowBulkActions(selectedUsers.size > 0);
  }, [selectedUsers]);

  // Helper function to show confirmation modal
  const showConfirmation = ({ title, message, onConfirm, type = 'warning', confirmText = 'Confirm' }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type,
      confirmText,
      loading: false
    });
  };

  const closeConfirmation = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirmAction = async () => {
    if (confirmModal.onConfirm) {
      setConfirmModal(prev => ({ ...prev, loading: true }));
      try {
        await confirmModal.onConfirm();
        closeConfirmation();
      } catch (error) {
        setConfirmModal(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (searchTerm) params.append('search', searchTerm);

      console.log('🔍 Fetching users with basic endpoint...');
      
      // Use original endpoint that works
      const response = await api.get(`/admin/users?${params.toString()}`);
      
      // Add mock activity data for the new columns
      const usersWithActivity = (response.data.users || []).map(user => ({
        ...user,
        // Mock activity data until backend is enhanced
        leave_usage: { 
          used: Math.floor(Math.random() * 5), // Random 0-4 days used 
          total: 21 // Standard leave allocation
        },
        pending_applications: Math.floor(Math.random() * 3) // Random 0-2 pending
      }));
      
      setUsers(usersWithActivity);
      console.log('✅ Users loaded with mock activity data');
      
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    }
    setLoading(false);
  };

  const handleUserAction = async (userId, action) => {
    try {
      const endpoint = action === 'approve' 
        ? `/admin/users/${userId}/approve` 
        : `/admin/users/${userId}/reject`;
      
      await api.put(endpoint);
      
      toast.success(`User ${action}d successfully!`);
      
      // Refresh the user list
      fetchUsers();
      
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  // Reset Password Action
  const handleResetPassword = async (userId, userName) => {
    showConfirmation({
      title: 'Reset Password',
      message: `Reset password for ${userName}? They will receive an email with a new temporary password.`,
      confirmText: 'Reset Password',
      type: 'info',
      onConfirm: async () => {
        await api.post(`/admin/users/${userId}/reset-password`);
        toast.success(`Password reset email sent to ${userName}!`);
      }
    });
  };

  // Deactivate/Reactivate Toggle
  const handleToggleUserStatus = async (userId, userName, isActive) => {
    const action = isActive ? 'deactivate' : 'reactivate';
    const actionTitle = isActive ? 'Deactivate User' : 'Reactivate User';
    const message = isActive 
      ? `Deactivate ${userName}? They will no longer be able to log in.`
      : `Reactivate ${userName}? They will be able to log in again.`;

    showConfirmation({
      title: actionTitle,
      message,
      confirmText: isActive ? 'Deactivate' : 'Reactivate',
      type: isActive ? 'danger' : 'success',
      onConfirm: async () => {
        await api.put(`/admin/users/${userId}/${action}`);
        toast.success(`User ${action}d successfully!`);
        fetchUsers();
      }
    });
  };

  // Bulk Operations
  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const handleBulkAction = async (action) => {
    const selectedUsersList = Array.from(selectedUsers);
    if (selectedUsersList.length === 0) return;

    const actionText = {
      approve: 'approve',
      reject: 'reject',
      deactivate: 'deactivate',
      reactivate: 'reactivate',
      export: 'export to CSV'
    }[action];

    const actionTitle = {
      approve: 'Bulk Approve Users',
      reject: 'Bulk Reject Users', 
      deactivate: 'Bulk Deactivate Users',
      reactivate: 'Bulk Reactivate Users',
      export: 'Export Users to CSV'
    }[action];

    const actionType = {
      approve: 'success',
      reject: 'danger',
      deactivate: 'danger',
      reactivate: 'success',
      export: 'info'
    }[action];

    showConfirmation({
      title: actionTitle,
      message: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${selectedUsersList.length} selected users?`,
      confirmText: actionText.charAt(0).toUpperCase() + actionText.slice(1),
      type: actionType,
      onConfirm: async () => {
        if (action === 'export') {
          const response = await api.post('/admin/users/export', {
            userIds: selectedUsersList
          });
          
          const blob = new Blob([response.data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          toast.success('Users exported successfully!');
        } else {
          await api.post(`/admin/users/bulk-${action}`, {
            userIds: selectedUsersList
          });
          
          toast.success(`${selectedUsersList.length} users ${actionText}d successfully!`);
          fetchUsers();
        }
        
        setSelectedUsers(new Set());
      }
    });
  };

  // Helper functions for activity snapshot
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return { text: 'Never', status: 'inactive' };
    
    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffMs = now - loginDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    let text, status;
    
    if (diffMinutes < 60) {
      text = `${diffMinutes}m ago`;
      status = 'active';
    } else if (diffHours < 24) {
      text = `${diffHours}h ago`;
      status = 'active';
    } else if (diffDays === 1) {
      text = 'Yesterday';
      status = 'moderate';
    } else if (diffDays < 7) {
      text = `${diffDays} days ago`;
      status = 'moderate';
    } else if (diffDays < 30) {
      text = `${diffDays} days ago`;
      status = 'inactive';
    } else {
      text = loginDate.toLocaleDateString();
      status = 'inactive';
    }

    return { text, status };
  };

  const getActivityStatus = (lastLogin, pendingApps) => {
    const loginStatus = formatLastLogin(lastLogin).status;
    
    // Active if logged in recently or has pending applications
    if (loginStatus === 'active' || pendingApps > 0) return 'active';
    if (loginStatus === 'moderate') return 'moderate';
    return 'inactive';
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-icon">⏳</div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Header */}
      <div className="user-management-header">
        <h2 className="user-management-title">User Management</h2>
        <p className="user-management-subtitle">
          Manage employee registrations and user accounts
        </p>
      </div>

      {/* Filters and Search */}
      <div className="user-filters">
        <div className="filter-buttons">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`filter-button ${filter === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="🔍 Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="user-search"
        />

        <button onClick={fetchUsers} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {/* Bulk Actions Toolbar */}
      {showBulkActions && (
        <div className="bulk-actions-toolbar">
          <div className="bulk-actions-info">
            <span className="bulk-count">{selectedUsers.size} users selected</span>
            <button 
              onClick={() => setSelectedUsers(new Set())}
              className="bulk-clear"
            >
              Clear Selection
            </button>
          </div>
          
          <div className="bulk-actions-buttons">
            {filter === 'pending' && (
              <>
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="bulk-action-btn approve"
                  disabled={bulkLoading}
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="bulk-action-btn reject"
                  disabled={bulkLoading}
                >
                  ❌ Reject
                </button>
              </>
            )}
            
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="bulk-action-btn deactivate"
              disabled={bulkLoading}
            >
              🚫 Deactivate
            </button>
            
            <button
              onClick={() => handleBulkAction('export')}
              className="bulk-action-btn export"
              disabled={bulkLoading}
            >
              📊 Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h3 className="dashboard-title">
          {filter === 'all' ? 'All Users' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Users`}
          <span className="user-count">({filteredUsers.length})</span>
        </h3>
        
        {/* Select All for Dashboard */}
        {filteredUsers.length > 0 && (
          <div className="select-all-dashboard">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                onChange={handleSelectAll}
              />
              <span className="checkmark"></span>
              Select All
            </label>
          </div>
        )}
      </div>

      {/* Dashboard Tiles */}
      {filteredUsers.length === 0 ? (
        <div className="users-empty-state">
          <div className="users-empty-icon">
            {filter === 'pending' ? '⏳' : '👥'}
          </div>
          <h3 className="users-empty-title">
            No {filter === 'all' ? '' : filter} users found
          </h3>
          <p className="users-empty-message">
            {filter === 'pending' 
              ? 'No pending user registrations at the moment.' 
              : `No ${filter} users match your search criteria.`}
          </p>
        </div>
      ) : (
        <div className="dashboard-tiles-container">
          {filteredUsers.map(user => {
            const lastLoginInfo = formatLastLogin(user.last_login);
            const activityStatus = getActivityStatus(user.last_login, user.pending_applications);
            const isSelected = selectedUsers.has(user.id);

            return (
              <div 
                key={user.id} 
                className={`user-tile ${user.status === 'deactivated' ? 'deactivated' : ''} ${isSelected ? 'selected' : ''}`}
              >
                {/* Background Pattern */}
                <div className="tile-background-pattern" />

                {/* Selection Checkbox */}
                <div className="tile-checkbox">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectUser(user.id)}
                    />
                    <span className="checkmark"></span>
                  </label>
                </div>

                {/* Tile Content */}
                <div className="tile-content">
                  {/* Header */}
                  <div className="tile-header">
                    <div className="user-info">
                      <div className="user-avatar">
                        {getInitials(user.name)}
                      </div>
                      <div className="user-details">
                        <h3 className="user-name">{user.name}</h3>
                        <p className="user-designation">{user.designation}</p>
                        <p className="user-department">{user.department}</p>
                      </div>
                    </div>
                    <div className="status-indicators">
                      <div className={`activity-indicator ${activityStatus}`} 
                           title={`Activity: ${activityStatus}`}>
                        <div className="activity-dot"></div>
                      </div>
                      <div className={`status-badge ${user.status}`}>
                        {user.status}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="tile-stats">
                    <div className="stat-item">
                      <div className={`stat-value ${lastLoginInfo.status}`}>
                        {lastLoginInfo.text}
                      </div>
                      <div className="stat-label">Last Login</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value leave-usage">
                        {user.leave_usage.used}/{user.leave_usage.total}
                      </div>
                      <div className="stat-label">Leave Days</div>
                      <div className="stat-progress">
                        <div 
                          className="stat-progress-fill"
                          style={{ 
                            width: `${Math.min((user.leave_usage.used / user.leave_usage.total) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className={`stat-value ${user.pending_applications > 0 ? 'pending-active' : 'pending-inactive'}`}>
                        {user.pending_applications}
                      </div>
                      <div className="stat-label">Pending</div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="tile-contact">
                    <div className="contact-email">{user.email}</div>
                    <div className="contact-date">
                      Registered: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="tile-actions">
                    {/* Pending users actions */}
                    {user.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUserAction(user.id, 'approve')}
                          className="tile-action-btn approve"
                          title="Approve user"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleUserAction(user.id, 'reject')}
                          className="tile-action-btn reject"
                          title="Reject user"
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    
                    {/* Approved users actions */}
                    {user.status === 'approved' && (
                      <>
                        <button
                          onClick={() => handleResetPassword(user.id, user.name)}
                          className="tile-action-btn reset-password"
                          title="Reset password"
                        >
                          🔑 Reset
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.name, true)}
                          className="tile-action-btn deactivate"
                          title="Deactivate user"
                        >
                          🚫 Deactivate
                        </button>
                      </>
                    )}
                    
                    {/* Deactivated users actions */}
                    {user.status === 'deactivated' && (
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.name, false)}
                        className="tile-action-btn reactivate"
                        title="Reactivate user"
                      >
                        ✅ Reactivate
                      </button>
                    )}
                    
                    {/* Rejected users */}
                    {user.status === 'rejected' && (
                      <div className="tile-action-message">
                        Account Rejected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default UserManagement;