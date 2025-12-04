// @ts-nocheck
// fakeDataGenerator.js
import pool from './db.js';
import bcrypt from 'bcrypt';
import foodItems from './FoodItems.js';
import questions from './SurveyQuestions.js';

// Helper function to get random item from array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get random number between min and max
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to get random date within last 4 weeks
const getRandomDateInLast4Weeks = () => {
  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - (4 * 7 * 24 * 60 * 60 * 1000));
  const randomTime = fourWeeksAgo.getTime() + Math.random() * (now.getTime() - fourWeeksAgo.getTime());
  return new Date(randomTime);
};

// Helper function to get random date within a specific week
const getRandomDateInWeek = (weekOffset) => {
  const now = new Date();
  const startOfWeek = new Date(now.getTime() - (weekOffset * 7 * 24 * 60 * 60 * 1000));
  const endOfWeek = new Date(startOfWeek.getTime() + (7 * 24 * 60 * 60 * 1000));
  const randomTime = startOfWeek.getTime() + Math.random() * (endOfWeek.getTime() - startOfWeek.getTime());
  return new Date(randomTime);
};

// Helper function to get random date within last N days
const getRandomDateInLastNDays = (days) => {
  const now = new Date();
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  const randomTime = startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime());
  return new Date(randomTime);
};

