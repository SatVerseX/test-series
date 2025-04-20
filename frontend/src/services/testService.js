export const getTestAttemptDetails = async (testId, userId) => {
  try {
    const response = await axios.get(`${API_URL}/tests/${testId}/attempts/${userId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching test attempt details:', error);
    throw error;
  }
}; 