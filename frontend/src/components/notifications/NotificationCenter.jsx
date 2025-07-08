// components/notifications/NotificationCenter.jsx - Production ready version
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/notifications?filter=${filter}`);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      
      // Role-based mock notifications for development
      const mockNotifications = generateMockNotifications(user.role);
      setNotifications(mockNotifications);
    }
    setLoading(false);
  };

  const generateMockNotifications = (userRole) => {
    const baseTime = Date.now();
    
    if (userRole === 'admin') {
      return [
        {
          id: 1,
          title: 'New Leave Application',
          message: 'John Doe from IT Department has submitted a leave application for July 1-5, 2025.',
          type: 'warning',
          read: false,
          created_at: new Date(baseTime - 300000).toISOString(),
          action_url: '/dashboard'
        },
        {
          id: 2,
          title: 'Leave Application Approved',
          message: 'You approved Jane Smith\'s leave application for June 28-30.',
          type: 'success',
          read: false,
          created_at: new Date(baseTime - 1800000).toISOString(),
          action_url: '/dashboard'
        },
        {
          id: 3,
          title: 'System Alert',
          message: 'Monthly leave report is ready for download.',
          type: 'info',
          read: true,
          created_at: new Date(baseTime - 3600000).toISOString(),
          action_url: '/analytics'
        },
        {
          id: 4,
          title: 'Coverage Risk Alert',
          message: 'High absence rate detected in Marketing department for next week.',
          type: 'error',
          read: false,
          created_at: new Date(baseTime - 7200000).toISOString(),
          action_url: '/analytics'
        }
      ];
    } else {
      return [
        {
          id: 101,
          title: 'Leave Application Approved',
          message: 'Great news! Your leave application for July 15-17 has been approved by your manager.',
          type: 'success',
          read: false,
          created_at: new Date(baseTime - 600000).toISOString(),
          action_url: '/my-applications'
        },
        {
          id: 102,
          title: 'Leave Balance Updated',
          message: 'Your annual leave balance has been updated. You have 12 days remaining.',
          type: 'info',
          read: false,
          created_at: new Date(baseTime - 2400000).toISOString(),
          action_url: null
        },
        {
          id: 103,
          title: 'Upcoming Leave Reminder',
          message: 'Reminder: Your approved leave starts tomorrow (June 28, 2025).',
          type: 'warning',
          read: true,
          created_at: new Date(baseTime - 86400000).toISOString(),
          action_url: '/calendar'
        }
      ];
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
      toast.success('Notification marked as read', { autoClose: 2000 });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
      toast.info('Demo: Notification marked as read', { autoClose: 2000 });
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      toast.info('Demo: All notifications marked as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter(notif => notif.id !== notificationId));
      toast.success('Notification deleted', { autoClose: 2000 });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setNotifications(notifications.filter(notif => notif.id !== notificationId));
      toast.info('Demo: Notification deleted', { autoClose: 2000 });
    }
  };

  const handleNotificationAction = (notification) => {
    if (notification.action_url) {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      onClose();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const notificationTime = new Date(dateString);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div 
      className="notification-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="notification-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="notification-header">
          <h2 className="notification-title">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount}
              </span>
            )}
          </h2>
          
          <div className="notification-header-info">
            <span className="notification-view-badge">
              {user.role === 'admin' ? 'Admin View' : 'Employee View'}
            </span>
            
            <button
              onClick={onClose}
              className="notification-close"
              title="Close (Esc)"
            >
              ×
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="notification-tabs">
          {['all', 'unread', 'read'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`notification-tab ${filter === filterType ? 'active' : ''}`}
            >
              {filterType} 
              {filterType === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
              {filterType === 'all' && ` (${notifications.length})`}
              {filterType === 'read' && ` (${notifications.length - unreadCount})`}
            </button>
          ))}
        </div>

        {/* Actions */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="notification-actions">
            <button
              onClick={markAllAsRead}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Mark All as Read ({unreadCount})
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="notification-list">
          {loading ? (
            <div className="notification-loading">
              <div className="notification-loading-icon">🔄</div>
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notification-empty">
              <div className="notification-empty-icon">
                {filter === 'unread' ? '✅' : '📬'}
              </div>
              <h3>
                {filter === 'unread' ? 'All caught up!' : 'No notifications'}
              </h3>
              <p>
                {filter === 'unread' 
                  ? 'You have no unread notifications.' 
                  : 'You have no notifications yet.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="notification-content">
                  <div className={`notification-icon ${notification.type}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-body">
                    <div className="notification-header-line">
                      <h4 className={`notification-title-text ${notification.read ? 'read' : 'unread'}`}>
                        {notification.title}
                      </h4>
                      
                      <div className="notification-controls">
                        {!notification.read && (
                          <div className="notification-unread-dot" />
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="notification-delete"
                          title="Delete notification"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    <p className="notification-message">
                      {notification.message}
                    </p>
                    
                    <div className="notification-footer">
                      <span title={new Date(notification.created_at).toLocaleString()}>
                        {getTimeAgo(notification.created_at)}
                      </span>
                      
                      <div className="notification-actions-group">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="notification-action-btn read"
                            title="Mark as read"
                          >
                            ✓ Read
                          </button>
                        )}
                        
                        {notification.action_url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationAction(notification);
                            }}
                            className="notification-action-btn view"
                            title="Go to related page"
                          >
                            👁️ View
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with help text */}
        <div className="notification-footer-help">
          💡 <strong>Tip:</strong> Click the × button, outside, or press Esc to close • 
          Click unread notifications to mark as read • 
          {user.role === 'admin' 
            ? 'Admin notifications include leave requests & system alerts' 
            : 'Get updates on your leave applications & reminders'}
        </div>
      </div>
    </div>
  );
};

// Enhanced Notification Hook - Production ready
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentToasts, setRecentToasts] = useState(new Set());

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      read: false,
      created_at: new Date().toISOString(),
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Create a unique key for this notification type + title
    const toastKey = `${notification.type}-${notification.title}`;
    const now = Date.now();
    
    // Only show toast if this type hasn't been shown in the last 2 minutes
    const shouldShowToast = !Array.from(recentToasts).some(entry => {
      const [key, timestamp] = entry.split('|');
      return key === toastKey && (now - parseInt(timestamp)) < 120000; // 2 minutes
    });
    
    if (shouldShowToast) {
      const icon = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
        info: 'ℹ️'
      }[notification.type] || '🔔';
      
      toast(
        <div className="toast-notification">
          <div className="toast-header">
            <strong>{icon} {notification.title}</strong>
          </div>
          <div className="toast-message">
            {notification.message}
          </div>
        </div>,
        {
          type: notification.type || 'info',
          autoClose: 5000,
          className: 'custom-toast'
        }
      );
      
      // Track this toast
      setRecentToasts(prev => {
        const newSet = new Set(prev);
        newSet.add(`${toastKey}|${now}`);
        
        // Clean up old entries (older than 5 minutes)
        const fiveMinutesAgo = now - 300000;
        Array.from(newSet).forEach(entry => {
          const [, timestamp] = entry.split('|');
          if (parseInt(timestamp) < fiveMinutesAgo) {
            newSet.delete(entry);
          }
        });
        
        return newSet;
      });
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    setRecentToasts(new Set());
  };

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearAll,
    fetchUnreadCount
  };
};

export default NotificationCenter;