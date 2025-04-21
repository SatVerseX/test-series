import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

// This is a minimal version that just logs the data - for debugging only
const TestResultFix = () => {
  const { testId, attemptId } = useParams();
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestResult = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Fetch test attempt data with a forced refresh
        const attemptResponse = await api.get(
          `/api/tests/${testId}/attempts/${user.firebaseId}`,
          { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } }
        );
        
        setAttempt(attemptResponse.data);
        
        // Log the raw data to console
        console.log('TEST ATTEMPT RAW DATA:', attemptResponse.data);
        
        // Display results in an alert for easy viewing
        const data = attemptResponse.data;
        alert(
          `TEST RESULTS:\n` +
          `Status: ${data.status}\n` +
          `Score: ${data.score}%\n` + 
          `Correct Answers: ${data.correctAnswers}\n` +
          `Passed: ${data.passed ? 'YES' : 'NO'}\n` +
          `Completed At: ${new Date(data.completedAt).toLocaleString()}\n\n` +
          `If the results shown in the UI differ from these values, the UI is not displaying the correct data.`
        );
        
      } catch (error) {
        console.error('Error fetching test result:', error);
        setError('Failed to load test result: ' + (error.response?.data?.message || error.message));
        toast.error('Failed to load test result');
      } finally {
        setLoading(false);
      }
    };

    fetchTestResult();
  }, [testId, attemptId, navigate, user, api]);

  if (loading) return <div>Loading test results...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!attempt) return <div>Test result not found</div>;

  return (
    <div>
      <h2>Test Result Debug Tool</h2>
      <p>Server data has been logged to the console and shown in an alert.</p>
      <p>Check the browser console (F12) for detailed data.</p>
      
      <div style={{ margin: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h3>Test Attempt Data</h3>
        <pre>{JSON.stringify(attempt, null, 2)}</pre>
      </div>
      
      <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );
};

export default TestResultFix; 