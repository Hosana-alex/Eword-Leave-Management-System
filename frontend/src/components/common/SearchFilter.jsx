// components/common/SearchFilter.jsx
import React, { useState } from 'react';

const SearchFilter = ({ onSearch, onDateFilter, showDateFilter = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleDateFilter = () => {
    if (fromDate && toDate) {
      onDateFilter({ fromDate, toDate });
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    onSearch('');
    onDateFilter({ fromDate: '', toDate: '' });
  };

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      border: '1px solid #ffc700'
    }}>
      <form onSubmit={handleSearch}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search by name */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ fontSize: '0.85rem', color: '#3b3801', fontWeight: '600' }}>
              Search by Name
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginTop: '0.25rem' }}
            />
          </div>

          {/* Date range filter */}
          {showDateFilter && (
            <>
              <div style={{ minWidth: '150px' }}>
                <label style={{ fontSize: '0.85rem', color: '#3b3801', fontWeight: '600' }}>
                  From Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{ marginTop: '0.25rem' }}
                />
              </div>
              
              <div style={{ minWidth: '150px' }}>
                <label style={{ fontSize: '0.85rem', color: '#3b3801', fontWeight: '600' }}>
                  To Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate}
                  style={{ marginTop: '0.25rem' }}
                />
              </div>
            </>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              🔍 Search
            </button>
            {showDateFilter && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDateFilter}
                disabled={!fromDate || !toDate}
              >
                📅 Filter
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClear}
            >
              ✖ Clear
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchFilter;