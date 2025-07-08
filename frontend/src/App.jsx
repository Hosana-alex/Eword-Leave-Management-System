import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-calendar/dist/Calendar.css';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import LeaveApplicationForm from './components/forms/LeaveApplicationForm';
import UserProfile from './components/profile/UserProfile';
import LeaveCalendar from './components/calendar/LeaveCalendar';
import DashboardAnalytics from './components/analytics/DashboardAnalytics';
import NotificationCenter, { useNotifications } from './components/notifications/NotificationCenter';
import UserManagement from './components/admin/UserManagement';
import './styles/globals.css';
import logoIcon from './assets/images/Logo.png';

const AppContent = () => {
  const { user, logout, loading } = useAuth();
  const { notifications, unreadCount, addNotification } = useNotifications();
  
  // NEW: Track if user needs password reset
  const [userNeedsPasswordReset, setUserNeedsPasswordReset] = useState(false);
  
  // Set initial tab based on user role
  const [currentTab, setCurrentTab] = useState(
    user?.role === 'admin' ? 'dashboard' : 'my-applications'
  );
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuth, setShowAuth] = useState('login');
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Update current tab when user changes
  useEffect(() => {
    if (user) {
      setCurrentTab(user.role === 'admin' ? 'dashboard' : 'my-applications');
    }
  }, [user]);

  // NEW: Check if user needs password reset
  useEffect(() => {
    if (user && user.password_reset_required) {
      setUserNeedsPasswordReset(true);
    } else {
      setUserNeedsPasswordReset(false);
    }
  }, [user]);

  // Close mobile menu when tab changes
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  if (loading) {
    return (
      <div className="loading-container">
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem',
            color: '#ffc700'
          }}>
            📋
          </div>
          <h2 style={{ color: '#3b3801' }}>Loading Leave Management System...</h2>
          <div style={{
            width: '200px',
            height: '4px',
            background: '#f0f0f0',
            borderRadius: '2px',
            margin: '1rem auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #ffc700, #b88917)',
              animation: 'loading 2s infinite ease-in-out'
            }} />
          </div>
        </div>
      </div>
    );
  }

  // UPDATED: Show login if no user OR if user needs password reset
  if (!user || userNeedsPasswordReset) {
    return (
      <div className="app">
        <Login onPasswordResetComplete={() => setUserNeedsPasswordReset(false)} />
        <ToastContainer 
          position="top-right" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <img src={logoIcon} alt="EP Logo" />
            </div>
            <div>
              <h1>EWORD PUBLISHERS</h1>
              <p>Leave Management System</p>
            </div>
          </div>
          
          {/* Desktop Navigation - Hidden on Mobile */}
          <div className="nav-tabs desktop-nav">
            {user.role === 'admin' && (
              <>
                <button 
                  className={`nav-tab ${currentTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('dashboard')}
                >
                  📊 Dashboard
                </button>
                <button 
                  className={`nav-tab ${currentTab === 'users' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('users')}
                >
                  👥 Users
                </button>
                <button 
                  className={`nav-tab ${currentTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('analytics')}
                >
                  📈 Analytics
                </button>
                <button 
                  className={`nav-tab ${currentTab === 'calendar' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('calendar')}
                >
                  📅 Calendar
                </button>
              </>
            )}
            
            {user.role === 'employee' && (
              <>
                <button 
                  className={`nav-tab ${currentTab === 'my-applications' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('my-applications')}
                >
                  📋 My Applications
                </button>
                <button 
                  className={`nav-tab ${currentTab === 'apply' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('apply')}
                >
                  ➕ Apply Leave
                </button>
                <button 
                  className={`nav-tab ${currentTab === 'calendar' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('calendar')}
                >
                  📅 Calendar
                </button>
              </>
            )}
          </div>
          
          {/* Mobile & Desktop User Info */}
          <div className="user-info">
            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotifications(true)}
              className={`notification-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
              title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'No new notifications'}
            >
              <span className="notification-bell-icon">🔔</span>
              {unreadCount > 0 && <div className="notification-bell-dot" />}
            </button>

            {/* Desktop User Menu */}
            <div className="desktop-user-menu">
              <button 
                onClick={() => setShowProfile(true)}
                className="nav-tab"
              >
                👤 {user.name}
              </button>
              
              <button onClick={logout} className="nav-tab">
                🚪 Logout
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button 
              className="mobile-hamburger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide Menu */}
      <div className={`mobile-slide-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="mobile-menu-title">
            <div className="logo-icon">EP</div>
            <span>Navigation</span>
          </div>
          <button 
            className="mobile-menu-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>
        
        <div className="mobile-menu-content">
          {/* Navigation Items */}
          {user.role === 'admin' && (
            <>
              <button 
                className={`mobile-menu-item ${currentTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleTabChange('dashboard')}
              >
                <span className="mobile-menu-icon">📊</span>
                Dashboard
              </button>
              <button 
                className={`mobile-menu-item ${currentTab === 'users' ? 'active' : ''}`}
                onClick={() => handleTabChange('users')}
              >
                <span className="mobile-menu-icon">👥</span>
                Users
              </button>
              <button 
                className={`mobile-menu-item ${currentTab === 'analytics' ? 'active' : ''}`}
                onClick={() => handleTabChange('analytics')}
              >
                <span className="mobile-menu-icon">📈</span>
                Analytics
              </button>
              <button 
                className={`mobile-menu-item ${currentTab === 'calendar' ? 'active' : ''}`}
                onClick={() => handleTabChange('calendar')}
              >
                <span className="mobile-menu-icon">📅</span>
                Calendar
              </button>
            </>
          )}
          
          {user.role === 'employee' && (
            <>
              <button 
                className={`mobile-menu-item ${currentTab === 'my-applications' ? 'active' : ''}`}
                onClick={() => handleTabChange('my-applications')}
              >
                <span className="mobile-menu-icon">📋</span>
                My Applications
              </button>
              <button 
                className={`mobile-menu-item ${currentTab === 'apply' ? 'active' : ''}`}
                onClick={() => handleTabChange('apply')}
              >
                <span className="mobile-menu-icon">➕</span>
                Apply Leave
              </button>
              <button 
                className={`mobile-menu-item ${currentTab === 'calendar' ? 'active' : ''}`}
                onClick={() => handleTabChange('calendar')}
              >
                <span className="mobile-menu-icon">📅</span>
                Calendar
              </button>
            </>
          )}
          
          {/* Divider */}
          <div className="mobile-menu-divider"></div>
          
          {/* User Actions */}
          <button 
            className="mobile-menu-item"
            onClick={() => {
              setShowProfile(true);
              setMobileMenuOpen(false);
            }}
          >
            <span className="mobile-menu-icon">👤</span>
            {user.name}
          </button>
          
          <button 
            className="mobile-menu-item logout"
            onClick={() => {
              logout();
              setMobileMenuOpen(false);
            }}
          >
            <span className="mobile-menu-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>

      <main className="main-content">
        {currentTab === 'dashboard' && user.role === 'admin' && (
          <Dashboard onNotification={addNotification} />
        )}
        {currentTab === 'users' && user.role === 'admin' && (
          <UserManagement />
        )}
        {currentTab === 'my-applications' && user.role === 'employee' && (
          <Dashboard onNotification={addNotification} />
        )}
        {currentTab === 'analytics' && user.role === 'admin' && (
          <DashboardAnalytics />
        )}
        {currentTab === 'calendar' && <LeaveCalendar />}
        {currentTab === 'apply' && (
          <LeaveApplicationForm 
            onSubmit={(success) => {
              if (success) {
                addNotification({
                  title: 'Leave Application Submitted',
                  message: 'Your leave application has been submitted successfully and is pending review.',
                  type: 'success'
                });
              }
              setCurrentTab(user.role === 'admin' ? 'dashboard' : 'my-applications');
            }}
            onCancel={() => {
              setCurrentTab(user.role === 'admin' ? 'dashboard' : 'my-applications');
            }}
          />
        )}
      </main>
      
      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      
      {/* Enhanced Toast Container */}
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ marginTop: '80px' }} // Account for header height
        toastStyle={{
          borderLeft: '4px solid #ffc700',
          fontFamily: 'inherit'
        }}
      />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;