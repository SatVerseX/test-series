import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Default category data if API fails
const DEFAULT_CATEGORIES = [
  { id: 'ssc', name: 'SSC', icon: 'school' },
  { id: 'upsc', name: 'UPSC', icon: 'school' },
  { id: 'jee', name: 'JEE', icon: 'science' },
  { id: 'neet', name: 'NEET', icon: 'medical' },
  { id: 'gate', name: 'GATE', icon: 'engineering' },
  { id: 'banking', name: 'Banking', icon: 'account_balance' },
  { id: 'railway', name: 'Railway', icon: 'train' },
  { id: 'cbse', name: 'CBSE', icon: 'school' }
];

// Create the context
const ExamCategoryContext = createContext();

// Custom hook to use the context
export const useExamCategory = () => {
  const context = useContext(ExamCategoryContext);
  if (!context) {
    throw new Error('useExamCategory must be used within an ExamCategoryProvider');
  }
  return context;
};

// Provider component
export const ExamCategoryProvider = ({ children }) => {
  const { user, api } = useAuth();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(
    localStorage.getItem('selectedExamCategory') || 'all'
  );
  const [defaultCategory, setDefaultCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all available categories
  useEffect(() => {
    // Always set the default categories first
    setCategories(DEFAULT_CATEGORIES);
    
    const fetchCategories = async () => {
      if (!api) {
        console.log('No API instance available, using default categories');
        return;
      }
      
      try {
        setLoading(true);
        
        console.log('Attempting to fetch categories from API...');
        
        const response = await api.get('/api/tests/categories').catch(err => {
          console.warn('Categories API not available, using default categories:', err.message);
          return { data: DEFAULT_CATEGORIES };
        });
        
        console.log('API Response for categories:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          // If the API returned any categories that are not in our default list, add them
          const apiCategories = response.data.map(cat => {
            if (typeof cat === 'string') {
              return {
                id: cat.toLowerCase().replace(/\s+/g, '_'),
                name: cat,
                icon: getIconTypeForCategory(cat)
              };
            }
            return cat;
          });
          
          // We'll only use the API categories to add to our defaults, not replace them
          const defaultIds = DEFAULT_CATEGORIES.map(cat => cat.id);
          const additionalApiCategories = apiCategories.filter(cat => 
            !defaultIds.includes(cat.id) && cat.id !== 'all'
          );
          
          if (additionalApiCategories.length > 0) {
            // Combine with defaults but ensure defaults come first
            setCategories([...DEFAULT_CATEGORIES, ...additionalApiCategories]);
            console.log('Combined categories:', [...DEFAULT_CATEGORIES, ...additionalApiCategories]);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        // We already set the default categories at the start
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [api]);

  // Fetch user's preferred category
  useEffect(() => {
    const fetchUserPreference = async () => {
      // Skip if no user or no API, or if we've already loaded from localStorage
      if (!user || !api) return;
      
      // First try to get from localStorage
      const storedCategory = localStorage.getItem('selectedExamCategory');
      if (storedCategory) {
        setSelectedCategory(storedCategory);
        setDefaultCategory(storedCategory);
      }
      
      // Then try to get from API
      try {
        const response = await api.get(`/api/users/${user.firebaseId}/preferences`).catch(err => {
          console.warn('User preferences API not available:', err.message);
          return { data: null };
        });
        
        if (response && response.data && response.data.defaultCategory) {
          setDefaultCategory(response.data.defaultCategory);
          setSelectedCategory(response.data.defaultCategory);
          localStorage.setItem('selectedExamCategory', response.data.defaultCategory);
        }
      } catch (err) {
        console.error('Error fetching user preferences:', err);
        // Not setting error since this is not critical and we're using localStorage
      }
    };

    fetchUserPreference();
  }, [user, api]);

  // Helper function to match category name to icon type
  const getIconTypeForCategory = (categoryName) => {
    if (!categoryName) return 'school';
    
    categoryName = categoryName.toString().toLowerCase();
    
    if (categoryName.includes('jee') || categoryName.includes('iit')) {
      return 'science';
    } else if (categoryName.includes('neet') || categoryName.includes('medical')) {
      return 'medical';
    } else if (categoryName.includes('gate') || categoryName.includes('engineering')) {
      return 'engineering';
    } else if (categoryName.includes('bank') || categoryName.includes('finance')) {
      return 'account_balance';
    } else if (categoryName.includes('railway') || categoryName.includes('train')) {
      return 'train';
    } else {
      return 'school';
    }
  };

  // Update the user's preferred category
  const saveDefaultCategory = async (categoryId) => {
    if (!categoryId) return false;
    
    // Always save to localStorage
    localStorage.setItem('selectedExamCategory', categoryId);
    setDefaultCategory(categoryId);
    
    // Try to save to API if available
    if (user && api) {
      try {
        await api.post(`/api/users/${user.firebaseId}/preferences`, {
          defaultCategory: categoryId
        }).catch(err => {
          console.warn('Could not save preference to API, saved to localStorage only:', err.message);
          return { success: false };
        });
        return true;
      } catch (err) {
        console.error('Error saving category preference:', err);
        // Not setting error since we've already saved to localStorage
        return false;
      }
    }
    
    return true; // Return true since we saved to localStorage
  };

  // Select a category without making it default
  const selectCategory = (categoryId) => {
    if (!categoryId) categoryId = 'all';
    setSelectedCategory(categoryId);
    localStorage.setItem('selectedExamCategory', categoryId);
  };

  // Clear selected category
  const clearSelectedCategory = () => {
    setSelectedCategory('all');
    localStorage.setItem('selectedExamCategory', 'all');
  };

  const value = {
    categories,
    selectedCategory,
    defaultCategory,
    loading,
    error,
    selectCategory,
    saveDefaultCategory,
    clearSelectedCategory,
  };

  return (
    <ExamCategoryContext.Provider value={value}>
      {children}
    </ExamCategoryContext.Provider>
  );
};

export default ExamCategoryProvider; 