# Fake Data Generation System

This system allows you to generate fake users with realistic test data for the Food Waste app. All fake users are easily identifiable and can be cleaned up with a single function.

## Features

- **Fake Users**: Creates users with names like `DummyUser1`, `DummyUser2`, etc.
- **Realistic Data**: Generates 4 weeks of food purchases, consumption logs, and survey responses
- **Easy Cleanup**: All fake data can be deleted with a single function call
- **API Endpoints**: RESTful endpoints to generate and manage fake data

## Files

- `fakeDataGenerator.js` - Core functions for generating and cleaning up fake data
- `testFakeData.js` - Test script to demonstrate the system
- `FAKE_DATA_README.md` - This documentation file

## API Endpoints

### Generate Fake Data
```http
POST /admin/generate-fake-data
Content-Type: application/json

{
  "count": 5
}
```

**Response:**
```json
{
  "message": "Successfully generated 5 fake users with complete data",
  "users": [
    {
      "id": 123,
      "username": "DummyUser1",
      "name": "Dummy User 1",
      "purchases": 24,
      "consumptionLogs": 48,
      "surveyResponses": 15
    }
  ]
}
```

### Get Fake Users Count
```http
GET /admin/fake-users-count
```

**Response:**
```json
{
  "count": 5,
  "message": "Found 5 fake users in the database"
}
```

### Clean Up Fake Data
```http
DELETE /admin/cleanup-fake-data
```

**Response:**
```json
{
  "message": "Successfully deleted 5 fake users and all their associated data",
  "deletedUsers": [
    {
      "id": 123,
      "username": "DummyUser1"
    }
  ]
}
```

## Programmatic Usage

### Import the functions
```javascript
import { 
  generateFakeUsersWithData, 
  cleanupFakeUsers, 
  getFakeUsersCount 
} from './fakeDataGenerator.js';
```

### Generate fake users with data
```javascript
// Generate 5 fake users with complete data
const results = await generateFakeUsersWithData(5);

console.log(`Generated ${results.length} users:`);
results.forEach(result => {
  console.log(`${result.user.username}: ${result.purchases.length} purchases`);
});
```

### Check fake users count
```javascript
const count = await getFakeUsersCount();
console.log(`Found ${count} fake users`);
```

### Clean up all fake data
```javascript
const deletedUsers = await cleanupFakeUsers();
console.log(`Deleted ${deletedUsers.length} fake users`);
```

## Test Script

Run the test script to see the system in action:

```bash
cd server
node testFakeData.js
```

This will:
1. Check current fake users count
2. Generate 3 fake users with complete data
3. Show the generated data
4. Clean up all fake users
5. Verify cleanup was successful

## Generated Data Details

### Users
- Username pattern: `DummyUser1`, `DummyUser2`, etc.
- Password: `dummy123` (hashed)
- Terms accepted: Yes
- Survey completion: All surveys marked as completed

### Food Purchases
- **Duration**: Last 4 weeks
- **Frequency**: 5-15 purchases per week per user (increased for more data)
- **Items**: Random selection from the food items database
- **Prices**: Realistic prices with ±20% variation
- **Quantities**: Realistic quantities based on food type:
  - Individual items (Each/Box): 1-4 items
  - Weight-based (Lb/Pound): 1-3 pounds
  - Volume-based (Liter/Gallon): 1-2 units
  - Default: 1-5 units

### Consumption Logs
- **Events**: 2-5 consumption/waste events per purchase (more detailed tracking)
- **Actions**: Varied consumed vs wasted ratios based on food type:
  - Perishables (bread, milk, bananas, lettuce): ~40% waste
  - Longer-lasting items (apples, oranges, potatoes): ~25% waste
  - Expensive proteins (meat, chicken, fish): ~15% waste
  - Other items: ~30% waste
  - ±10% random variation for realism
- **Timing**: Events spread over days after purchase
- **Cost tracking**: Accurate cost values based on consumption

### Survey Responses
- **Initial Survey**: All demographic and lifestyle questions
- **Weekly Survey**: Food shopping and waste awareness questions
- **Final Survey**: App effectiveness and satisfaction questions
- **Responses**: Realistic, varied responses based on question type

## Safety Features

- **Easy Identification**: All fake users have `DummyUser` prefix
- **Cascade Deletion**: Deleting a fake user removes all associated data
- **Count Limits**: API limits generation to 1-20 users at a time
- **Smart Numbering**: Automatically continues from the highest existing user number
- **Duplicate Prevention**: Skips creation if user already exists

## Database Tables Affected

When generating fake data, the following tables are populated:
- `users` - Fake user accounts
- `purchases` - Food purchase history
- `consumption_logs` - Consumption and waste tracking
- `survey_responses` - Survey answers

When cleaning up, all data in these tables associated with fake users is deleted.

## Admin Portal Integration

The fake data management system is fully integrated into the admin dashboard at `/admin`. 

### Admin Portal Features:
- **Fake Data Management Tab**: Dedicated tab for managing fake users
- **Current Status Display**: Shows count of fake users in the database
- **Quick Action Buttons**: Generate 3, 5, or 10 users with one click
- **Safe Cleanup**: Delete all fake data with confirmation dialog
- **Real-time Updates**: Dashboard refreshes automatically after operations
- **Status Messages**: Success/error feedback for all operations

### How to Access:
1. Navigate to `/admin` in your browser
2. Click on the "Fake Data Management" tab
3. Use the buttons to generate or clean up fake data
4. Monitor the current status and operation results

### Incremental User Generation:
- **Smart Numbering**: The system automatically finds the highest existing DummyUser number and continues from there
- **Example**: If you have DummyUser1-10, generating 5 more users will create DummyUser11-15
- **No Duplicates**: You can safely generate more users multiple times without creating duplicates
- **Unlimited Growth**: You can keep adding users beyond the initial 10 (DummyUser11, DummyUser12, etc.)

## Usage Recommendations

1. **Development**: Use for testing UI with realistic data
2. **Demo**: Generate sample data for presentations
3. **Testing**: Create test scenarios with known data patterns
4. **Cleanup**: Always clean up fake data before production deployment

## Notes

- Fake users are created with terms accepted and surveys completed
- All dates are realistic and spread over the last 4 weeks
- Data relationships are maintained (purchases link to consumption logs)
- The system respects existing database constraints and foreign keys
- **Complete Data Cleanup**: When deleting fake users, ALL associated data is automatically removed due to CASCADE DELETE constraints
