// components/modals/AdminCommentsModal.jsx
import React, { useState } from 'react';

const AdminCommentsModal = ({ isOpen, onClose, onConfirm, action, applicationId }) => {
  const [comments, setComments] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(applicationId, comments);
    setComments('');
  };

  const modalTitle = action === 'approve' ? 'Approve Application' : 'Reject Application';
  const buttonClass = action === 'approve' ? 'btn-success' : 'btn-danger';
  const buttonText = action === 'approve' ? 'Approve' : 'Reject';

  return (
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
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '2px solid #ffc700'
      }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#3b3801' }}>{modalTitle}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#3b3801' }}>
              Admin Comments (Optional)
            </label>
            <textarea
              className="form-control"
              rows="4"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={`Add any comments for the employee regarding this ${action}...`}
              style={{ marginTop: '0.5rem' }}
            />
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'flex-end',
            marginTop: '1.5rem'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setComments('');
                onClose();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${buttonClass}`}
            >
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCommentsModal;