const mongoose = require('mongoose');
const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configuration
const TEST_ATTEMPT_ID = '68052fa49f3564a83d8245ba';
const TEST_ID = '6804a446b79c670a2444e3e8';
const USER_ID = 'shdjxWo1rcWwfGxbgReD7fOWMV52';

async function fixTestAttempt() {
  try {
    // 1. Get the test attempt
    const testAttempt = await TestAttempt.findById(TEST_ATTEMPT_ID);
    if (!testAttempt) {
      console.error('Test attempt not found');
      return;
    }
    console.log('Found test attempt:', testAttempt);

    // 2. Get the test
    const test = await Test.findById(TEST_ID);
    if (!test) {
      console.error('Test not found');
      return;
    }
    console.log('Found test:', { id: test._id, title: test.title });

    // 3. Calculate correct answers and score
    let correctCount = 0;
    const totalQuestions = test.questions.length;
    
    for (const question of test.questions) {
      const userAnswer = testAttempt.answers.get(question._id.toString());
      
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

    // 4. Update the test attempt
    testAttempt.status = 'completed';
    testAttempt.score = score;
    testAttempt.correctAnswers = correctCount;
    testAttempt.passed = passed;
    testAttempt.completedAt = testAttempt.completedAt || new Date();
    
    await testAttempt.save();
    console.log('Test attempt updated successfully!');

    // 5. Verify the update
    const updatedAttempt = await TestAttempt.findById(TEST_ATTEMPT_ID);
    console.log('Updated test attempt:', updatedAttempt);
  } catch (error) {
    console.error('Error fixing test attempt:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run the function
fixTestAttempt(); 