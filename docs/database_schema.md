# Database Schema Overview

## Current Tables
- **users**: Employee information and authentication
- **leave_applications**: Leave requests and approvals
- **leave_balances**: Leave entitlements and usage
- **notifications**: System notifications

## Key Relationships
- User → Leave Applications (One to Many)
- User → Leave Balances (One to One per year)
- User → Notifications (One to Many)

## Schema Design Principles
- Normalized structure with proper relationships
- Audit trails for important actions (created_at, updated_at, action_by)
- Soft deletes where appropriate
- Index optimization for frequently queried fields
- Foreign key constraints for data integrity

## Extension Strategy
New tables and relationships will be designed based on the analysis of existing Google Sheets, following the same principles and patterns established in the current schema.