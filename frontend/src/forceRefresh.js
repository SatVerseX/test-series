const localStorage = window.localStorage;

// Clear any cached test data
localStorage.removeItem('testResults');
localStorage.removeItem('testAttempt');
localStorage.removeItem('testProgress');

// Also clear any session storage items
sessionStorage.removeItem('testResults');
sessionStorage.removeItem('testAttempt');

// Force reload without cache
window.location.reload(true);

// Note: Run this in the browser console on the test results page 