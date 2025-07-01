import React, { useState } from 'react';
import './AdminCommentsModal.css';

const AdminCommentsModal = ({ isOpen, onClose, onSubmit, application, action }) => {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(application.id, action, comments);
      setComments('');
      onClose();
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setComments('');
    onClose();
  };

  if (!isOpen || !application) return null;

  const isApproval = action === 'approved';
  const actionText = isApproval ? 'Approve' : 'Reject';
  const actionColor = isApproval ? '#27ae60' : '#e74c3c';

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: `3px solid ${actionColor}` }}>
          <h3 style={{ color: actionColor }}>
            {actionText} Leave Application
          </h3>
          <button className="modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Application Summary */}
          <div className="application-summary">
            <h4>Application Details</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Employee:</span>
                <span className="value">{application.employee_name}</span>
              </div>
              <div className="summary-item">
                <span className="label">Department:</span>
                <span className="value">{application.department}</span>
              </div>
              <div className="summary-item">
                <span className="label">Leave Type:</span>
                <span className="value">{application.leave_types?.join(', ')}</span>
              </div>
              <div className="summary-item">
                <span className="label">Duration:</span>
                <span className="value">{application.from_date} to {application.to_date}</span>
              </div>
              <div className="summary-item">
                <span className="label">Days:</span>
                <span className="value">{application.days_count || 'N/A'} days</span>
              </div>
            </div>
            
            <div className="reason-box">
              <span className="label">Reason:</span>
              <p className="reason-text">{application.reason}</p>
            </div>
          </div>

          {/* Comments Input */}
          <div className="comments-section">
            <label htmlFor="admin-comments" className="comments-label">
              {isApproval ? 'Approval Comments (Optional):' : 'Rejection Reason (Required):'}
            </label>
            <textarea
              id="admin-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                isApproval 
                  ? "Add any approval notes or conditions..." 
                  : "Please provide a reason for rejection..."
              }
              rows={4}
              className="comments-textarea"
              required={!isApproval}
            />
            <div className="char-count">
              {comments.length}/500 characters
            </div>
          </div>

          {/* Warning/Info Messages */}
          {isApproval && (
            <div className="info-message">
              <span className="info-icon">ℹ️</span>
              <p>Approving this application will automatically deduct the days from the employee's leave balance.</p>
            </div>
          )}

          {!isApproval && (
            <div className="warning-message">
              <span className="warning-icon">⚠️</span>
              <p>This application will be permanently rejected. The employee will be notified via email.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || (!isApproval && !comments.trim())}
            className={`btn ${isApproval ? 'btn-success' : 'btn-danger'}`}
            style={{ backgroundColor: actionColor }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              `${actionText} Application`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCommentsModal;