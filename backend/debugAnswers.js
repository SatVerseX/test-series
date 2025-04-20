// Script to debug answer comparison
// Run with: node backend/debugAnswers.js

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// Test Attempt details
const TEST_ATTEMPT_ID = '68052fa49f3564a83d8245ba';
const TEST_ID = '6804a446b79c670a2444e3e8';

async function debugAnswers() {
  // Get MongoDB URI from environment variables
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MongoDB URI not found in environment variables');
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Select database and collection
    const dbName = uri.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    const testAttemptsCollection = db.collection('testattempts');
    const testsCollection = db.collection('tests');
    
    console.log(`Using database: ${dbName}`);

    // 1. Get the test attempt
    const testAttempt = await testAttemptsCollection.findOne({ _id: new ObjectId(TEST_ATTEMPT_ID) });
    if (!testAttempt) {
      console.error('Test attempt not found');
      return;
    }
    console.log('Found test attempt with answers for', Object.keys(testAttempt.answers).length, 'questions');

    // 2. Get the test with questions
    const test = await testsCollection.findOne({ _id: new ObjectId(TEST_ID) });
    if (!test) {
      console.error('Test not found');
      return;
    }
    console.log('Found test:', test.title, 'with', test.questions.length, 'questions');

    // 3. Debug the answers comparison
    console.log('\nDEBUGGING ANSWERS:');
    console.log('==================');
    
    for (const question of test.questions) {
      const questionId = question._id.toString();
      const userAnswer = testAttempt.answers[questionId];
      const correctAnswer = question.correctAnswer;
      
      console.log(`\nQuestion ${questionId} (${question.type}):`);
      console.log(`Question Text: ${question.text.slice(0, 50)}...`);
      console.log(`User's Answer: ${userAnswer}`);
      console.log(`Correct Answer: ${correctAnswer}`);
      
      let isCorrect = false;
      
      if (userAnswer) {
        if (question.type === 'mcq' || question.type === 'trueFalse') {
          isCorrect = userAnswer === correctAnswer;
          console.log(`Match Test: ${userAnswer} === ${correctAnswer} => ${isCorrect}`);
          
          // Debug the exact format and data type
          console.log(`User Answer Type: ${typeof userAnswer}, Length: ${userAnswer.length}`);
          console.log(`Correct Answer Type: ${typeof correctAnswer}, Length: ${correctAnswer.length}`);
          console.log(`Hex Values - User: ${Buffer.from(userAnswer).toString('hex')}`);
          console.log(`Hex Values - Correct: ${Buffer.from(correctAnswer).toString('hex')}`);
          
        } else if (question.type === 'shortAnswer') {
          const normalizedUserAnswer = userAnswer.toLowerCase().trim();
          const normalizedCorrectAnswer = correctAnswer.toLowerCase().trim();
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
          console.log(`Match Test (normalized): ${normalizedUserAnswer} === ${normalizedCorrectAnswer} => ${isCorrect}`);
          
        } else if (question.type === 'integer') {
          const parsedUserAnswer = parseInt(userAnswer);
          const parsedCorrectAnswer = parseInt(correctAnswer);
          isCorrect = parsedUserAnswer === parsedCorrectAnswer;
          console.log(`Match Test (parsed): ${parsedUserAnswer} === ${parsedCorrectAnswer} => ${isCorrect}`);
        }
      } else {
        console.log('No user answer provided');
      }
      
      console.log(`Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
      
      // If there are options, print them
      if (question.options && question.options.length > 0) {
        console.log('Available Options:');
        question.options.forEach((option, idx) => {
          const optionObj = typeof option === 'object' ? option : { text: option, _id: `option_${idx}` };
          console.log(`- [${optionObj._id}] ${optionObj.text}`);
        });
      }
    }

    console.log('\nDEBUG COMPLETE: Check the answer comparison results above.');

  } catch (error) {
    console.error('Error debugging answers:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

debugAnswers().catch(console.error); 