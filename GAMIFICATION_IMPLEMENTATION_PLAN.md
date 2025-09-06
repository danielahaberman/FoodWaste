# Food Waste App Gamification Implementation Plan

## Overview
This document outlines the implementation plan for adding gamification features to the food waste tracking app, including daily task checklists, streak tracking, and a leaderboard system.

## Current App Structure Analysis

### Existing Features
- **Food Logging**: Users can log food purchases with date, quantity, price, and category
- **Consumption/Waste Tracking**: Users can mark food as consumed or wasted with quantities
- **Survey System**: Initial, weekly, and final surveys for research purposes
- **User Authentication**: Basic user registration and login system
- **Database**: PostgreSQL with tables for users, purchases, consumption_logs, survey_responses

### Key Components
- Frontend: React with Material-UI components
- Backend: Express.js with PostgreSQL
- Authentication: User ID stored in localStorage
- Color Scheme: White and blue palette (Material UI style)

## Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 Create Daily Tasks Table
```sql
CREATE TABLE daily_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  task_date DATE NOT NULL,
  log_food_completed BOOLEAN DEFAULT FALSE,
  log_food_completed_at TIMESTAMP,
  complete_survey_completed BOOLEAN DEFAULT FALSE,
  complete_survey_completed_at TIMESTAMP,
  log_consume_waste_completed BOOLEAN DEFAULT FALSE,
  log_consume_waste_completed_at TIMESTAMP,
  all_tasks_completed BOOLEAN DEFAULT FALSE,
  all_tasks_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, task_date)
);
```

