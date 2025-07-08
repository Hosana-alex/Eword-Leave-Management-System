// components/common/PasswordResetModal.jsx
import React, { useState } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import './PasswordResetModal.css';

const PasswordResetModal = ({ isOpen, onComplete, userName }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required';
    }
    
    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters long';
    }
    
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await api.put('/auth/force-change-password', formData);
      // Don't show toast here - let the parent component handle it
      onComplete();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      toast.error(errorMessage);
      
      if (errorMessage.includes('Current password is incorrect')) {
        setErrors({ current_password: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="password-reset-overlay">
      <div className="password-reset-modal">
        {/* Header */}
        <div className="password-reset-header">
          <div className="password-reset-icon">
            🔐
          </div>
          <h2 className="password-reset-title">
            Password Reset Required
          </h2>
          <p className="password-reset-subtitle">
            Hello {userName}, please change your temporary password to continue
          </p>
        </div>

        {/* Form Content */}
        <div className="password-reset-form">
          <div className="form-group">
            <label className="form-label">
              Current Password (Temporary)
            </label>
            <input
              type="password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              className={`form-input ${errors.current_password ? 'error' : ''}`}
              placeholder="Enter the temporary password from your email"
              disabled={loading}
            />
            {errors.current_password && (
              <p className="error-message">{errors.current_password}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              New Password
            </label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              className={`form-input ${errors.new_password ? 'error' : ''}`}
              placeholder="Enter your new secure password"
              disabled={loading}
            />
            {errors.new_password && (
              <p className="error-message">{errors.new_password}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className={`form-input ${errors.confirm_password ? 'error' : ''}`}
              placeholder="Confirm your new password"
              disabled={loading}
            />
            {errors.confirm_password && (
              <p className="error-message">{errors.confirm_password}</p>
            )}
          </div>

          {/* Security Tips */}
          <div className="security-tips">
            <h4 className="tips-title">Password Security Tips:</h4>
            <ul className="tips-list">
              <li>Use at least 8 characters</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Add numbers and special characters</li>
              <li>Avoid using personal information</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`submit-button ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="loading-icon">⏳</span>
                Changing Password...
              </>
            ) : (
              'Change Password & Continue'
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="password-reset-footer">
          <p className="footer-text">
            🔒 This is required for your account security
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;