// Generate fake users
export const generateFakeUsers = async (count = 5) => {
  console.log(`Generating ${count} fake users...`);
  const fakeUsers = [];
  
  try {
    // Find the highest existing DummyUser number
    const existingUsersResult = await pool.query(`
      SELECT username FROM users 
      WHERE username LIKE 'DummyUser%' 
      ORDER BY CAST(SUBSTRING(username FROM 'DummyUser(\\d+)') AS INTEGER) DESC 
      LIMIT 1
    `);
    
    let startNumber = 1;
    if (existingUsersResult.rows.length > 0) {
      const lastUsername = existingUsersResult.rows[0].username;
      const match = lastUsername.match(/DummyUser(\d+)/);
      if (match) {
        startNumber = parseInt(match[1]) + 1;
      }
    }
    
    console.log(`Starting from DummyUser${startNumber}`);
    
    for (let i = 0; i < count; i++) {
      const userNumber = startNumber + i;
      const username = `DummyUser${userNumber}`;
      const name = `Dummy User ${userNumber}`;
      const password = 'dummy123'; // Simple password for fake users
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Check if user already exists (shouldn't happen with our logic, but safety check)
      const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
      if (existingUser.rows.length > 0) {
        console.log(`User ${username} already exists, skipping...`);
        fakeUsers.push(existingUser.rows[0]);
        continue;
      }
      
      // Insert user with correct column names
      const query = `
        INSERT INTO users (username, password_hash, terms_accepted_at, terms_accepted_version)
        VALUES ($1, $2, CURRENT_TIMESTAMP, '1.0')
        RETURNING id, username
      `;
      
      const result = await pool.query(query, [username, hashedPassword]);
      const userData = {
        id: result.rows[0].id,
        username: result.rows[0].username,
        name: name
      };
      fakeUsers.push(userData);
      console.log(`Created fake user: ${username} (ID: ${result.rows[0].id})`);
    }
    
    return fakeUsers;
  } catch (error) {
    console.error('Error generating fake users:', error);
    throw error;
  }
};

// Generate fake food purchases for a user
export const generateFakePurchases = async (userId, weeks = 4) => {
  console.log(`Generating fake purchases for user ${userId}...`);
  const purchases = [];
  
  try {
    // Get categories and quantity types
    const categoriesResult = await pool.query('SELECT id, name FROM categories');
    const quantityTypesResult = await pool.query('SELECT id, name FROM quantity_types');
    
    const categories = categoriesResult.rows;
    const quantityTypes = quantityTypesResult.rows;
    
    if (categories.length === 0) {
      console.warn('No categories found in database. Please ensure categories are populated.');
      return [];
    }
    
    if (quantityTypes.length === 0) {
      console.warn('No quantity types found in database. Please ensure quantity types are populated.');
      return [];
    }
    
    // Generate purchases for each week
    for (let week = 0; week < weeks; week++) {
      // Random number of purchases per week (5-15) - increased for more data
      const purchasesThisWeek = getRandomNumber(5, 15);
      
      for (let p = 0; p < purchasesThisWeek; p++) {
        const foodItem = getRandomItem(foodItems);
        const category = categories.find(c => c.name === foodItem.category);
        const quantityType = quantityTypes.find(qt => qt.name === foodItem.quantity_type);
        
        if (!category || !quantityType) {
          console.warn(`Skipping ${foodItem.name} - category or quantity type not found`);
          continue;
        }
        
        // More realistic quantity ranges based on food type
        let quantity;
        if (foodItem.quantity_type === 'Each' || foodItem.quantity_type === 'Box') {
          quantity = getRandomNumber(1, 4); // 1-4 individual items
        } else if (foodItem.quantity_type === 'Lb' || foodItem.quantity_type === 'Pound') {
          quantity = getRandomNumber(1, 3); // 1-3 pounds
        } else if (foodItem.quantity_type === 'Liter' || foodItem.quantity_type === 'Gallon') {
          quantity = getRandomNumber(1, 2); // 1-2 liters/gallons
        } else {
          quantity = getRandomNumber(1, 5); // Default range
        }
        
        const price = parseFloat((foodItem.price * quantity * (0.8 + Math.random() * 0.4)).toFixed(2)); // Vary price by ±20%
        const purchaseDate = getRandomDateInWeek(week);
        
        const query = `
          INSERT INTO purchases (user_id, name, category, category_id, quantity, price, quantity_type, purchase_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;
        
        const result = await pool.query(query, [
          userId,
          foodItem.name,
          foodItem.category,
          category.id,
          quantity,
          price,
          foodItem.quantity_type,
          purchaseDate
        ]);
        
        purchases.push({
          id: result.rows[0].id,
          name: foodItem.name,
          quantity,
          price,
          purchaseDate
        });
      }
    }
    
    console.log(`Generated ${purchases.length} fake purchases for user ${userId}`);
    return purchases;
  } catch (error) {
    console.error('Error generating fake purchases:', error);
    throw error;
  }
};

// Generate fake consumption/waste logs
export const generateFakeConsumptionLogs = async (userId, purchases) => {
  console.log(`Generating fake consumption logs for user ${userId}...`);
  const logs = [];
  
  try {
    for (const purchase of purchases) {
      // Random number of consumption events per purchase (2-5) - more detailed tracking
      const eventsCount = getRandomNumber(2, 5);
      let remainingQuantity = purchase.quantity;
      
      for (let e = 0; e < eventsCount && remainingQuantity > 0; e++) {
        const isLastEvent = e === eventsCount - 1;
        
        // More varied consumed vs wasted ratios based on food type and user behavior
        let wasteProbability;
        const foodName = purchase.name.toLowerCase();
        
        // Different waste probabilities based on food type
        if (foodName.includes('bread') || foodName.includes('milk') || foodName.includes('banana') || 
            foodName.includes('lettuce') || foodName.includes('spinach')) {
          wasteProbability = 0.4; // 40% waste for perishables
        } else if (foodName.includes('apple') || foodName.includes('orange') || 
                   foodName.includes('potato') || foodName.includes('onion')) {
          wasteProbability = 0.25; // 25% waste for longer-lasting items
        } else if (foodName.includes('meat') || foodName.includes('chicken') || 
                   foodName.includes('beef') || foodName.includes('fish')) {
          wasteProbability = 0.15; // 15% waste for expensive proteins
        } else {
          wasteProbability = 0.3; // 30% waste for other items
        }
        
        // Add some randomness to make it more varied
        wasteProbability += (Math.random() - 0.5) * 0.2; // ±10% variation
        wasteProbability = Math.max(0.05, Math.min(0.6, wasteProbability)); // Clamp between 5% and 60%
        
        const action = Math.random() < wasteProbability ? 'wasted' : 'consumed';
        
        // For the last event, consume/waste whatever is left
        const quantity = isLastEvent ? remainingQuantity : getRandomNumber(1, remainingQuantity);
        remainingQuantity -= quantity;
        
        const percentage = (quantity / purchase.quantity) * 100;
        const costValue = (quantity / purchase.quantity) * purchase.price;
        const loggedAt = new Date(purchase.purchaseDate.getTime() + (e + 1) * 24 * 60 * 60 * 1000); // 1 day after purchase
        
        const query = `
          INSERT INTO consumption_logs (user_id, purchase_id, action, quantity, quantity_type, percentage, cost_value, logged_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;
        
        const result = await pool.query(query, [
          userId,
          purchase.id,
          action,
          quantity,
          'Each', // Default quantity type for logs
          percentage,
          costValue,
          loggedAt
        ]);
        
        logs.push({
          id: result.rows[0].id,
          purchaseId: purchase.id,
          action,
          quantity,
          percentage,
          costValue,
          loggedAt
        });
      }
    }
    
    console.log(`Generated ${logs.length} fake consumption logs for user ${userId}`);
    return logs;
  } catch (error) {
    console.error('Error generating fake consumption logs:', error);
    throw error;
  }
};

// Generate fake survey responses
export const generateFakeSurveyResponses = async (userId) => {
  console.log(`Generating fake survey responses for user ${userId}...`);
  const responses = [];
  
  try {
    // Get all survey questions
    const questionsResult = await pool.query('SELECT id, question_text, type, stage FROM survey_questions');
    const surveyQuestions = questionsResult.rows;
    
    // Generate responses for each question
    for (const question of surveyQuestions) {
      let response;
      
      // Generate appropriate response based on question type and stage
      if (question.stage === 'initial') {
        response = generateInitialSurveyResponse(question);
      } else if (question.stage === 'weekly') {
        response = generateWeeklySurveyResponse(question);
      } else if (question.stage === 'final') {
        response = generateFinalSurveyResponse(question);
      } else {
        response = generateDefaultResponse(question);
      }
      
      const responseDate = getRandomDateInLast4Weeks();
      
      const query = `
        INSERT INTO survey_responses (user_id, question_id, response, response_date)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      const result = await pool.query(query, [userId, question.id, response, responseDate]);
      responses.push({
        id: result.rows[0].id,
        questionId: question.id,
        response,
        responseDate
      });
    }
    
    // Update user's survey completion status (if columns exist)
    try {
      await pool.query(`
        UPDATE users 
        SET initial_survey_completed_at = CURRENT_TIMESTAMP,
            last_weekly_survey_date = CURRENT_DATE - INTERVAL '1 week',
            final_survey_completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId]);
    } catch (err) {
      console.log('Survey completion columns not found, skipping survey status update');
    }
    
    console.log(`Generated ${responses.length} fake survey responses for user ${userId}`);
    return responses;
  } catch (error) {
    console.error('Error generating fake survey responses:', error);
    throw error;
  }
};