#### 1.2 Create User Streaks Table
```sql
CREATE TABLE user_streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  total_completions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

#### 1.3 Add Indexes for Performance
```sql
CREATE INDEX idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);
CREATE INDEX idx_daily_tasks_date ON daily_tasks(task_date);
CREATE INDEX idx_user_streaks_streak ON user_streaks(current_streak DESC);
```

### Phase 2: Backend API Development

#### 2.1 Daily Tasks API Endpoints

**GET /api/daily-tasks/today**
- Returns today's task status for the user
- Creates new daily task record if it doesn't exist
- Checks completion status for each task type

**POST /api/daily-tasks/complete**
- Marks a specific task as completed
- Updates completion timestamps
- Triggers streak calculation if all tasks completed

**GET /api/daily-tasks/history**
- Returns task completion history for the user
- Shows streak information

#### 2.2 Leaderboard API Endpoints

**GET /api/leaderboard/current-streaks**
- Returns top users by current streak
- Includes user display names (anonymized if needed)
- Paginated results

**GET /api/leaderboard/longest-streaks**
- Returns top users by longest streak ever achieved
- Historical leaderboard data

**GET /api/leaderboard/total-completions**
- Returns top users by total task completions

#### 2.3 Streak Calculation Logic
- Daily task completion triggers streak update
- Streak breaks if user misses a day
- Handles timezone considerations (US East Coast)
- Updates both current and longest streak records

### Phase 3: Frontend Components

#### 3.1 Daily Tasks Component (`DailyTasks.jsx`)
**Location**: `src/Components/DailyTasks.jsx`

**Features**:
- Task checklist with 3 main tasks (can be completed in any order), each with a dedicated action button:
  1. "Log your first food item" - Button navigates to food logging page
  2. "Complete your survey" - Button navigates to survey page (if available)
  3. "Log your consume/waste" - Button navigates to consumption tracking page
- Progress indicator showing X/3 tasks completed
- Streak counter display
- Completion celebration animation
- Responsive design for mobile

**Task Button Functionality**:
- Each task has a prominent "Go to [Task]" button
- Completed tasks show checkmark and "Completed" status
- Incomplete tasks show active button with navigation
- Buttons use consistent styling with Material-UI theme
- Tasks can be completed in any order - no sequential requirement

**Task Logic**:
- Check if user has logged any food today
- Check if user has any pending surveys
- Check if user has logged any consumption/waste today
- Real-time updates when tasks are completed
- No specific order required for task completion

#### 3.2 Daily Tasks Popup Component (`DailyTasksPopup.jsx`)
**Location**: `src/Components/DailyTasksPopup.jsx`

**Features**:
- Modal popup that appears once per day on FoodLog home screen
- Shows only if user has incomplete tasks for today
- Compact design with essential task information
- Quick action buttons for each incomplete task
- "View All Tasks" button to open full DailyTasks component
- "Dismiss" button to close popup for the day

**Popup Logic**:
- Appears automatically when user visits FoodLog home screen
- Only shows if user has incomplete tasks for today
- Only shows once per day (tracked in localStorage)
- If already shown today, adds "Daily Tasks" to bottom navigation instead

#### 3.3 Bottom Navigation Integration
**Location**: `src/Components/BottomBar.jsx` (update existing)

**Features**:
- Add "Daily Tasks" icon to bottom navigation
- Shows task completion status (e.g., "2/3" badge)
- Only appears if popup was already shown today OR user has incomplete tasks
- Clicking opens full DailyTasks component
- Visual indicator when tasks are incomplete

#### 3.4 Leaderboard Component (`Leaderboard.jsx`)
**Location**: `src/Components/Pages/Leaderboard.jsx`

**Features**:
- Tabbed interface for different leaderboard types:
  - Current Streaks
  - Longest Streaks
  - Total Completions
- User ranking with streak numbers
- Current user's position highlighted
- Pagination for large lists
- Refresh functionality

#### 3.5 Navigation Integration
- Add "Leaderboard" to main navigation
- Update sidebar layout to include leaderboard page
- Integrate daily tasks popup with FoodLog component
- Update BottomBar with daily tasks indicator

### Phase 4: Task Completion Detection

#### 4.1 Food Logging Detection
- Monitor `purchases` table for new entries with today's date
- Update daily task when first food item is logged

#### 4.2 Survey Completion Detection
- Monitor `survey_responses` table for new entries
- Check if user has completed any available surveys today

#### 4.3 Consumption/Waste Detection
- Monitor `consumption_logs` table for new entries
- Update daily task when any consumption/waste is logged

#### 4.4 Real-time Updates
- Use existing API endpoints to check completion status
- Update task status immediately after user actions
- Provide visual feedback for task completion

### Phase 5: UI/UX Design

#### 5.1 Daily Tasks Page Design
**Layout**:
- Header with current streak display
- Task list with checkboxes, progress bar, and action buttons
- Each task row contains: icon, description, completion status, and action button
- Completion celebration modal

**Task Row Layout**:
```
[Icon] [Task Description] [Completion Status] [Action Button]
🍎    Log your first food item    ✓ Completed    [Go to Food Log]
📝    Complete your survey        ⏳ Pending     [Go to Survey]
♻️    Log your consume/waste      ⏳ Pending     [Go to Track]
```

**Visual Elements**:
- Progress bar showing completion percentage
- Icons for each task type (🍎, 📝, ♻️)
- Streak flame icon with number
- Completion checkmarks with animations
- Prominent action buttons with consistent styling
- Button states: enabled (blue), disabled (gray), completed (green)

#### 5.2 Leaderboard Page Design
**Layout**:
- Page header with title and refresh button
- Tab navigation for different leaderboard types
- Ranked list with user positions
- Current user highlighted in different color

**Visual Elements**:
- Trophy icons for top positions
- Medal colors (gold, silver, bronze)
- Streak numbers prominently displayed
- User avatars or initials

#### 5.3 Color Scheme
- Primary: Blue (#1976d2) - Material UI primary
- Success: Green (#4caf50) - for completed tasks
- Warning: Amber (#ff9800) - for pending tasks
- Background: White (#ffffff)
- Text: Dark gray (#333333)

### Phase 6: Implementation Steps

#### Step 1: Database Setup
1. Create migration scripts for new tables
2. Add indexes for performance
3. Test database operations

#### Step 2: Backend API Development
1. Implement daily tasks endpoints
2. Implement leaderboard endpoints
3. Add streak calculation logic
4. Test API endpoints

#### Step 3: Frontend Component Development
1. Create DailyTasks component with task buttons and navigation
2. Create Leaderboard component
3. Add navigation integration
4. Implement task completion detection
5. Add button routing logic for each task type

#### Step 4: Integration and Testing
1. Connect frontend to backend APIs
2. Test task completion flow
3. Test streak calculations
4. Test leaderboard functionality

#### Step 5: UI Polish and Animations
1. Add completion animations
2. Implement progress indicators
3. Add celebration effects
4. Responsive design testing

### Phase 7: Task Definitions

#### 7.1 Daily Task Types

**Task 1: Log Your First Food Item**
- **Description**: "Add at least one food item to your log today"
- **Completion Criteria**: User has at least one purchase record with today's date
- **Button Text**: "Go to Food Log"
- **Navigation**: Routes to `/home` (FoodLog component)
- **Icon**: 🍎
- **Button Action**: `navigate('/home')`

**Task 2: Complete Your Survey**
- **Description**: "Complete any available survey"
- **Completion Criteria**: User has completed any survey today (if available)
- **Button Text**: "Go to Survey"
- **Navigation**: Routes to `/survey` (QaPage component)
- **Icon**: 📝
- **Conditional**: Only show if user has pending surveys
- **Button Action**: `navigate('/survey')`

**Task 3: Log Your Consume/Waste**
- **Description**: "Track what you consumed or wasted today"
- **Completion Criteria**: User has at least one consumption_log record with today's date
- **Button Text**: "Go to Track"
- **Navigation**: Opens ConsumeWaste component (modal/overlay)
- **Icon**: ♻️
- **Button Action**: `setShowConsumeWaste(true)` (similar to existing BottomBar)

#### 7.2 Streak Rules
- **Daily Reset**: Tasks reset at midnight US East Coast time
- **Streak Continuation**: User must complete all available tasks to maintain streak
- **No Order Requirement**: Tasks can be completed in any order throughout the day
- **Streak Break**: Missing a day breaks the current streak
- **Streak Recovery**: User can start a new streak the next day
- **Partial Completion**: User can complete some tasks and return later to complete others

### Phase 8: Popup and Bottom Nav Implementation

#### 8.1 Daily Tasks Popup Implementation
**Popup Trigger Logic**:
```jsx
// In FoodLog component
useEffect(() => {
  const checkDailyTasksPopup = async () => {
    const today = new Date().toDateString();
    const popupShownToday = localStorage.getItem(`dailyTasksPopup_${today}`);
    const hasIncompleteTasks = await checkIncompleteTasks();
    
    if (!popupShownToday && hasIncompleteTasks) {
      setShowDailyTasksPopup(true);
    }
  };
  
  checkDailyTasksPopup();
}, []);
```

**Popup Component Structure**:
```jsx
<Dialog open={showDailyTasksPopup} onClose={handleDismissPopup}>
  <DialogTitle>Daily Tasks</DialogTitle>
  <DialogContent>
    <Typography variant="body2" sx={{ mb: 2 }}>
      Complete these tasks to maintain your streak!
    </Typography>
    {incompleteTasks.map(task => (
      <TaskRow key={task.id} task={task} />
    ))}
  </DialogContent>
  <DialogActions>
    <Button onClick={handleDismissPopup}>Dismiss</Button>
    <Button onClick={handleViewAllTasks} variant="contained">
      View All Tasks
    </Button>
  </DialogActions>
