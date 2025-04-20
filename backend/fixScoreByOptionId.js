// Script to fix test score by comparing option IDs
// Run with: node backend/fixScoreByOptionId.js

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// Test Attempt details
const TEST_ATTEMPT_ID = '68052fa49f3564a83d8245ba';
const TEST_ID = '6804a446b79c670a2444e3e8';

async function fixScoreByOptionId() {
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

    // 3. Calculate score by comparing option IDs instead of answer text
    let correctCount = 0;
    const totalQuestions = test.questions.length;
    
    console.log('\nCalculating score based on option IDs:');
    console.log('====================================');
    
    for (const question of test.questions) {
      const questionId = question._id.toString();
      const userAnswer = testAttempt.answers[questionId];
      let isCorrect = false;
      
      if (userAnswer && question.options && question.options.length > 0) {
        // Find the option that matches the correct answer text
        const correctOption = question.options.find(opt => 
          (typeof opt === 'object' && opt.text === question.correctAnswer) ||
          (typeof opt === 'string' && opt === question.correctAnswer)
        );
        
        if (correctOption) {
          const correctOptionId = typeof correctOption === 'object' ? 
            correctOption._id.toString() : correctOption;
          
          // Compare user's answer (option ID) with correct option ID
          isCorrect = userAnswer === correctOptionId;
          
          console.log(`\nQuestion: ${question.text.slice(0, 30)}...`);
          console.log(`User Answer (ID): ${userAnswer}`);
          console.log(`Correct Option (ID): ${correctOptionId}`);
          console.log(`Match Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
          
          if (isCorrect) {
            correctCount++;
          }
        } else {
          console.log(`\nQuestion: ${question.text.slice(0, 30)}...`);
          console.log(`WARNING: Could not find option matching correct answer: ${question.correctAnswer}`);
        }
      } else {
        console.log(`\nQuestion: ${question.text.slice(0, 30)}...`);
        console.log('No user answer or no options available');
      }
    }
    
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= (test.passingScore || 0);
    
    console.log('\nCalculation results:');
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
    console.error('Error fixing score:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

fixScoreByOptionId().catch(console.error); 