// Helper functions for generating survey responses
const generateInitialSurveyResponse = (question) => {
  const responses = {
    "Are you the main shopper in your house?": ["Yes", "No"],
    "How old are you?": ["18 - 25", "26 - 30", "31 - 35", "36 - 40", "41 - 45", "46 - 50", "51 - 55", "56 - 60", "61+"],
    "What is your gender?": ["Male", "Female", "Prefer not to say"],
    "What is your yearly income?": ["$50,000 or less", "$51,000 - $100,000", "$101,000 - $150,000", "$151,000 - $200,000", "$201,000 - $250,000", "$251,000+"],
    "Do you have children?": ["0", "1", "2", "3", "4", "5", "6+"],
    "How many people live in your household?": ["1", "2", "3", "4", "5", "6+"],
    "Do you rent or own?": ["Rent", "Own", "Neither"],
    "How many vacations did you take last year?": ["0", "1", "2", "3", "4", "5", "6+"],
    "Do you have allergies or dietary restrictions?": ["Yes", "No"],
    "How often do you shop for groceries?": ["Daily", "Weekly", "Bi-weekly", "Monthly"]
  };
  
  if (responses[question.question_text]) {
    return getRandomItem(responses[question.question_text]);
  }
  
  // For money questions
  if (question.type === 'money') {
    return getRandomNumber(50, 300).toString();
  }
  
  return "Sample response";
};

const generateWeeklySurveyResponse = (question) => {
  const responses = {
    "How many times did you go food shopping this week?": ["0", "1", "2", "3", "4", "5", "6+"],
    "How many times did you eat leftovers this week?": ["0", "1", "2", "3", "4", "5", "6+"],
    "How many meals that you didn't finish did you throw out?": ["0", "1", "2", "3", "4", "5", "6+"],
    "Do you think you wasted less food compared to last week?": ["Yes", "No", "I'm not sure"],
    "Are you becoming more aware of your amount of food waste/consumption habits?": ["Yes", "No", "I'm not sure"],
    "Do you often throw away leftover food?": ["Yes", "No", "Sometimes"]
  };
  
  if (responses[question.question_text]) {
    return getRandomItem(responses[question.question_text]);
  }
  
  // For number questions
  if (question.type === 'number') {
    return getRandomNumber(7, 21).toString();
  }
  
  return "Sample weekly response";
};

const generateFinalSurveyResponse = (question) => {
  const responses = {
    "Did you feel a significant difference in your food waste amounts on a scale of 1-5?": [
      "1: This app did not help in any way",
      "2: I felt a slight difference but not a significant one", 
      "3: I feel indifference, I didn't feel a change",
      "4: This app helped me a lot and I felt a difference",
      "5: This app was life changing and I felt a significant difference"
    ],
    "Are you more aware of what you consumed compared to what you bought while food shopping on a scale of 1-5?": [
      "1: I did not feel any difference, if anything the opposite",
      "2: I felt a slight difference but not a significant one",
      "3: I feel indifference, I didn't feel a change", 
      "4: This app helped me a lot and I felt a difference",
      "5: This app was life changing and I felt a significant difference"
    ],
    "Do you buy less food at the supermarket?": ["Yes, definitely", "I'm not sure", "No"],
    "Does it now bother you when you see others waste food after gaining the amount of knowledge and awareness you did through this app?": ["Yes, definitely", "I'm not sure", "No"],
    "Would you want to continue using this app?": ["Yes, definitely", "I'm not sure", "No"],
    "Was this app helpful?": ["Yes, definitely", "I'm not sure", "No"]
  };
  
  if (responses[question.question_text]) {
    return getRandomItem(responses[question.question_text]);
  }
  
  return "Sample final response";
};

const generateDefaultResponse = (question) => {
  return "Sample response";
};

