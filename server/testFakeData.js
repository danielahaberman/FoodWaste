// @ts-nocheck
// testFakeData.js - Test script for fake data generation
import { 
  generateFakeUsersWithData, 
  cleanupFakeUsers, 
  getFakeUsersCount 
} from './fakeDataGenerator.js';

async function testFakeDataGeneration() {
  console.log('🧪 Testing Fake Data Generation System');
  console.log('=====================================\n');
  
  try {
    // Check current fake users count
    console.log('1. Checking current fake users count...');
    const initialCount = await getFakeUsersCount();
    console.log(`   Current fake users: ${initialCount}\n`);
    
    // Generate fake users with data
    console.log('2. Generating 3 fake users with complete data...');
    const results = await generateFakeUsersWithData(3);
    
    console.log(`   ✅ Generated ${results.length} fake users:`);
    results.forEach((result, index) => {
      console.log(`   User ${index + 1}: ${result.user.username} (ID: ${result.user.id})`);
      console.log(`     - ${result.purchases.length} purchases`);
      console.log(`     - ${result.consumptionLogs.length} consumption logs`);
      console.log(`     - ${result.surveyResponses.length} survey responses`);
    });
    console.log('');
    
    // Check fake users count after generation
    console.log('3. Checking fake users count after generation...');
    const afterCount = await getFakeUsersCount();
    console.log(`   Fake users after generation: ${afterCount}\n`);
    
    // Clean up fake users
    console.log('4. Cleaning up all fake users and their data...');
    const deletedUsers = await cleanupFakeUsers();
    console.log(`   ✅ Deleted ${deletedUsers.length} fake users:`);
    deletedUsers.forEach(user => {
      console.log(`     - ${user.username} (ID: ${user.id})`);
    });
    console.log('');
    
    // Final count check
    console.log('5. Final fake users count check...');
    const finalCount = await getFakeUsersCount();
    console.log(`   Final fake users count: ${finalCount}\n`);
    
    console.log('🎉 Fake data generation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during fake data generation test:', error);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFakeDataGeneration()
    .then(() => {
      console.log('\nTest completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testFakeDataGeneration };
