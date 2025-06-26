// components/calendar/LeaveCalendar.jsx
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { api } from '../../services/api';
import { toast } from 'react-toastify';

const LeaveCalendar = () => {
  const [date, setDate] = useState(new Date());
  const [leaveData, setLeaveData] = useState([]);
  const [selectedDateLeaves, setSelectedDateLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      const response = await api.get('/leave-applications/calendar');
      setLeaveData(response.data);
    } catch (error) {
      console.error('Failed to fetch calendar data');
    }
  };

  const isDateWithLeave = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return leaveData.some(leave => {
      const fromDate = new Date(leave.from_date);
      const toDate = new Date(leave.to_date);
      const checkDate = new Date(dateStr);
      return checkDate >= fromDate && checkDate <= toDate && leave.status === 'approved';
    });
  };

  const getLeavesForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return leaveData.filter(leave => {
      const fromDate = new Date(leave.from_date);
      const toDate = new Date(leave.to_date);
      const checkDate = new Date(dateStr);
      return checkDate >= fromDate && checkDate <= toDate;
    });
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month' && isDateWithLeave(date)) {
      const leaves = getLeavesForDate(date);
      const approvedCount = leaves.filter(l => l.status === 'approved').length;
      
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '2px'
        }}>
          <span style={{
            backgroundColor: '#ffc700',
            color: '#3b3801',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}>
            {approvedCount}
          </span>
        </div>
      );
    }
    return null;
  };

  const handleDateClick = (value) => {
    const leaves = getLeavesForDate(value);
    if (leaves.length > 0) {
      setSelectedDateLeaves(leaves);
      setShowModal(true);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Leave Calendar</h3>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
        <Calendar
          onChange={setDate}
          value={date}
          tileContent={tileContent}
          onClickDay={handleDateClick}
          className="leave-calendar"
        />
      </div>
      
      <div style={{
        padding: '1rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        borderTop: '1px solid #ffc700'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '20px',
            height: '20px',
            backgroundColor: '#ffc700',
            borderRadius: '50%'
          }} />
          <span style={{ fontSize: '0.85rem' }}>Employees on leave</span>
        </div>
      </div>

      {/* Modal for showing leaves on selected date */}
      {showModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '2px solid #ffc700'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0, color: '#3b3801' }}>
                Leaves on {date.toLocaleDateString()}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            {selectedDateLeaves.map(leave => (
              <div key={leave.id} style={{
                padding: '1rem',
                marginBottom: '1rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #ffc700'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{leave.employee_name}</strong>
                  <span className={`status-badge status-${leave.status}`}>
                    {leave.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>Department:</strong> {leave.department}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>Type:</strong> {leave.leave_types.join(', ')}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>Duration:</strong> {leave.from_date} to {leave.to_date}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveCalendar;