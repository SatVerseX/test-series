const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_ID = '6804a446b79c670a2444e3e8';
const USER_ID = 'shdjxWo1rcWwfGxbgReD7fOWMV52';

// Function to update test attempt status to completed
async function updateAttemptStatus() {
  try {
    // 1. First try updating the status
    const statusResponse = await axios.put(
      `${BASE_URL}/tests/${TEST_ID}/attempts/${USER_ID}/update-status`,
      { status: 'completed' }
    );
    console.log('Status update response:', statusResponse.data);

    // 2. Then trigger score recalculation
    const scoreResponse = await axios.put(
      `${BASE_URL}/tests/${TEST_ID}/attempts/${USER_ID}/update-score`,
      { 
        score: null,  // Let the server calculate the score
        correctAnswers: null,  // Let the server calculate the correct answers
        passed: null  // Let the server determine if passed
      }
    );
    console.log('Score update response:', scoreResponse.data);

    console.log('Test attempt fixed successfully!');
  } catch (error) {
    console.error('Error fixing test attempt:', error.response?.data || error.message);
  }
}

// Run the function
updateAttemptStatus();

// Note: Run this script with:
// node frontend/src/fixTestAttempt.js 