import axios from "axios";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://eword-management-system.onrender.com/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// ===== AUTHENTICATION ENDPOINTS =====
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getCurrentUser: () => api.get("/auth/user"),
  changePassword: (passwordData) =>
    api.put("/auth/change-password", passwordData),
  logout: () => api.post("/auth/logout"),
};

// ===== USER MANAGEMENT ENDPOINTS =====
export const userAPI = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (profileData) => api.put("/user/profile", profileData),
  uploadProfilePicture: (formData) =>
    api.post("/user/profile/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getLeaveBalance: (year = new Date().getFullYear()) =>
    api.get(`/user/leave-balance?year=${year}`),
  getMyApplications: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/user/applications?${params}`);
  },
};

// ===== ADMIN USER MANAGEMENT ENDPOINTS =====
export const adminUserAPI = {
  getAllUsers: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/admin/users?${params}`);
  },
  getEnhancedUsers: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/admin/users/enhanced?${params}`);
  },
  getActivityStats: () => api.get("/admin/users/activity-stats"),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  approveUser: (userId) => api.put(`/admin/users/${userId}/approve`),
  rejectUser: (userId) => api.put(`/admin/users/${userId}/reject`),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  resetUserPassword: (userId) =>
    api.post(`/admin/users/${userId}/reset-password`),
  bulkApproveUsers: (userIds) =>
    api.post(`/admin/users/bulk-approve`, { user_ids: userIds }),
  bulkRejectUsers: (userIds) =>
    api.post(`/admin/users/bulk-reject`, { user_ids: userIds }),
  bulkDeactivateUsers: (userIds) =>
    api.post(`/admin/users/bulk-deactivate`, { user_ids: userIds }),
  activateUser: (userId) => api.put(`/admin/users/${userId}/activate`),
  deactivateUser: (userId) => api.put(`/admin/users/${userId}/deactivate`),
  getUserLeaveBalance: (userId, year = new Date().getFullYear()) =>
    api.get(`/admin/users/${userId}/leave-balance?year=${year}`),
  updateUserLeaveBalance: (userId, balanceData) =>
    api.put(`/admin/users/${userId}/leave-balance`, balanceData),
};

// ===== LEAVE APPLICATION ENDPOINTS =====
export const leaveAPI = {
  submitApplication: (applicationData) =>
    api.post("/leave-applications", applicationData),
  getApplications: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/leave-applications?${params}`);
  },
  getApplicationById: (id) => api.get(`/leave-applications/${id}`),
  updateApplication: (id, data) => api.put(`/leave-applications/${id}`, data),
  deleteApplication: (id) => api.delete(`/leave-applications/${id}`),
  approveApplication: (id, comments = "") =>
    api.put(`/leave-applications/${id}/approve`, { admin_comments: comments }),
  rejectApplication: (id, comments = "") =>
    api.put(`/leave-applications/${id}/reject`, { admin_comments: comments }),
  validateLeaveApplication: (applicationData) =>
    api.post("/leave-applications/validate", applicationData),
  checkLeaveOverlap: (userId, fromDate, toDate) =>
    api.get(
      `/leave-applications/overlap-check?user_id=${userId}&from_date=${fromDate}&to_date=${toDate}`
    ),
  getCalendarData: (
    year = new Date().getFullYear(),
    month = new Date().getMonth() + 1
  ) => api.get(`/leave/calendar?year=${year}&month=${month}`),
  getUpcomingLeaves: (days = 30) => api.get(`/leave/upcoming?days=${days}`),
};

