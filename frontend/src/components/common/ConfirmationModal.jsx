// components/common/ConfirmationModal.jsx
import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "warning", // warning, danger, info, success
  loading = false 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      case 'warning':
      default:
        return '🚨';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !loading) {
      onConfirm();
    }
  };

  return (
    <div 
      className="confirmation-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyPress}
      tabIndex={-1}
    >
      <div className={`confirmation-modal ${type}`}>
        <div className="confirmation-header">
          <div className="confirmation-icon">
            {getIcon()}
          </div>
          <h3 className="confirmation-title">{title}</h3>
        </div>
        
        <div className="confirmation-body">
          <p className="confirmation-message">{message}</p>
        </div>
        
        <div className="confirmation-actions">
          <button
            onClick={onClose}
            className="confirmation-btn cancel"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`confirmation-btn confirm ${type}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;