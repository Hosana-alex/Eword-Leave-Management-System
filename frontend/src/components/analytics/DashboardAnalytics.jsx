// components/analytics/DashboardAnalytics.jsx
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { analyticsAPI } from '../../services/api';
import { toast } from 'react-toastify';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsAPI.getAdvancedStats();
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics data');
      
      // Create mock data for development/testing
      const mockData = {
        departmentStats: [
          { department: 'IT', count: 12 },
          { department: 'HR', count: 8 },
          { department: 'Finance', count: 6 },
          { department: 'Marketing', count: 10 }
        ],
        monthlyTrends: [
          { month: 'Jan', approved: 15, rejected: 2 },
          { month: 'Feb', approved: 18, rejected: 1 },
          { month: 'Mar', approved: 22, rejected: 3 },
          { month: 'Apr', approved: 19, rejected: 2 },
          { month: 'May', approved: 25, rejected: 1 },
          { month: 'Jun', approved: 28, rejected: 4 }
        ],
        leaveTypeStats: [
          { type: 'Sick Leave', count: 25 },
          { type: 'Personal Leave', count: 35 },
          { type: 'Maternity/Paternity Leave', count: 8 },
          { type: 'Study Leave', count: 12 },
          { type: 'Other', count: 15 }
        ],
        upcomingLeaves: [
          {
            id: 1,
            employee_name: 'John Doe',
            department: 'IT',
            from_date: '2025-07-01',
            leave_types: ['Personal Leave']
          },
          {
            id: 2,
            employee_name: 'Jane Smith',
            department: 'HR',
            from_date: '2025-07-03',
            leave_types: ['Sick Leave']
          }
        ],
        averageLeaveDuration: 3.5,
        mostCommonLeaveType: 'Personal Leave',
        approvalRate: 85,
        activeLeaves: 5
      };
      
      setAnalyticsData(mockData);
      toast.info('Showing sample analytics data. Connect to backend for real data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Loading analytics...</div>
        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
          Fetching dashboard statistics and charts
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="error-container" style={{
        textAlign: 'center',
        padding: '3rem',
        background: '#f8d7da',
        borderRadius: '8px',
        border: '1px solid #f5c6cb',
        color: '#721c24'
      }}>
        <h3>Analytics Unavailable</h3>
        <p>{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Ensure we have data to render
  if (!analyticsData) {
    return null;
  }

  // Department-wise leave distribution
  const departmentChart = {
    labels: analyticsData.departmentStats.map(d => d.department),
    datasets: [{
      label: 'Leave Applications by Department',
      data: analyticsData.departmentStats.map(d => d.count),
      backgroundColor: [
        '#ffc700',
        '#b88917',
        '#3b3801',
        '#e8c547',
        '#d4a017',
        '#806517'
      ],
      borderColor: '#3b3801',
      borderWidth: 1
    }]
  };

  // Monthly leave trends
  const monthlyTrends = {
    labels: analyticsData.monthlyTrends.map(m => m.month),
    datasets: [{
      label: 'Approved Leaves',
      data: analyticsData.monthlyTrends.map(m => m.approved),
      borderColor: '#27ae60',
      backgroundColor: 'rgba(39, 174, 96, 0.1)',
      tension: 0.4
    }, {
      label: 'Rejected Leaves',
      data: analyticsData.monthlyTrends.map(m => m.rejected),
      borderColor: '#e74c3c',
      backgroundColor: 'rgba(231, 76, 60, 0.1)',
      tension: 0.4
    }]
  };

  // Leave type distribution
  const leaveTypeChart = {
    labels: analyticsData.leaveTypeStats.map(l => l.type),
    datasets: [{
      data: analyticsData.leaveTypeStats.map(l => l.count),
      backgroundColor: [
        '#ffc700',
        '#b88917',
        '#3b3801',
        '#e8c547',
        '#d4a017',
        '#806517',
        '#ab8a17'
      ],
      borderColor: '#fff',
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ color: '#3b3801', margin: 0 }}>
          Leave Analytics Dashboard
        </h3>
        {error && (
          <div style={{ 
            padding: '0.5rem 1rem',
            background: '#fff3cd',
            borderRadius: '4px',
            border: '1px solid #ffeeba',
            fontSize: '0.85rem',
            color: '#856404'
          }}>
            ⚠️ Using sample data
          </div>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Department Distribution */}
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Department-wise Distribution</h4>
          </div>
          <div style={{ height: '300px', padding: '1rem' }}>
            <Bar data={departmentChart} options={chartOptions} />
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Monthly Leave Trends</h4>
          </div>
          <div style={{ height: '300px', padding: '1rem' }}>
            <Line data={monthlyTrends} options={chartOptions} />
          </div>
        </div>

        {/* Leave Type Distribution */}
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Leave Type Distribution</h4>
          </div>
          <div style={{ height: '300px', padding: '1rem' }}>
            <Pie data={leaveTypeChart} options={chartOptions} />
          </div>
        </div>

        {/* Upcoming Leaves */}
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Upcoming Leaves (Next 7 Days)</h4>
          </div>
          <div style={{ padding: '1rem', maxHeight: '300px', overflow: 'auto' }}>
            {analyticsData.upcomingLeaves && analyticsData.upcomingLeaves.length > 0 ? (
              analyticsData.upcomingLeaves.map(leave => (
                <div key={leave.id} style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: '#fff3cd',
                  borderRadius: '6px',
                  border: '1px solid #ffeeba'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{leave.employee_name}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#856404' }}>
                      {new Date(leave.from_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#856404' }}>
                    {leave.department} - {leave.leave_types.join(', ')}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#6c757d' }}>
                No upcoming leaves in the next 7 days
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #ffc700 0%, #b88917 100%)',
        borderRadius: '12px',
        color: 'white'
      }}>
        <h4 style={{ marginBottom: '1rem' }}>Quick Statistics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Average Leave Duration</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              {analyticsData.averageLeaveDuration} days
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Most Common Leave Type</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              {analyticsData.mostCommonLeaveType}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Approval Rate</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              {analyticsData.approvalRate}%
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Active Employees on Leave</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              {analyticsData.activeLeaves}
            </p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button 
          onClick={fetchAnalytics}
          className="btn btn-secondary"
          style={{ padding: '0.75rem 2rem' }}
        >
          🔄 Refresh Analytics
        </button>
      </div>
    </div>
  );
};

export default DashboardAnalytics;