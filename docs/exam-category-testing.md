# Exam Category Feature Testing Guide

This document provides instructions for testing the exam category functionality that has been implemented across the application.

## Backend Implementation

Two new endpoints have been added:

1. `GET /api/tests/categories`
   - Returns a list of all unique exam categories from the test subjects.
   - Each category has an ID, name, and icon.

2. `GET /api/users/:id/preferences` and `POST /api/users/:id/preferences`
   - Allows retrieving and updating user preferences, including default category.

## Frontend Implementation

The `ExamCategoryContext` now provides:
- Loading, saving, and selecting categories
- Improved error handling with graceful fallbacks
- Local storage synchronization

## Testing the Implementation

### 1. Test Category Selection in Navbar

- Log in to the application
- Observe the category selector in the navbar
- Click on it and select different categories
- Verify that the selection is preserved across page navigation

### 2. Test Category Welcome Screen

- Log out and clear local storage
- Log in with a new user
- Verify that the category welcome screen appears
- Select a category and check "Set as default"
- Verify it redirects to the dashboard
- Log out and log in again - it should not show the welcome screen again

### 3. Test Profile Page Category Settings

- Navigate to the Profile page
- Locate the "Exam Category Preferences" section
- Change your default category
- Click "Save Preference"
- Verify that the toast notification appears confirming the save
- Log out and log in again to verify the preference is saved

### 4. Test Test List Filtering

- Navigate to the Tests page
- Verify that it shows tests filtered by your selected category
- Change the category from the navbar
- Verify that the test list updates accordingly

### 5. Error Handling Tests

- Temporarily disable network connectivity
- Try to change categories
- Verify that it still works using localStorage
- Re-enable network and verify sync works

## Expected Behavior

- The selected category should persist between sessions
- The UI should reflect the current category selection
- Categories should be consistently displayed across the application
- There should be no 404 or 500 errors in the console related to categories
- If the API fails, the application should gracefully fall back to default categories

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify that the backend endpoints are accessible 
3. Check localStorage for saved preferences
4. Ensure the User model has the preferences field added

## Updates

The following files have been modified:

1. Frontend:
   - `ExamCategoryContext.jsx` - Improved error handling
   - `CategorySelector.jsx` - Better UI and fallbacks
   - `Profile.jsx` - Added category preferences section  
   - `Dashboard.jsx` - Added category welcome for new users

2. Backend:
   - `User.js` - Added preferences schema
   - `userRoutes.js` - Added preferences endpoints
   - `testRoutes.js` - Added categories endpoint 