</Dialog>
```

#### 8.2 Bottom Navigation Integration
**BottomBar Update**:
```jsx
// Add to existing BottomBar component
const [showDailyTasks, setShowDailyTasks] = useState(false);
const [taskCompletionStatus, setTaskCompletionStatus] = useState({ completed: 0, total: 3 });

// Add daily tasks icon to bottom nav
<BottomNavigationAction
  label="Tasks"
  icon={
    <Badge badgeContent={`${taskCompletionStatus.completed}/${taskCompletionStatus.total}`} color="primary">
      <ChecklistIcon />
    </Badge>
  }
  onClick={() => setShowDailyTasks(true)}
/>
```

#### 8.3 Popup State Management
**LocalStorage Tracking**:
```jsx
const handleDismissPopup = () => {
  const today = new Date().toDateString();
  localStorage.setItem(`dailyTasksPopup_${today}`, 'true');
  setShowDailyTasksPopup(false);
  // Show bottom nav indicator instead
  setShowBottomNavTasks(true);
};
```

**Database Tracking Alternative**:
```sql
-- Add to daily_tasks table
ALTER TABLE daily_tasks ADD COLUMN popup_shown_today BOOLEAN DEFAULT FALSE;
```

### Phase 9: Button Implementation Details

#### 9.1 Task Button Component Structure
```jsx
// Example task row structure
<TaskRow>
  <TaskIcon>🍎</TaskIcon>
  <TaskContent>
    <TaskTitle>Log your first food item</TaskTitle>
    <TaskStatus>{isCompleted ? '✓ Completed' : '⏳ Pending'}</TaskStatus>
  </TaskContent>
  <TaskButton 
    variant={isCompleted ? 'outlined' : 'contained'}
    color={isCompleted ? 'success' : 'primary'}
    disabled={isCompleted}
    onClick={handleTaskNavigation}
  >
    {isCompleted ? 'Completed' : 'Go to Food Log'}
  </TaskButton>
