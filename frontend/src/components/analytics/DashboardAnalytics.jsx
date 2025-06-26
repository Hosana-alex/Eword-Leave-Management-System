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
import { api } from '../../services/api';

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

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setAnalyticsData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading analytics...</div>;
  }

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
      <h3 style={{ color: '#3b3801', marginBottom: '1.5rem' }}>
        Leave Analytics Dashboard
      </h3>
      
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
            {analyticsData.upcomingLeaves.length > 0 ? (
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
    </div>
  );
};

export default DashboardAnalytics;