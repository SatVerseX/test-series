/**
 * Default test categories with their associated icons
 * Used as fallback when database categories cannot be retrieved
 */
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

/**
 * Helper function to match an appropriate icon to a category
 * @param {string} category - The category name
 * @returns {string} - Material UI icon name
 */
function getIconForCategory(category) {
  if (!category) return 'school';
  
  category = category.toString().toLowerCase();
  
  if (category.includes('physics') || category.includes('chem') || 
      category.includes('science') || category.includes('biology')) {
    return 'science';
  } else if (category.includes('math')) {
    return 'engineering';
  } else if (category.includes('medical')) {
    return 'medical';
  } else if (category.includes('bank') || category.includes('finance') || 
             category.includes('economy')) {
    return 'account_balance';
  } else if (category.includes('railway') || category.includes('transport')) {
    return 'train';
  } else if (category.includes('history') || category.includes('geography') || 
             category.includes('social')) {
    return 'book';
  } else if (category.includes('computer') || category.includes('programming') ||
             category.includes('coding')) {
    return 'computer';
  } else {
    return 'school';
  }
}

module.exports = {
  DEFAULT_CATEGORIES,
  getIconForCategory
}; 