// ===== ADMIN LEAVE MANAGEMENT ENDPOINTS =====
export const adminLeaveAPI = {
  getAllApplications: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/admin/applications?${params}`);
  },
  updateApplicationStatus: (applicationId, status, comments = "") =>
    api.put(`/admin/applications/${applicationId}/status`, {
      status,
      admin_comments: comments,
    }),
  bulkApprove: (applicationIds, comments = "") =>
    api.post("/admin/applications/bulk-approve", {
      application_ids: applicationIds,
      admin_comments: comments,
    }),
  bulkReject: (applicationIds, comments = "") =>
    api.post("/admin/applications/bulk-reject", {
      application_ids: applicationIds,
      admin_comments: comments,
    }),
};

// ===== ANALYTICS & REPORTS ENDPOINTS =====
export const analyticsAPI = {
  getDashboardStats: () => api.get("/dashboard/stats"),
  getAdvancedStats: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/analytics/dashboard?${params}`);
  },
  getDepartmentAnalytics: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/admin/analytics/departments?${params}`);
  },
  getAbsenceRates: (period = "monthly", year = new Date().getFullYear()) =>
    api.get(`/analytics/absence-rates?period=${period}&year=${year}`),
  getUtilizationData: (year = new Date().getFullYear()) =>
    api.get(`/analytics/utilization?year=${year}`),
  getLeaveHeatMap: (year = new Date().getFullYear()) =>
    api.get(`/analytics/heatmap?year=${year}`),
  getCoverageRisk: (startDate, endDate) =>
    api.get(
      `/analytics/coverage-risk?start_date=${startDate}&end_date=${endDate}`
    ),
  getKPIs: (period = "monthly") => api.get(`/analytics/kpis?period=${period}`),
  getLeaveTrends: (period = "monthly", year = new Date().getFullYear()) =>
    api.get(`/analytics/trends?period=${period}&year=${year}`),
};

// ===== REPORTS ENDPOINTS =====
export const reportsAPI = {
  exportLeaveReport: (filters = {}, format = "csv") => {
    const params = new URLSearchParams({ ...filters, format }).toString();
    return api.get(`/reports/leave-applications?${params}`, {
      responseType: "blob",
    });
  },
  exportUserReport: (filters = {}, format = "csv") => {
    const params = new URLSearchParams({ ...filters, format }).toString();
    return api.get(`/reports/users?${params}`, {
      responseType: "blob",
    });
  },
  exportBalanceReport: (year = new Date().getFullYear(), format = "csv") =>
    api.get(`/reports/leave-balances?year=${year}&format=${format}`, {
      responseType: "blob",
    }),
  getAuditLog: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/reports/audit-log?${params}`);
  },
  getComplianceReport: (year = new Date().getFullYear()) =>
    api.get(`/reports/compliance?year=${year}`),
};

// ===== PUBLIC HOLIDAYS ENDPOINTS =====
export const holidaysAPI = {
  getHolidays: (year = new Date().getFullYear()) =>
    api.get(`/holidays?year=${year}`),
  addHoliday: (holidayData) => api.post("/admin/holidays", holidayData),
  updateHoliday: (holidayId, holidayData) =>
    api.put(`/admin/holidays/${holidayId}`, holidayData),
  deleteHoliday: (holidayId) => api.delete(`/admin/holidays/${holidayId}`),
  importHolidays: (year, country = "KE") =>
    api.post(`/admin/holidays/import`, { year, country }),
};

// ===== NOTIFICATIONS ENDPOINTS =====
export const notificationsAPI = {
  getNotifications: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/notifications?${params}`);
  },
  markAsRead: (notificationId) =>
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put("/notifications/mark-all-read"),
  getPreferences: () => api.get("/user/notification-preferences"),
  updatePreferences: (preferences) =>
    api.put("/user/notification-preferences", preferences),
  sendBulkNotification: (notificationData) =>
    api.post("/admin/notifications/bulk", notificationData),
  getDigestSettings: () => api.get("/admin/notifications/digest-settings"),
  updateDigestSettings: (settings) =>
    api.put("/admin/notifications/digest-settings", settings),
};

// ===== CALENDAR ENDPOINTS =====
export const calendarAPI = {
  getEvents: (startDate, endDate, filters = {}) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      ...filters,
    }).toString();
    return api.get(`/calendar/events?${params}`);
  },
  getPersonalCalendar: (
    year = new Date().getFullYear(),
    month = new Date().getMonth() + 1
  ) => api.get(`/user/calendar?year=${year}&month=${month}`),
  getTeamCalendar: (
    year = new Date().getFullYear(),
    month = new Date().getMonth() + 1
  ) => api.get(`/calendar/team?year=${year}&month=${month}`),
  getCompanyCalendar: (
    year = new Date().getFullYear(),
    month = new Date().getMonth() + 1
  ) => api.get(`/admin/calendar?year=${year}&month=${month}`),
};

// ===== UTILITY FUNCTIONS =====
export const utils = {
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  formatDate: (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },
  getStatusColor: (status) => {
    const colors = {
      pending: "#f39c12",
      approved: "#27ae60",
      rejected: "#e74c3c",
      active: "#3498db",
      inactive: "#95a5a6",
    };
    return colors[status] || "#7f8c8d";
  },
  getLeaveTypeColor: (leaveType) => {
    const colors = {
      "Sick Leave": "#e74c3c",
      "Personal Leave": "#3498db",
      "Maternity/Paternity Leave": "#f39c12",
      "Study Leave": "#9b59b6",
      Bereavement: "#34495e",
      "Unpaid Leave": "#95a5a6",
      Other: "#7f8c8d",
    };
    return colors[leaveType] || "#7f8c8d";
  },
};

// ===== ERROR HANDLING HELPERS =====
export const errorHandler = {
  getErrorMessage: (error) => {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return "An unexpected error occurred";
  },
  isNetworkError: (error) => {
    return !error.response && error.request;
  },
  isValidationError: (error) => {
    return error.response?.status === 400;
  },
  isAuthError: (error) => {
    return error.response?.status === 401;
  },
  isForbiddenError: (error) => {
    return error.response?.status === 403;
  },
};

// Default export
export default api;
