# API Endpoints Documentation

## Authentication
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/user
- PUT /api/auth/change-password

## User Management
- GET /api/admin/users
- PUT /api/admin/users/{id}/approve
- PUT /api/admin/users/{id}/reject
- DELETE /api/admin/users/{id}

## Leave Management
- POST /api/leave-applications
- GET /api/leave-applications
- PUT /api/leave-applications/{id}/approve
- PUT /api/leave-applications/{id}/reject

## Analytics
- GET /api/dashboard/stats
- GET /api/analytics/dashboard
- GET /api/analytics/departments

## API Design Patterns
- RESTful endpoint structure
- Consistent JSON response format
- JWT authentication for protected routes
- Proper HTTP status codes
- Error handling with descriptive messages