/**
 * This script creates a patched version of TestResult.jsx that prioritizes server-side scoring.
 * Run with: node frontend/src/fixDisplay.js
 */

const fs = require('fs');
const path = require('path');

// Define file paths
const testResultPath = path.join(__dirname, 'pages', 'tests', 'TestResult.jsx');
const backupPath = path.join(__dirname, 'pages', 'tests', 'TestResult.jsx.bak');

// First, create a backup of the original file
try {
  fs.copyFileSync(testResultPath, backupPath);
  console.log(`✓ Backup created at ${backupPath}`);
} catch (error) {
  console.error('Error creating backup:', error);
  process.exit(1);
}

// Read the file
let content;
try {
  content = fs.readFileSync(testResultPath, 'utf8');
  console.log('✓ Original file read successfully');
} catch (error) {
  console.error('Error reading file:', error);
  process.exit(1);
}

// Find and patch the calculateStats function
const calculateStatsPattern = /const calculateStats = \(\) => \{[\s\S]+?return \{[\s\S]+?\};[\s\S]+?\};/;
const updatedCalculateStats = `const calculateStats = () => {
    if (!test || !attempt) return null;
    
    // PATCHED FUNCTION: First prioritize server-provided values
    if (attempt.status === 'completed' && 
        typeof attempt.score === 'number' && 
        typeof attempt.correctAnswers === 'number') {
      console.log('Using server-provided scores:', {
        score: attempt.score,
        correctAnswers: attempt.correctAnswers,
        passed: attempt.passed
      });
      
      const totalQuestions = test.questions.length;
      return {
        totalQuestions,
        totalMarks: test.totalMarks || totalQuestions,
        correctCount: attempt.correctAnswers,
        incorrectCount: totalQuestions - attempt.correctAnswers,
        unattemptedCount: 0,
        obtainedMarks: Math.round((attempt.score / 100) * (test.totalMarks || totalQuestions)),
        percentageScore: attempt.score,
        passed: attempt.passed
      };
    }
    
    // Original calculation logic as fallback
    const totalQuestions = test.questions.length;
    const totalMarks = test.totalMarks || test.questions.reduce((sum, q) => sum + q.marks, 0);
    
    const correctQuestions = test.questions.filter(q => {
      const userAnswer = attempt.answers[q._id];
      if (!userAnswer) return false;
      
      if (q.type === 'mcq' || q.type === 'trueFalse') {
        // PATCHED: Compare option IDs with correct option ID if available
        if (q.options && q.options.length > 0) {
          const correctOption = q.options.find(opt => 
            (typeof opt === 'object' && opt.text === q.correctAnswer) ||
            (typeof opt === 'string' && opt === q.correctAnswer)
          );
          
          if (correctOption) {
            const correctOptionId = typeof correctOption === 'object' ? 
              correctOption._id.toString() : correctOption;
            return userAnswer === correctOptionId;
          }
        }
        return userAnswer === q.correctAnswer;
      } else if (q.type === 'shortAnswer') {
        return userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
      } else if (q.type === 'integer') {
        return parseInt(userAnswer) === parseInt(q.correctAnswer);
      }
      return false;
    });
    
    const correctCount = correctQuestions.length;
    const incorrectCount = totalQuestions - correctCount;
    const obtainedMarks = correctQuestions.reduce((sum, q) => sum + q.marks, 0);
    const percentageScore = Math.round((obtainedMarks / totalMarks) * 100);
    const passed = percentageScore >= test.passingScore;
    
    return {
      totalQuestions,
      totalMarks,
      correctCount,
      incorrectCount,
      unattemptedCount: 0,
      obtainedMarks,
      percentageScore,
      passed
    };
  };`;

let updatedContent = content.replace(calculateStatsPattern, updatedCalculateStats);

// Update the fetchTestResult function to disable caching
const fetchTestResultPattern = /const fetchTestResult = async \(\) => \{[\s\S]+?setLoading\(true\);[\s\S]+?\/\/ Fetch test attempt data[\s\S]+?const attemptResponse = await api\.get\(`\/api\/tests\/\${testId}\/attempts\/\${user\.firebaseId}`\);/;
const updatedFetchTestResult = `const fetchTestResult = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Fetch test attempt data with cache-busting headers
        const attemptResponse = await api.get(
          \`/api/tests/\${testId}/attempts/\${user.firebaseId}\`,
          { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } }
        );`;

updatedContent = updatedContent.replace(fetchTestResultPattern, updatedFetchTestResult);

// Write the updated content back to the file
try {
  fs.writeFileSync(testResultPath, updatedContent);
  console.log('✓ TestResult.jsx has been successfully patched!');
  console.log('The component will now prioritize server-provided scores and use cache-busting headers.');
  console.log('Restart your frontend application to apply the changes.');
} catch (error) {
  console.error('Error writing to file:', error);
  console.log('Restoring from backup...');
  try {
    fs.copyFileSync(backupPath, testResultPath);
    console.log('Original file restored from backup.');
  } catch (restoreError) {
    console.error('Error restoring from backup:', restoreError);
  }
} 