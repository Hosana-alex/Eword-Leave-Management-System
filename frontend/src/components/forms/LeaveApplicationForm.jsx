import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { toast } from 'react-toastify';

const LeaveApplicationForm = ({ onSubmit, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    employee_name: '',
    department: '',
    designation: '',
    contacts: '',
    leave_types: [],
    from_date: '',
    to_date: '',
    reason: '',
    employee_signature: '',
    important_comments: ''
  });
  const [loading, setLoading] = useState(false);

  // Update form data when user changes or loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        employee_name: user.name || '',
        department: user.department || '',
        designation: user.designation || '',
        contacts: user.contacts || '',
        employee_signature: user.name || ''
      }));
    }
  }, [user]);

  const leaveTypeOptions = [
    "Sick Leave",
    "Maternity Leave/Paternity Leave",
    "Personal Leave",
    "Bereavement",
    "Study Leave",
    "Unpaid Leave",
    "Other"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLeaveTypeChange = (leaveType) => {
    setFormData(prev => ({
      ...prev,
      leave_types: prev.leave_types.includes(leaveType)
        ? prev.leave_types.filter(type => type !== leaveType)
        : [...prev.leave_types, leaveType]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.leave_types.length === 0) {
      toast.error('Please select at least one leave type');
      return;
    }
    
    if (!formData.from_date || !formData.to_date) {
      toast.error('Please select both from and to dates');
      return;
    }
    
    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for your leave');
      return;
    }

    // Check if department is filled
    if (!formData.department || formData.department.trim() === '') {
      toast.error('Department is required. Please ensure your profile has a department set.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for backend
      const submitData = {
        employee_name: formData.employee_name.trim(),
        department: formData.department.trim(),
        designation: formData.designation.trim() || '',
        contacts: formData.contacts.trim() || '',
        leave_types: formData.leave_types, // Send as array
        from_date: formData.from_date,
        to_date: formData.to_date,
        reason: formData.reason.trim(),
        employee_signature: formData.employee_signature.trim() || '',
        important_comments: formData.important_comments.trim() || ''
      };
      
      console.log('Submitting leave application:', submitData); // Debug log
      
      const response = await api.post('/leave-applications', submitData);
      
      toast.success('Leave application submitted successfully!');
      onSubmit && onSubmit();
      
    } catch (error) {
      console.error('Leave application error:', error); // Debug log
      console.error('Error response:', error.response?.data); // Debug log
      
      const errorMessage = error.response?.data?.message || 'Failed to submit leave application';
      toast.error(errorMessage);
    }
    
    setLoading(false);
  };

  // Show loading if user data hasn't loaded yet
  if (!user) {
    return (
      <div className="loading-container">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>Leave Application Form</h2>
        <p>Please fill out all required fields to submit your leave request</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Employee Name *</label>
            <input
              type="text"
              name="employee_name"
              className="form-control"
              value={formData.employee_name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Department *</label>
            <input
              type="text"
              name="department"
              className="form-control"
              value={formData.department}
              onChange={handleInputChange}
              required
              readOnly={!!user.department} // Make readonly if user has department
              style={{ backgroundColor: user.department ? '#f5f5f5' : 'white' }}
            />
          </div>
          
          <div className="form-group">
            <label>Designation</label>
            <input
              type="text"
              name="designation"
              className="form-control"
              value={formData.designation}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label>Contacts</label>
            <input
              type="text"
              name="contacts"
              className="form-control"
              value={formData.contacts}
              onChange={handleInputChange}
              placeholder="Phone/Email"
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Type of Leave (Select applicable) *</label>
          <div className="leave-types">
            {leaveTypeOptions.map(leaveType => (
              <div key={leaveType} className="leave-type">
                <input
                  type="checkbox"
                  id={leaveType}
                  checked={formData.leave_types.includes(leaveType)}
                  onChange={() => handleLeaveTypeChange(leaveType)}
                />
                <label htmlFor={leaveType}>{leaveType}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>From Date *</label>
            <input
              type="date"
              name="from_date"
              className="form-control"
              value={formData.from_date}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>To Date *</label>
            <input
              type="date"
              name="to_date"
              className="form-control"
              value={formData.to_date}
              onChange={handleInputChange}
              required
              min={formData.from_date} // Ensure to_date is not before from_date
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Reason for Leave *</label>
          <textarea
            name="reason"
            className="form-control"
            rows="4"
            value={formData.reason}
            onChange={handleInputChange}
            placeholder="Please provide details about your leave request"
            required
          />
        </div>

        <div className="form-group full-width">
          <label>Employee Signature</label>
          <input
            type="text"
            name="employee_signature"
            className="form-control"
            value={formData.employee_signature}
            onChange={handleInputChange}
            placeholder="Type your full name as signature"
          />
        </div>

        <div className="form-group full-width">
          <label>Important Comments</label>
          <textarea
            name="important_comments"
            className="form-control"
            rows="3"
            value={formData.important_comments}
            onChange={handleInputChange}
            placeholder="Any additional comments or notes"
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveApplicationForm;