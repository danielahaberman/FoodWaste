# Food Waste App - Development Rules & Tasks

## 🚨 Critical Issues (Fix First)

### 1. Timezone Issues ✅ COMPLETED
- **Problem**: Server timezone causing foods to be added to wrong dates (yesterday/future)
- **Solution**: Unify timezone to US East Coast across all date operations
- **Files**: `server/index.js`, `server/db.js`, date handling in components
- **Priority**: HIGH
- **Status**: ✅ Fixed - All date operations now use US East Coast timezone

### 2. Terms of Service Database Storage ✅ COMPLETED
- **Problem**: Terms acceptance stored in localStorage, not persistent
- **Solution**: Add `terms_accepted_at` and `terms_accepted_version` columns to users table, store acceptance timestamp
- **Files**: `server/db.js`, `server/index.js`, `src/Components/TermsGuard.jsx`, `src/Components/Pages/TermsAndConditions.jsx`
- **Priority**: HIGH
- **Status**: ✅ Fixed - Terms acceptance now stored in database with permanent migration system

## 📊 Survey System (High Priority)

### 3. Initial Survey Enforcement 🔄 IN PROGRESS
- **Problem**: New users not forced to take initial survey
- **Solution**: Check survey status on login, redirect to survey if not completed
- **Files**: `src/Components/Pages/Login.jsx`, `src/Components/AuthGuard.jsx`, survey components
- **Priority**: HIGH
- **Status**: 🔄 Survey questions added to database, enforcement logic needed

### 4. Weekly Survey Enforcement
- **Problem**: Users not forced to take weekly surveys at end of week
- **Solution**: Check if weekly survey is due, force completion before accessing app
- **Files**: Survey components, `src/Components/AuthGuard.jsx`
- **Priority**: HIGH

### 5. Late Survey Handling
- **Problem**: No way to take missed weekly surveys
- **Solution**: Allow previous week surveys + flag as "late"
- **Files**: Survey components, database queries
- **Priority**: MEDIUM

### 6. Survey Notifications
- **Problem**: No notification when weekly survey is available
- **Solution**: Add notification banner on landing page when survey is due
- **Files**: `src/Components/Pages/LandingPage.jsx`, notification components
- **Priority**: MEDIUM

## 💰 Financial Display (Medium Priority)

### 7. Money Formatting
- **Problem**: Money not consistently showing 2 decimal places
- **Solution**: Standardize all money displays to 2 decimal places
- **Files**: All components with price/cost displays, utility functions
- **Priority**: MEDIUM

## ⚠️ User Experience Warnings (Medium Priority)

### 8. Past Date Food Addition Warning
- **Problem**: Users can accidentally add food to past dates without warning
- **Solution**: Show confirmation dialog when adding food to past dates
- **Files**: `src/Components/Pages/AddNewPurchase.jsx`, date picker components
- **Priority**: MEDIUM

## 🔧 Technical Improvements (Lower Priority)

### 9. Code Organization
- **Problem**: Some components could be better organized
- **Solution**: Refactor large components, extract utility functions
- **Priority**: LOW

### 10. Performance Optimization
- **Problem**: Some API calls could be optimized
- **Solution**: Implement caching, reduce unnecessary API calls
- **Priority**: LOW

### 11. Error Page Theming ✅ COMPLETED
- **Problem**: Error page uses kitchen/cooking theme instead of food tracking theme
- **Solution**: Update error messages to be food tracking app specific
- **Files**: `src/Components/ErrorBoundary.jsx`
- **Priority**: LOW
- **Status**: ✅ Fixed - Error messages now reflect food tracking app theme

### 12. Admin Analytics Dashboard ✅ COMPLETED
- **Problem**: Need comprehensive analytics dashboard for admin users to analyze user data
- **Solution**: Create protected route with detailed breakdown of survey responses, demographics, and waste patterns
- **Features Needed**:
  - Survey response statistics (quantified answers, percentages)
  - Demographics breakdown (gender ratios, age groups, income levels)
  - Food waste patterns and trends across users
  - Purchase behavior analytics
  - User engagement metrics
  - Weekly/monthly reporting capabilities
  - **Data Export**: Download data as CSV files for Google Sheets import
- **Files**: New route in `server/index.js`, new admin dashboard component, API endpoints
- **Database Queries**:
  - Aggregate survey responses by question and option
  - Calculate waste/consumption ratios
  - Demographics distribution queries
  - Purchase amount trends
- **Export Features**:
  - Raw data export (all user responses, purchases, waste logs)
  - Aggregated analytics export (summary statistics)
  - Filtered exports (by date range, user demographics, etc.)
  - CSV format optimized for Google Sheets import
- **Dependencies**: Built-in CSV generation (no external packages needed)
- **Security**: Password protection for admin access only (to be added later)
- **Priority**: MEDIUM
- **Status**: ✅ Completed - Full analytics dashboard with CSV export functionality and improved survey input types

### 13. Final Survey Push System
- **Problem**: Need ability to manually trigger final survey for specific users when study period ends
- **Solution**: Add admin-controlled flag system to push final survey to individual users
- **Features Needed**:
  - Database flag (`final_survey_triggered`) to track which users should see final survey
  - Admin interface to select users and trigger final survey
  - UI detection of final survey flag to show survey prompt
  - Automatic flag clearing after final survey completion
  - Bulk trigger option for multiple users
- **Database Changes**:
  - `ALTER TABLE users ADD COLUMN final_survey_triggered BOOLEAN DEFAULT FALSE;`
  - `ALTER TABLE users ADD COLUMN final_survey_triggered_at TIMESTAMP;`
- **Files**: `server/index.js` (admin endpoints), admin dashboard, `src/Components/AuthGuard.jsx`, survey components
- **API Endpoints**:
  - `POST /admin/trigger-final-survey` (single user)
  - `POST /admin/trigger-final-survey-bulk` (multiple users)
  - `GET /auth/final-survey-status/:userId`
  - `POST /survey/complete-final`
- **Priority**: HIGH

---

## Implementation Order

1. **Timezone Fix** ✅ - Critical for data accuracy
2. **Terms Database Storage** ✅ - Security and persistence
3. **Error Page Theming** ✅ - User experience
4. **Initial Survey Enforcement** 🔄 - User onboarding
5. **Weekly Survey Enforcement** - Data collection
6. **Final Survey Push System** - Study completion control
7. **Money Formatting** - User experience
8. **Past Date Warning** - User experience
9. **Admin Analytics Dashboard** - Business insights
10. **Late Survey Handling** - Data completeness
11. **Survey Notifications** - User engagement
12. **Code Organization** - Maintainability
13. **Performance Optimization** - Scalability

---

## Database Schema Changes Needed

```sql
-- Add terms acceptance tracking ✅ COMPLETED
ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN terms_accepted_version VARCHAR(10);

-- Add survey completion tracking
ALTER TABLE users ADD COLUMN initial_survey_completed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN last_weekly_survey_date DATE;

-- Add final survey push system
ALTER TABLE users ADD COLUMN final_survey_triggered BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN final_survey_triggered_at TIMESTAMP;
ALTER TABLE users ADD COLUMN final_survey_completed_at TIMESTAMP;
```

---

## API Endpoints Needed

```javascript
// Terms acceptance ✅ COMPLETED
POST /auth/accept-terms
GET /auth/terms-status

// Survey enforcement
GET /survey/status/:userId
POST /survey/complete-initial
POST /survey/complete-weekly
GET /survey/weekly-available

// Admin Analytics Dashboard
GET /admin/analytics/overview
GET /admin/analytics/demographics
GET /admin/analytics/survey-responses
GET /admin/analytics/waste-patterns
GET /admin/analytics/purchase-trends
POST /admin/authenticate

// Data Export Endpoints (CSV for Google Sheets)
GET /admin/export/raw-data?filters={...}
GET /admin/export/analytics?dateRange={...}
GET /admin/export/survey-responses?stage=initial
GET /admin/export/user-demographics
GET /admin/export/waste-patterns?timeframe=weekly

// Final Survey Push System
POST /admin/trigger-final-survey
POST /admin/trigger-final-survey-bulk
GET /auth/final-survey-status/:userId
POST /survey/complete-final
```

---

## Component Changes Needed

- `TermsGuard.jsx` - Check database instead of localStorage
- `AuthGuard.jsx` - Add survey enforcement logic
- `Login.jsx` - Redirect to surveys if needed
- `LandingPage.jsx` - Add survey notifications
- Date picker components - Add past date warnings
- Money display components - Standardize formatting
