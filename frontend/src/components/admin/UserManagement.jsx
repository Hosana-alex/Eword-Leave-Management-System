// components/admin/UserManagement.jsx - Clean version with CSS classes
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
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
          {['pending', 'approved', 'rejected', 'all'].map(status => (
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

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {filter === 'all' ? 'All Users' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Users`}
            <span style={{ marginLeft: '0.5rem', color: '#6c757d' }}>
              ({filteredUsers.length})
            </span>
          </h3>
        </div>

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
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th className="center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-name-cell">{user.name}</div>
                      {user.designation && (
                        <div className="user-designation">{user.designation}</div>
                      )}
                    </td>
                    <td className="user-email">{user.email}</td>
                    <td>{user.department}</td>
                    <td>
                      <span className={`status-badge ${user.status}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="center">
                      {user.status === 'pending' ? (
                        <div className="user-actions">
                          <button
                            onClick={() => handleUserAction(user.id, 'approve')}
                            className="action-button approve"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'reject')}
                            className="action-button reject"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="no-actions">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;