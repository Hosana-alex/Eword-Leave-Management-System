import React, { useState } from 'react';
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
import './styles/globals.css';

const AppContent = () => {
  const { user, logout, loading } = useAuth();
  // Set initial tab based on user role
  const [currentTab, setCurrentTab] = useState(
    user?.role === 'admin' ? 'dashboard' : 'my-applications'
  );
  const [showProfile, setShowProfile] = useState(false);
  const [showAuth, setShowAuth] = useState('login');
  
  // Update current tab when user changes
  React.useEffect(() => {
    if (user) {
      setCurrentTab(user.role === 'admin' ? 'dashboard' : 'my-applications');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading Leave Management System...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        <Login />
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">EP</div>
            <div>
              <h1>EWORD PUBLISHERS</h1>
              <p style={{fontSize: '0.9rem', opacity: '0.8'}}>Leave Management System</p>
            </div>
          </div>
          
          <div className="nav-tabs">
            {user.role === 'admin' && (
              <>
                <button 
                  className={`nav-tab ${currentTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('dashboard')}
                >
                  📊 Dashboard
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
            
            <div className="user-info">
              <button 
                onClick={() => setShowProfile(true)}
                className="nav-tab"
                style={{ marginRight: '0.5rem' }}
              >
                👤 {user.name}
              </button>
              <button onClick={logout} className="nav-tab">
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {currentTab === 'dashboard' && user.role === 'admin' && <Dashboard />}
        {currentTab === 'my-applications' && user.role === 'employee' && <Dashboard />}
        {currentTab === 'analytics' && user.role === 'admin' && <DashboardAnalytics />}
        {currentTab === 'calendar' && <LeaveCalendar />}
        {currentTab === 'apply' && (
          <LeaveApplicationForm 
            onSubmit={() => {
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
      
      <ToastContainer position="top-right" autoClose={3000} />
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