// Generate fake streak data for a user
export const generateFakeStreakData = async (userId) => {
  console.log(`Generating fake streak data for user ${userId}...`);
  
  try {
    // Generate realistic streak data
    const currentStreak = getRandomNumber(0, 14); // 0-14 day current streak
    const longestStreak = Math.max(currentStreak, getRandomNumber(1, 30)); // Longest streak is at least current streak
    const totalCompletions = getRandomNumber(5, 50); // 5-50 total completions
    
    // Calculate last completion date based on current streak
    let lastCompletionDate = null;
    if (currentStreak > 0) {
      // If they have a current streak, last completion was recent
      const daysAgo = getRandomNumber(0, currentStreak - 1);
      lastCompletionDate = new Date();
      lastCompletionDate.setDate(lastCompletionDate.getDate() - daysAgo);
    } else {
      // If no current streak, last completion was some time ago
      const daysAgo = getRandomNumber(1, 30);
      lastCompletionDate = new Date();
      lastCompletionDate.setDate(lastCompletionDate.getDate() - daysAgo);
    }
    
    // Insert or update user streak data
    const query = `
      INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_completion_date, total_completions, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        current_streak = $2,
        longest_streak = $3,
        last_completion_date = $4,
        total_completions = $5,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userId,
      currentStreak,
      longestStreak,
      lastCompletionDate,
      totalCompletions
    ]);
    
    const streakData = result.rows[0];
    console.log(`Generated streak data for user ${userId}: current=${currentStreak}, longest=${longestStreak}, total=${totalCompletions}`);
    
    return streakData;
  } catch (error) {
    console.error(`Error generating fake streak data for user ${userId}:`, error);
    throw error;
  }
};

// Main function to generate all fake data for a user
export const generateFakeDataForUser = async (userId) => {
  console.log(`Generating complete fake data for user ${userId}...`);
  
  try {
    // Generate purchases
    const purchases = await generateFakePurchases(userId, 4);
    
    // Generate consumption logs
    const consumptionLogs = await generateFakeConsumptionLogs(userId, purchases);
    
    // Generate survey responses
    const surveyResponses = await generateFakeSurveyResponses(userId);
    
    // Generate streak data
    const streakData = await generateFakeStreakData(userId);
    
    return {
      purchases,
      consumptionLogs,
      surveyResponses,
      streakData
    };
  } catch (error) {
    console.error(`Error generating fake data for user ${userId}:`, error);
    throw error;
  }
};

// Main function to generate fake users with all their data
export const generateFakeUsersWithData = async (count = 5) => {
  console.log(`Generating ${count} fake users with complete data...`);
  
  try {
    // Generate fake users
    const users = await generateFakeUsers(count);
    
    if (users.length === 0) {
      throw new Error('No users were created. Check database connection and schema.');
    }
    
    // Generate data for each user
    const results = [];
    for (const user of users) {
      try {
        console.log(`Generating data for user ${user.username} (ID: ${user.id})...`);
        const userData = await generateFakeDataForUser(user.id);
        results.push({
          user,
          ...userData
        });
        console.log(`✅ Completed data generation for user ${user.username}`);
      } catch (userError) {
        console.error(`❌ Error generating data for user ${user.username}:`, userError);
        // Continue with other users even if one fails
        results.push({
          user,
          purchases: [],
          consumptionLogs: [],
          surveyResponses: [],
          streakData: null
        });
      }
    }
    
    console.log(`Successfully generated fake data for ${results.length} users`);
    return results;
  } catch (error) {
    console.error('Error generating fake users with data:', error);
    throw error;
  }
};

// Function to clean up all fake users and their data
export const cleanupFakeUsers = async () => {
  console.log('Cleaning up all fake users and their data...');
  
  try {
    // Delete all users with username starting with 'DummyUser'
    // This will cascade delete all associated data including streaks due to foreign key constraints
    const result = await pool.query(`
      DELETE FROM users 
      WHERE username LIKE 'DummyUser%'
      RETURNING id, username
    `);
    
    console.log(`Deleted ${result.rows.length} fake users and all their associated data (including streaks)`);
    return result.rows;
  } catch (error) {
    console.error('Error cleaning up fake users:', error);
    throw error;
  }
};

// Function to get count of fake users
export const getFakeUsersCount = async () => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE username LIKE 'DummyUser%'
    `);
    
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error getting fake users count:', error);
    throw error;
  }
};

