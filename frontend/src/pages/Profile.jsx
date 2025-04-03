import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { auth } from '../config/firebase';
import axios from 'axios';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    grade: '',
    subjects: ''
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user');
        }

        const token = await currentUser.getIdToken();
        
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setProfile(response.data);
          setTestHistory(response.data.testHistory || []);
          setEditForm({
            name: response.data.name,
            grade: response.data.grade || '',
            subjects: response.data.subjects?.join(', ') || ''
          });
        } catch (error) {
          if (error.response?.status === 404) {
            const registerResponse = await axios.post(
              `${import.meta.env.VITE_API_URL}/api/users/auth/google`,
              {
                idToken: token,
                grade: '10th',
                subjects: []
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            
            const profileResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            setProfile(profileResponse.data);
            setTestHistory(profileResponse.data.testHistory || []);
            setEditForm({
              name: profileResponse.data.name,
              grade: profileResponse.data.grade || '',
              subjects: profileResponse.data.subjects?.join(', ') || ''
            });
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error.response?.data?.error || 'Failed to load profile data');
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleEditProfile = () => {
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const token = await currentUser.getIdToken();
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}`,
        {
          ...editForm,
          subjects: editForm.subjects.split(',').map((s) => s.trim()).filter(Boolean),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProfile(response.data);
      setTestHistory(response.data.testHistory || []);
      setEditDialogOpen(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold mb-4">
              {profile?.name?.[0]?.toUpperCase()}
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{profile?.name}</h2>
            <button
              onClick={handleEditProfile}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          </div>

          <div className="border-t border-gray-200 my-4"></div>

          <div className="space-y-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-800">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Grade</p>
                <p className="text-gray-800">{profile?.grade || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-gray-800">{profile?.role === 'student' ? 'Student' : 'Admin'}</p>
              </div>
            </div>
          </div>

          {profile?.subjects && profile.subjects.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {profile.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Test History */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <svg className="w-6 h-6 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800">Test History</h2>
          </div>

          <div className="space-y-4">
            {testHistory.map((test) => (
              <div key={test.testId} className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{test.testName}</h3>
                    <p className="text-sm text-gray-500">
                      Score: {test.score}%
                    </p>
                    <p className="text-sm text-gray-500">
                      Completed: {new Date(test.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    test.score >= 70 ? 'bg-green-100 text-green-800' :
                    test.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Score: {test.score}%
                  </span>
                </div>
              </div>
            ))}
            {testHistory.length === 0 && (
              <p className="text-gray-500 text-center py-4">No test history available</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {editDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {!editForm.name && (
                  <p className="text-red-500 text-sm mt-1">Name is required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <input
                  type="text"
                  value={editForm.grade}
                  onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects (comma-separated)
                </label>
                <input
                  type="text"
                  value={editForm.subjects}
                  onChange={(e) => setEditForm({ ...editForm, subjects: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-500 text-sm mt-1">Enter subjects separated by commas</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={!editForm.name || loading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                  (!editForm.name || loading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 