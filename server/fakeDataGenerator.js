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
    
    return {
      purchases,
      consumptionLogs,
      surveyResponses
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
          surveyResponses: []
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
    const result = await pool.query(`
      DELETE FROM users 
      WHERE username LIKE 'DummyUser%'
      RETURNING id, username
    `);
    
    console.log(`Deleted ${result.rows.length} fake users and all their associated data`);
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
