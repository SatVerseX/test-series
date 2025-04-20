// Direct MongoDB update script to update the test score
// Run with: node backend/updateScore.js

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// Test Attempt details
const TEST_ATTEMPT_ID = '68052fa49f3564a83d8245ba';
const TEST_ID = '6804a446b79c670a2444e3e8';

// We'll calculate the score based on the answers
async function updateScore() {
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

    // 3. Calculate score
    let correctCount = 0;
    const totalQuestions = test.questions.length;
    
    for (const question of test.questions) {
      const userAnswer = testAttempt.answers[question._id.toString()];
      
      if (userAnswer) {
        if (question.type === 'mcq' || question.type === 'trueFalse') {
          if (userAnswer === question.correctAnswer) {
            correctCount++;
          }
        } else if (question.type === 'shortAnswer') {
          if (userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
            correctCount++;
          }
        } else if (question.type === 'integer') {
          if (parseInt(userAnswer) === parseInt(question.correctAnswer)) {
            correctCount++;
          }
        }
      }
    }
    
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= (test.passingScore || 0);
    
    console.log('Calculation results:');
    console.log(`- Total questions: ${totalQuestions}`);
    console.log(`- Correct answers: ${correctCount}`);
    console.log(`- Score: ${score}%`);
    console.log(`- Passed: ${passed}`);

    // 4. Update the test attempt with the calculated score
    const updateResult = await testAttemptsCollection.updateOne(
      { _id: new ObjectId(TEST_ATTEMPT_ID) },
      { 
        $set: { 
          score: score,
          correctAnswers: correctCount,
          passed: passed
        }
      }
    );
    
    console.log(`Score update result: ${updateResult.modifiedCount} document(s) modified`);

    // 5. Get the updated document to verify
    const updatedAttempt = await testAttemptsCollection.findOne({ _id: new ObjectId(TEST_ATTEMPT_ID) });
    console.log('Final updated attempt:', {
      _id: updatedAttempt._id.toString(),
      status: updatedAttempt.status,
      score: updatedAttempt.score,
      correctAnswers: updatedAttempt.correctAnswers,
      passed: updatedAttempt.passed,
      completedAt: updatedAttempt.completedAt
    });

    console.log('\nFIX COMPLETE: The test attempt score has been updated.');
    console.log(`Score: ${score}%, Correct Answers: ${correctCount}, Passed: ${passed}`);

  } catch (error) {
    console.error('Error updating test score:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

updateScore().catch(console.error); 