// Generate trending data for a specific user from a start date to today
// Shows progression from junk food + high waste to healthy food + low waste
export const generateTrendingDataForUser = async (username, startDate) => {
  console.log('========================================');
  console.log(`🚀 STARTING TRENDING DATA GENERATION`);
  console.log(`📅 User: ${username}`);
  console.log(`📅 Start Date: ${startDate}`);
  console.log(`📅 End Date: ${new Date().toISOString().split('T')[0]}`);
  console.log('========================================');
  
  try {
    // First, check if user exists
    console.log(`\n🔍 Step 1: Checking if user "${username}" exists...`);
    let userResult = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    let userId;
    
    if (userResult.rows.length === 0) {
      // Create the user if it doesn't exist
      console.log(`   ❌ User not found`);
      console.log(`   🔐 Creating user with password 'testtest'...`);
      const password = 'testtest';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const createUserQuery = `
        INSERT INTO users (username, password_hash, terms_accepted_at, terms_accepted_version)
        VALUES ($1, $2, CURRENT_TIMESTAMP, '1.0')
        RETURNING id
      `;
      
      const newUserResult = await pool.query(createUserQuery, [username, hashedPassword]);
      userId = newUserResult.rows[0].id;
      console.log(`   ✅ Created user ${username} with ID: ${userId}`);
    } else {
      userId = userResult.rows[0].id;
      console.log(`   ✅ Found existing user with ID: ${userId}`);
      
      // Delete all existing data for this user
      console.log(`\n🗑️  Step 2: Cleaning up existing data for user...`);
      
      // Delete consumption logs (will be deleted via cascade, but doing it explicitly for logging)
      const deletedLogs = await pool.query('DELETE FROM consumption_logs WHERE user_id = $1', [userId]);
      console.log(`   ✅ Deleted ${deletedLogs.rowCount} consumption logs`);
      
      // Delete purchases (this will cascade delete consumption_logs if not already deleted)
      const deletedPurchases = await pool.query('DELETE FROM purchases WHERE user_id = $1', [userId]);
      console.log(`   ✅ Deleted ${deletedPurchases.rowCount} purchases`);
      
      // Delete streak data
      const deletedStreaks = await pool.query('DELETE FROM user_streaks WHERE user_id = $1', [userId]);
      console.log(`   ✅ Deleted ${deletedStreaks.rowCount} streak records`);
      
      // Delete daily tasks
      const deletedTasks = await pool.query('DELETE FROM daily_tasks WHERE user_id = $1', [userId]);
      console.log(`   ✅ Deleted ${deletedTasks.rowCount} daily task records`);
      
      console.log(`   🎉 Cleanup complete! Ready for fresh data generation.`);
    }
    
    // Get categories and quantity types
    console.log(`\n📋 Step 3: Loading categories and quantity types...`);
    const categoriesResult = await pool.query('SELECT id, name FROM categories');
    const quantityTypesResult = await pool.query('SELECT id, name FROM quantity_types');
    
    let categories = categoriesResult.rows;
    const quantityTypes = quantityTypesResult.rows;
    
    if (categories.length === 0 || quantityTypes.length === 0) {
      throw new Error('Categories or quantity types not found in database');
    }
    console.log(`   ✅ Loaded ${categories.length} categories and ${quantityTypes.length} quantity types`);
    
    // Ensure "Meals" category exists
    let mealsCategory = categories.find(c => c.name === 'Meals');
    if (!mealsCategory) {
      console.log(`   📝 Creating "Meals" category...`);
      const newCategoryResult = await pool.query(
        'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name',
        ['Meals']
      );
      if (newCategoryResult.rows.length > 0) {
        mealsCategory = newCategoryResult.rows[0];
        categories.push(mealsCategory);
        console.log(`   ✅ Created "Meals" category with ID: ${mealsCategory.id}`);
      } else {
        // If conflict occurred, fetch it
        const fetchResult = await pool.query('SELECT id, name FROM categories WHERE name = $1', ['Meals']);
        mealsCategory = fetchResult.rows[0];
        categories.push(mealsCategory);
        console.log(`   ✅ Found existing "Meals" category with ID: ${mealsCategory.id}`);
      }
    } else {
      console.log(`   ✅ "Meals" category already exists with ID: ${mealsCategory.id}`);
    }
    
    // Parse start date and calculate days
    console.log(`\n📊 Step 4: Calculating date range...`);
    const start = new Date(startDate);
    const today = new Date();
    const totalDays = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
    
    console.log(`   📅 Total days: ${totalDays}`);
    
    // Define meal options as completely new food items
    console.log(`\n🍔 Step 5: Defining meal options...`);
    
    const junkFoodMeals = [
      // Unhealthy/junk food options
      { name: "Hamburger Meal", category: "Meals", price: 11 },
      { name: "Cheeseburger Meal", category: "Meals", price: 10 },
      { name: "Large Pizza", category: "Meals", price: 16 },
      { name: "Pizza Slices", category: "Meals", price: 9 },
      { name: "Chicken Tenders Meal", category: "Meals", price: 12 },
      { name: "Fried Chicken Tenders", category: "Meals", price: 10 },
      { name: "Bagel with Cream Cheese", category: "Meals", price: 5 },
      { name: "Large Soda", category: "Meals", price: 3 },
      { name: "Pizza Combo", category: "Meals", price: 13 },
    ];
    
    const healthyMeals = [
      // Healthy food options
      { name: "Caesar Salad", category: "Meals", price: 9 },
      { name: "Caesar Salad with Chicken", category: "Meals", price: 12 },
      { name: "Caesar Wrap", category: "Meals", price: 10 },
      { name: "Grilled Chicken Breast", category: "Meals", price: 13 },
      { name: "Grilled Chicken Bowl", category: "Meals", price: 15 },
      { name: "Fresh Fruit Bowl", category: "Meals", price: 7 },
      { name: "Mixed Fruit Plate", category: "Meals", price: 6 },
      { name: "Avocado Toast", category: "Meals", price: 8 },
      { name: "Fresh Avocado", category: "Meals", price: 4 },
      { name: "Fresh Squeezed Lemonade", category: "Meals", price: 4 },
      { name: "Fruit Bowl with Lemonade", category: "Meals", price: 9 },
    ];
    
    const moderateMeals = [
      // Moderate options
      { name: "Grilled Steak", category: "Meals", price: 17 },
      { name: "Steak with Grits", category: "Meals", price: 19 },
      { name: "Bagel Sandwich", category: "Meals", price: 7 },
      { name: "Chicken Caesar Wrap", category: "Meals", price: 11 },
      { name: "Grilled Chicken", category: "Meals", price: 12 },
      { name: "Steak Dinner", category: "Meals", price: 20 },
    ];
    
    // Define large meals (expensive/heavy meals)
    const largeMeals = [
      "Large Pizza",
      "Pizza Combo",
      "Grilled Chicken Bowl",
      "Grilled Steak",
      "Steak with Grits",
      "Steak Dinner",
      "Chicken Tenders Meal"
    ];
    
    // Define drinks (can't be the only item on a day)
    const drinks = [
      "Large Soda",
      "Fresh Squeezed Lemonade"
    ];
    
    console.log(`   🍔 Junk food meals: ${junkFoodMeals.length}`);
    console.log(`   🥗 Healthy meals: ${healthyMeals.length}`);
    console.log(`   🍽️  Moderate meals: ${moderateMeals.length}`);
    
    const purchases = [];
    const purchaseValues = [];
    
    // Generate purchases for each day (prepare batch data)
    console.log(`\n🛒 Step 6: Generating purchase data...`);
    console.log(`   ⏳ Processing ${totalDays} days (2-4 purchases per day)...`);
    
    let progressMilestone = Math.floor(totalDays / 10);
    for (let day = 0; day < totalDays; day++) {
      // Log progress every 10%
      if (progressMilestone > 0 && day % progressMilestone === 0) {
        const percent = Math.floor((day / totalDays) * 100);
        console.log(`   📊 Progress: ${percent}% (${day}/${totalDays} days)`);
      }
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + day);
      
      // Calculate progression ratio (0 = start, 1 = end)
      const progression = day / totalDays;
      
      // Determine number of purchases for this day (1-2 per day for a light eater)
      // Some days might have no purchases (skipped meals/eating out not tracked)
      const rand = Math.random();
      let purchasesPerDay;
      if (rand < 0.05) {
        purchasesPerDay = 0; // 5% chance of no logged purchases that day
      } else if (rand < 0.55) {
        purchasesPerDay = 1; // 50% chance of 1 meal
      } else {
        purchasesPerDay = 2; // 45% chance of 2 meals
      }
      
      let hasLargeMeal = false;
      let hasNonDrink = false; // Track if we have at least one non-drink meal
      
      for (let p = 0; p < purchasesPerDay; p++) {
        let meal;
        let attempts = 0;
        const maxAttempts = 30; // Prevent infinite loops
        
        // Keep trying until we get a valid meal
        while (attempts < maxAttempts) {
          // Early days: 70% junk food, 20% moderate, 10% healthy
          // Late days: 10% junk food, 20% moderate, 70% healthy
          const junkProbability = 0.7 - (progression * 0.6); // 0.7 -> 0.1
          const healthyProbability = 0.1 + (progression * 0.6); // 0.1 -> 0.7
          
          const mealRand = Math.random();
          if (mealRand < junkProbability) {
            meal = getRandomItem(junkFoodMeals);
          } else if (mealRand < junkProbability + 0.2) {
            meal = getRandomItem(moderateMeals);
          } else {
            meal = getRandomItem(healthyMeals);
          }
          
          const isLargeMeal = largeMeals.includes(meal.name);
          const isDrink = drinks.includes(meal.name);
          
          // Rule 1: Can't have two large meals on the same day
          if (isLargeMeal && hasLargeMeal) {
            attempts++;
            continue; // Try again
          }
          
          // Rule 2: Can't have just a drink (if this is the only purchase and it's a drink)
          if (purchasesPerDay === 1 && isDrink) {
            attempts++;
            continue; // Try again
          }
          
          // Rule 3: If this is the last purchase and we don't have any non-drink meals yet, can't add a drink
          if (p === purchasesPerDay - 1 && !hasNonDrink && isDrink) {
            attempts++;
            continue; // Try again - must have at least one non-drink meal
          }
          
          // Valid meal found
          break;
        }
        
        // If we couldn't find a valid meal after max attempts, skip this purchase
        if (attempts >= maxAttempts) {
          continue;
        }
        
        // Track state for next iteration
        if (largeMeals.includes(meal.name)) {
          hasLargeMeal = true;
        }
        if (!drinks.includes(meal.name)) {
          hasNonDrink = true;
        }
        
        // All meals use the "Meals" category
        const category = categories.find(c => c.name === 'Meals');
        
        if (!category) {
          console.warn(`   ⚠️ Meals category not found, skipping ${meal.name}`);
          continue;
        }
        
        // Meals are typically purchased as 1 serving
        const quantity = 1;
        
        // Add slight price variation (±2 dollars) and round to whole number
        const priceVariation = getRandomNumber(-2, 2);
        const price = Math.max(1, meal.price + priceVariation);
        
        // Add some randomness to the time of day (meal times: breakfast, lunch, dinner)
        const purchaseDateTime = new Date(currentDate);
        const mealTimeOptions = [
          getRandomNumber(7, 9),   // Breakfast
          getRandomNumber(11, 14), // Lunch
          getRandomNumber(17, 20)  // Dinner
        ];
        purchaseDateTime.setHours(getRandomItem(mealTimeOptions), getRandomNumber(0, 59), 0, 0);
        
        purchaseValues.push({
          userId,
          name: meal.name,
          category: meal.category,
          categoryId: category.id,
          quantity,
          price,
          quantityType: 'Each',
          purchaseDate: purchaseDateTime,
          progression
        });
      }
    }
    
    console.log(`   ✅ Generated ${purchaseValues.length} purchase records`);
    
    // Batch insert purchases (20 at a time for better performance)
    console.log(`\n💾 Step 7: Inserting purchases into database...`);
    console.log(`   📦 Total purchases: ${purchaseValues.length}`);
    console.log(`   📦 Batch size: 20`);
    
    const batchSize = 20;
    const totalBatches = Math.ceil(purchaseValues.length / batchSize);
    
    for (let i = 0; i < purchaseValues.length; i += batchSize) {
      const batchNum = Math.floor(i / batchSize) + 1;
      const batch = purchaseValues.slice(i, i + batchSize);
      const values = [];
      const placeholders = [];
      
      batch.forEach((p, idx) => {
        const offset = idx * 8;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);
        values.push(p.userId, p.name, p.category, p.categoryId, p.quantity, p.price, p.quantityType, p.purchaseDate);
      });
      
      const query = `
        INSERT INTO purchases (user_id, name, category, category_id, quantity, price, quantity_type, purchase_date)
        VALUES ${placeholders.join(', ')}
        RETURNING id
      `;
      
      const result = await pool.query(query, values);
      
      // Store purchase IDs with metadata
      result.rows.forEach((row, idx) => {
        const purchaseData = batch[idx];
        purchases.push({
          id: row.id,
          name: purchaseData.name,
          category: purchaseData.category,
          quantity: purchaseData.quantity,
          price: purchaseData.price,
          purchaseDate: purchaseData.purchaseDate,
          progression: purchaseData.progression
        });
      });
      
      console.log(`   ✅ Batch ${batchNum}/${totalBatches} complete (${batch.length} purchases)`);
    }
    
    console.log(`   🎉 All ${purchases.length} purchases inserted successfully!`);
    
    // Now generate consumption logs with trending waste patterns
    console.log(`\n🗑️ Step 8: Generating consumption/waste logs...`);
    console.log(`   ⏳ Processing ${purchases.length} purchases (2-4 logs each)...`);
    
    const logs = [];
    const logValues = [];
    
    const logProgressMilestone = Math.floor(purchases.length / 10);
    for (let idx = 0; idx < purchases.length; idx++) {
      const purchase = purchases[idx];
      
      // Log progress every 10%
      if (logProgressMilestone > 0 && idx % logProgressMilestone === 0) {
        const percent = Math.floor((idx / purchases.length) * 100);
        console.log(`   📊 Progress: ${percent}% (${idx}/${purchases.length} purchases)`);
      }
      const progression = purchase.progression;
      
      // Calculate waste probability with trend: Start ~30%, trend to ~10%, then to ~0%
      // Use progression to create downward trend
      const purchaseDate = new Date(purchase.purchaseDate);
      const daysSinceStart = Math.floor((purchaseDate - start) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.floor(daysSinceStart / 7);
      
      // Create trend: Start at 30%, trend to 10% in middle, then to 0% at end
      // Use a curve that drops faster early, plateaus in middle, then drops at end
      let baseWasteProbability;
      if (progression < 0.3) {
        // First 30% of timeline: Drop from 30% to ~15% (faster initial drop)
        const earlyProgression = progression / 0.3;
        baseWasteProbability = 0.30 - (earlyProgression * 0.15); // 30% -> 15%
      } else if (progression < 0.75) {
        // Middle 45% of timeline: Trend from ~15% to ~10% (plateau around 10%)
        const midProgression = (progression - 0.3) / 0.45;
        baseWasteProbability = 0.15 - (midProgression * 0.05); // 15% -> 10%
      } else {
        // Last 25% of timeline: Drop from ~10% to ~0% (final improvement)
        const lateProgression = (progression - 0.75) / 0.25;
        baseWasteProbability = 0.10 - (lateProgression * 0.10); // 10% -> 0%
      }
      
      // Normal variation: ±5% around the base
      const normalVariation = (Math.random() - 0.5) * 0.10; // ±5% random variation
      const weeklyCycle = Math.sin(weekNumber * 0.5) * 0.03; // Small weekly cycle (±3%)
      
      // Occasional larger outliers (5% chance of ±10-15% spike)
      let outlierVariation = 0;
      if (Math.random() < 0.05) {
        // 5% chance of an outlier
        const outlierDirection = Math.random() < 0.5 ? -1 : 1; // Can be high or low
        const outlierMagnitude = 0.10 + Math.random() * 0.05; // 10-15% outlier
        outlierVariation = outlierDirection * outlierMagnitude;
      }
      
      baseWasteProbability += normalVariation + weeklyCycle + outlierVariation;
      
      // Adjust based on food category (smaller adjustments since base is low)
      if (purchase.category === 'Fast Food' || purchase.category === 'Snacks') {
        baseWasteProbability += 0.02; // Slightly more waste for junk food
      } else if (purchase.category === 'Fruits' || purchase.category === 'Vegetables') {
        baseWasteProbability -= 0.01; // Slightly less waste for healthy food
      }
      
      // Clamp between 0% and 35% (allows for outliers, with 30% as typical ceiling early on)
      baseWasteProbability = Math.max(0.0, Math.min(0.35, baseWasteProbability));
      
      // Generate 1-2 consumption events per purchase (light eater, smaller portions)
      const eventsCount = getRandomNumber(1, 2);
      let remainingQuantity = purchase.quantity;
      
      for (let e = 0; e < eventsCount && remainingQuantity > 0; e++) {
        const isLastEvent = e === eventsCount - 1;
        
        // Add some randomness to waste probability (reduced variation for cleaner trend)
        const wasteProbability = baseWasteProbability + (Math.random() - 0.5) * 0.1;
        const action = Math.random() < wasteProbability ? 'wasted' : 'consumed';
        
        // For the last event, consume/waste whatever is left
        const quantity = isLastEvent ? remainingQuantity : Math.max(0.1, remainingQuantity * (0.2 + Math.random() * 0.4));
        remainingQuantity -= quantity;
        
        const percentage = (quantity / purchase.quantity) * 100;
        const costValue = (quantity / purchase.quantity) * purchase.price;
        
        // Log at varied times after purchase
        const loggedAt = new Date(purchase.purchaseDate);
        
        // Add random days (0-4 days after purchase)
        const daysAfter = getRandomNumber(0, 4);
        loggedAt.setDate(loggedAt.getDate() + daysAfter);
        
        // Vary the time of day more randomly
        // Could be morning (6-10am), midday (10am-3pm), afternoon (3-7pm), or evening (7-11pm)
        const timeSlots = [
          [6, 10],   // Morning
          [10, 15],  // Midday
          [15, 19],  // Afternoon
          [19, 23]   // Evening
        ];
        const selectedSlot = getRandomItem(timeSlots);
        const hour = getRandomNumber(selectedSlot[0], selectedSlot[1]);
        const minute = getRandomNumber(0, 59);
        
        loggedAt.setHours(hour, minute, 0, 0);
        
        logValues.push({
          userId,
          purchaseId: purchase.id,
          action,
          quantity,
          percentage,
          costValue,
          loggedAt
        });
      }
    }
    
    console.log(`   ✅ Generated ${logValues.length} consumption/waste log records`);
    
    // Batch insert consumption logs (50 at a time)
    console.log(`\n💾 Step 9: Inserting consumption logs into database...`);
    console.log(`   📦 Total logs: ${logValues.length}`);
    console.log(`   📦 Batch size: 50`);
    
    const logBatchSize = 50;
    const totalLogBatches = Math.ceil(logValues.length / logBatchSize);
    
    for (let i = 0; i < logValues.length; i += logBatchSize) {
      const batchNum = Math.floor(i / logBatchSize) + 1;
      const batch = logValues.slice(i, i + logBatchSize);
      const values = [];
      const placeholders = [];
      
      batch.forEach((log, idx) => {
        const offset = idx * 8;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);
        values.push(log.userId, log.purchaseId, log.action, log.quantity, 'Each', log.percentage, log.costValue, log.loggedAt);
      });
      
      const query = `
        INSERT INTO consumption_logs (user_id, purchase_id, action, quantity, quantity_type, percentage, cost_value, logged_at)
        VALUES ${placeholders.join(', ')}
        RETURNING id
      `;
      
      const result = await pool.query(query, values);
      
      result.rows.forEach((row, idx) => {
        const logData = batch[idx];
        logs.push({
          id: row.id,
          purchaseId: logData.purchaseId,
          action: logData.action,
          quantity: logData.quantity,
          percentage: logData.percentage,
          costValue: logData.costValue,
          loggedAt: logData.loggedAt
        });
      });
      
      console.log(`   ✅ Batch ${batchNum}/${totalLogBatches} complete (${batch.length} logs)`);
    }
    
    console.log(`   🎉 All ${logs.length} consumption logs inserted successfully!`);
    
    // Calculate statistics
    const wastedLogs = logs.filter(log => log.action === 'wasted').length;
    const consumedLogs = logs.filter(log => log.action === 'consumed').length;
    const wasteRate = ((wastedLogs / logs.length) * 100).toFixed(1);
    
    console.log(`\n✅ GENERATION COMPLETE!`);
    console.log('========================================');
    console.log(`📊 Summary:`);
    console.log(`   👤 User: ${username} (ID: ${userId})`);
    console.log(`   🛒 Total Purchases: ${purchases.length}`);
    console.log(`   📝 Total Logs: ${logs.length}`);
    console.log(`   ✅ Consumed: ${consumedLogs} (${(100 - parseFloat(wasteRate)).toFixed(1)}%)`);
    console.log(`   🗑️  Wasted: ${wastedLogs} (${wasteRate}%)`);
    console.log(`   📅 Date Range: ${startDate} to ${today.toISOString().split('T')[0]}`);
    console.log('========================================\n');
    
    return {
      userId,
      purchases: purchases.length,
      consumptionLogs: logs.length,
      startDate: startDate,
      endDate: today.toISOString().split('T')[0]
    };
  } catch (error) {
    console.error(`\n❌ ERROR generating trending data for user ${username}:`);
    console.error(error);
    throw error;
  }
};