</TaskRow>
```

#### 9.2 Navigation Implementation
**Food Logging Navigation**:
```jsx
const handleFoodLogNavigation = () => {
  navigate('/home');
  // Optional: Set focus to add button or scroll to food list
};
```

**Survey Navigation**:
```jsx
const handleSurveyNavigation = () => {
  navigate('/survey');
  // Optional: Show survey completion status
};
```

**Consume/Waste Navigation**:
```jsx
const handleConsumeWasteNavigation = () => {
  // Open modal similar to existing BottomBar implementation
  setShowConsumeWaste(true);
  // Or navigate to a dedicated page if preferred
};
```

#### 9.3 Button State Management
- **Pending State**: Blue button with "Go to [Task]" text
- **Completed State**: Green outlined button with "Completed" text
- **Disabled State**: Gray button when task is not available (e.g., no surveys)
- **Loading State**: Show spinner while checking completion status

#### 9.4 Responsive Button Design
- **Mobile**: Full-width buttons below task description
- **Desktop**: Compact buttons aligned to the right
- **Tablet**: Medium-width buttons with proper spacing

### Phase 10: Technical Considerations

#### 10.1 Performance
- Index database tables for fast queries
- Cache leaderboard data with reasonable TTL
- Paginate leaderboard results
- Optimize streak calculation queries

#### 10.2 Data Consistency
- Use database transactions for streak updates
- Handle concurrent task completions
- Validate task completion criteria
- Handle timezone edge cases

#### 10.3 User Experience
- Provide immediate feedback for task completion
- Show progress indicators
- Handle edge cases (no surveys available, etc.)
- Mobile-responsive design
- Smooth navigation transitions between tasks

#### 10.4 Privacy
- Anonymize user data in leaderboards if needed
- Allow users to opt out of leaderboards
- Respect user privacy preferences

### Phase 11: Future Enhancements

#### 11.1 Advanced Features
- **Achievements**: Badges for milestones (7-day streak, 30-day streak, etc.)
- **Challenges**: Weekly or monthly special challenges
- **Rewards**: Virtual rewards or recognition
- **Social Features**: Friend comparisons, team challenges

#### 11.2 Analytics
- Track task completion rates
- Monitor user engagement
- Analyze streak patterns
- A/B test different task configurations

#### 11.3 Personalization
- Customizable task types
- Personalized goals
- Adaptive difficulty
- User preference settings

## Implementation Timeline

### Week 1: Database and Backend
- Set up database schema
- Implement core API endpoints
- Add streak calculation logic

### Week 2: Frontend Components
- Create DailyTasks component
- Create Leaderboard component
- Implement navigation integration

### Week 3: Integration and Testing
- Connect frontend to backend
- Test task completion flow
- Test streak calculations
- Bug fixes and refinements

### Week 4: Polish and Launch
- UI/UX improvements
- Animation implementation
- Performance optimization
- Final testing and deployment

## Success Metrics

### Engagement Metrics
- Daily active users
- Task completion rates
- Average streak length
- Leaderboard participation

### Retention Metrics
- 7-day retention rate
- 30-day retention rate
- Streak continuation rates
- Feature adoption rates

### User Satisfaction
- User feedback on gamification features
- App store ratings
- Feature usage analytics
- Support ticket volume

## Conclusion

This gamification system will significantly enhance user engagement by providing clear daily goals, progress tracking, and social competition through leaderboards. The implementation follows the existing app architecture and maintains the current design language while adding engaging new features that encourage regular app usage and food waste tracking.

The phased approach ensures a systematic implementation with proper testing at each stage, while the modular design allows for future enhancements and customization based on user feedback and analytics.
