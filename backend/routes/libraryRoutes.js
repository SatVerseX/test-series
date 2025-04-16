const express = require('express');
const router = express.Router();
const axios = require('axios');

const LIBRARY_API_URL = 'https://library-backend-2d9k.onrender.com';

// Middleware to check if the API is available
const checkApiAvailability = async (req, res, next) => {
  try {
    const response = await axios.get(LIBRARY_API_URL);
    if (response.status !== 200) {
      throw new Error('API returned non-200 status');
    }
    next();
  } catch (error) {
    console.error('Library API is not available:', error);
    return res.status(503).json({ 
      success: false, 
      message: 'Library Genesis API is currently unavailable. Please try again later.' 
    });
  }
};

// Helper function to validate and transform book data
const transformBookData = (bookData) => {
  if (!Array.isArray(bookData)) {
    return [];
  }
  
  console.log('Raw book data from API:', bookData[0]); // Log the first book to see the structure
  
  return bookData.map(book => {
    // Debug the field names
    const bookKeys = Object.keys(book);
    console.log('Book keys:', bookKeys);
    
    // Check if title is capitalized or not and handle both cases
    const title = book.Title || book.title || 'Unknown Title';
    const author = book.Author || book.author || 'Unknown Author';
    const year = book.Year || book.year || null;
    const extension = book.Extension || book.extension || null;
    
    // Extract mirror links with various possible naming conventions
    const mirror1 = book.Mirror_1 || book.mirror_1 || book.mirror1 || book.Mirror1 || null;
    const mirror2 = book.Mirror_2 || book.mirror_2 || book.mirror2 || book.Mirror2 || null;
    const mirror3 = book.Mirror_3 || book.mirror_3 || book.mirror3 || book.Mirror3 || null;
    
    return {
      id: book.ID || book.id || book.md5 || book.MD5 || `book-${Math.random().toString(36).substr(2, 9)}`,
      Title: title,
      Author: author,
      Year: year,
      Extension: extension,
      Size: book.Size || book.size || null,
      Language: book.Language || book.language || null,
      Pages: book.Pages || book.pages ? Number(book.Pages || book.pages) : null,
      md5: book.md5 || book.MD5 || null,
      isbn: book.ISBN || book.isbn || null,
      Publisher: book.Publisher || book.publisher || null,
      Description: book.Description || book.description || null,
      // Include mirror download links
      Mirror_1: mirror1,
      Mirror_2: mirror2,
      Mirror_3: mirror3,
      // Include any original mirror links with their original naming for debugging
      original_mirrors: {
        mirror1: book.Mirror_1,
        mirror2: book.Mirror_2,
        mirror3: book.Mirror_3,
        alt_mirror1: book.mirror_1 || book.mirror1 || book.Mirror1,
        alt_mirror2: book.mirror_2 || book.mirror2 || book.Mirror2,
        alt_mirror3: book.mirror_3 || book.mirror3 || book.Mirror3
      }
    };
  });
};

// Helper function to validate and transform download links
const transformDownloadLinks = (linksData, bookInfo) => {
  console.log('Raw links data type:', typeof linksData, Array.isArray(linksData));
  
  // Helper function to convert links to direct download URLs if needed
  const convertToDirectLink = (url, source, bookInfo) => {
    // If it's already a direct download link, return as is
    if (url.includes('download.books.ms/main')) {
      return url;
    }
    
    // Extract book ID or hash if present
    let bookId = '';
    let filename = '';
    
    // Try to extract filename
    if (url.includes('filename=')) {
      filename = url.split('filename=')[1].split('&')[0];
    } else if (url.includes('?')) {
      const urlParts = url.split('?');
      const lastPart = urlParts[0].split('/').pop();
      if (lastPart && (lastPart.includes('.pdf') || lastPart.includes('.epub'))) {
        filename = lastPart;
      }
    }
    
    // If we couldn't extract a filename and have book info, generate one
    if (!filename && bookInfo) {
      const title = bookInfo.Title || bookInfo.title || '';
      const author = bookInfo.Author || bookInfo.author || '';
      const publisher = bookInfo.Publisher || bookInfo.publisher || '';
      const year = bookInfo.Year || bookInfo.year || '';
      const extension = bookInfo.Extension || bookInfo.extension || 'pdf';
      
      filename = `(Information science and statistics) ${author} - ${title}-${publisher} (${year}).${extension}`;
    } else if (!filename) {
      filename = 'book.pdf';
    }
    
    // Make sure filename is properly URL encoded
    filename = encodeURIComponent(filename);
    
    // Try to get ID from URL
    if (url.includes('md5=')) {
      bookId = url.split('md5=')[1].split('&')[0];
    } else if (url.includes('ipfs/')) {
      bookId = url.split('ipfs/')[1].split('?')[0];
    }
    
    // If not found in URL, try from book info
    if (!bookId && bookInfo) {
      bookId = bookInfo.md5 || bookInfo.MD5 || '';
    }
    
    // Always construct a direct download link if we have a book ID
    if (bookId) {
      // Ensure ID is correct format
      if (bookId.length > 32) bookId = bookId.substring(0, 32);
      
      // Return exact format from example
      return `https://download.books.ms/main/0/${bookId}/${filename}`;
    }
    
    // Default: return original URL
    return url;
  };
  
  // Check if we have a specific Mirror_2 link in an object
  if (!Array.isArray(linksData) && typeof linksData === 'object' && linksData !== null) {
    // First priority: check for Mirror_2/GET key
    const mirror2Key = Object.keys(linksData).find(key => 
      key === 'Mirror_2' || key === 'Mirror 2' || key === 'GET' || key === 'get'
    );
    
    if (mirror2Key && linksData[mirror2Key] && 
        typeof linksData[mirror2Key] === 'string' && 
        (linksData[mirror2Key].startsWith('http://') || linksData[mirror2Key].startsWith('https://'))) {
      
      // Only return the Mirror_2 link
      return [{
        url: convertToDirectLink(linksData[mirror2Key], mirror2Key, bookInfo),
        source: 'GET'
      }];
    }
    
    // Second priority: use the first link available and convert it
    for (const [key, value] of Object.entries(linksData)) {
      if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
        return [{
          url: convertToDirectLink(value, 'GET', bookInfo),
          source: 'GET'
        }];
      }
    }
    
    // If no valid URL found, return empty array
    return [];
  }
  
  // Handle array of links
  if (Array.isArray(linksData)) {
    // First priority: find a GET/Mirror_2 link
    const getLink = linksData.find(link => {
      if (typeof link === 'string') return false;
      
      const source = link.source || link.name || link.mirror || '';
      return source === 'GET' || source === 'Mirror 2' || source === 'Mirror_2';
    });
    
    if (getLink) {
      const urlValue = getLink.url || getLink.link || getLink.download_url || '';
      if (urlValue) {
        return [{
          url: convertToDirectLink(urlValue, 'GET', bookInfo),
          source: 'GET'
        }];
      }
    }
    
    // Second priority: use the first valid link
    for (const link of linksData) {
      if (typeof link === 'string' && (link.startsWith('http://') || link.startsWith('https://'))) {
        return [{
          url: convertToDirectLink(link, 'GET', bookInfo),
          source: 'GET'
        }];
      } else if (typeof link === 'object' && link !== null) {
        const urlValue = link.url || link.link || link.download_url || '';
        if (urlValue && typeof urlValue === 'string' && 
            (urlValue.startsWith('http://') || urlValue.startsWith('https://'))) {
          return [{
            url: convertToDirectLink(urlValue, 'GET', bookInfo),
            source: 'GET'
          }];
        }
      }
    }
  }
  
  // If we get here, no valid links were found
  return [];
};

// Check API status
router.get('/status', async (req, res) => {
  try {
    const response = await axios.get(LIBRARY_API_URL);
    return res.status(200).json({ 
      success: true, 
      message: 'Library Genesis API is available',
      data: response.data
    });
  } catch (error) {
    console.error('Error checking API status:', error);
    return res.status(503).json({ 
      success: false, 
      message: 'Library Genesis API is currently unavailable'
    });
  }
});

// Search for books
router.get('/search', checkApiAvailability, async (req, res) => {
  try {
    // Extract query parameters
    const { title, author, year, language, extension } = req.query;
    
    // Validate required fields
    if (!title && !author) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either title or author is required'
      });
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (author) params.append('author', author);
    if (year) params.append('year', year);
    if (language) params.append('language', language);
    if (extension) params.append('extension', extension);
    
    console.log(`Searching LibGen API with params: ${params.toString()}`);
    
    // Make the request to the Library Genesis API
    const response = await axios.get(`${LIBRARY_API_URL}/search?${params.toString()}`);
    
    // Debug the original API response for mirror links
    if (Array.isArray(response.data) && response.data.length > 0) {
      const firstBook = response.data[0];
      console.log('API original mirror fields:', {
        Mirror_1: firstBook.Mirror_1,
        mirror_1: firstBook.mirror_1,
        mirror1: firstBook.mirror1,
        Mirror1: firstBook.Mirror1,
        Mirror_2: firstBook.Mirror_2,
        mirror_2: firstBook.mirror_2,
        mirror2: firstBook.mirror2,
        Mirror2: firstBook.Mirror2,
        Mirror_3: firstBook.Mirror_3,
        mirror_3: firstBook.mirror_3,
        mirror3: firstBook.mirror3,
        Mirror3: firstBook.Mirror3,
        download: firstBook.download,
        download_url: firstBook.download_url,
        downloadUrl: firstBook.downloadUrl
      });
    }
    
    // Transform and validate the response data
    const transformedData = transformBookData(response.data);
    
    console.log(`Found ${transformedData.length} results from LibGen API`);
    
    return res.status(200).json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Error searching books:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error searching for books',
      error: error.message
    });
  }
});

// Get download links
router.post('/resolve', checkApiAvailability, async (req, res) => {
  try {
    // Get book object from request body
    const bookObject = req.body;
    
    console.log('Original book object received:', bookObject);
    
    if (!bookObject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Book object is required'
      });
    }
    
    // Ensure we have both lowercase and uppercase versions of fields
    // to be compatible with the external API
    const normalizedBook = {
      ...bookObject,
      // Add lowercase versions if only uppercase exists
      id: bookObject.id || bookObject.ID || bookObject.md5 || bookObject.MD5,
      title: bookObject.title || bookObject.Title,
      author: bookObject.author || bookObject.Author,
      // Add uppercase versions if only lowercase exists
      ID: bookObject.ID || bookObject.id,
      Title: bookObject.Title || bookObject.title,
      Author: bookObject.Author || bookObject.author,
      MD5: bookObject.MD5 || bookObject.md5,
    };
    
    console.log('Normalized book object for API:', normalizedBook);
    
    // Make the request to the Library Genesis API
    const response = await axios.post(`${LIBRARY_API_URL}/resolve`, normalizedBook);
    
    console.log('Raw API response for download links:', response.data);
    
    // Transform and validate the download links, passing the book info
    const transformedLinks = transformDownloadLinks(response.data, normalizedBook);
    
    console.log(`Found ${transformedLinks.length} download links:`, transformedLinks);
    
    return res.status(200).json({
      success: true,
      data: transformedLinks
    });
  } catch (error) {
    console.error('Error getting download links:', error);
    
    // Add more detailed error logging
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error('API Response Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', {
        request: error.request
      });
    } else {
      // Something happened in setting up the request
      console.error('API Setup Error:', error.message);
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error retrieving download links',
      error: error.message
    });
  }
});

// Proxy download to force direct download instead of redirect
router.get('/download', async (req, res) => {
  try {
    const { url, filename } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL parameter is required'
      });
    }
    
    console.log(`Proxying download request for: ${url}, filename: ${filename}`);
    
    // Make a request to the actual file
    const response = await axios({
      method: 'get',
      url: decodeURIComponent(url),
      responseType: 'arraybuffer', // Use arraybuffer instead of stream for better handling
      timeout: 60000, // 60 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,application/octet-stream',
        'Referer': 'https://library.lol/'
      },
    });
    
    // Check if we actually got PDF or binary data
    const contentType = response.headers['content-type'] || '';
    console.log('Response content type:', contentType);
    
    if (contentType.includes('text/html')) {
      // We probably got an error page instead of the actual file
      console.error('Received HTML instead of PDF, likely an error page');
      return res.status(502).json({
        success: false,
        message: 'The file server returned an HTML page instead of the PDF'
      });
    }
    
    // Get the decoded filename or fallback
    const decodedFilename = decodeURIComponent(filename || 'book.pdf');
    console.log(`Sending file with filename: ${decodedFilename}`);
    
    // Determine correct content type based on file extension
    let fileContentType = 'application/octet-stream'; // Default safe binary type
    if (decodedFilename.endsWith('.pdf')) {
      fileContentType = 'application/pdf';
    } else if (decodedFilename.endsWith('.epub')) {
      fileContentType = 'application/epub+zip';
    } else if (decodedFilename.endsWith('.mobi')) {
      fileContentType = 'application/x-mobipocket-ebook';
    }
    
    // Send the file with appropriate headers
    res.setHeader('Content-Type', fileContentType);
    res.setHeader('Content-Disposition', `attachment; filename="${decodedFilename}"`);
    res.setHeader('Content-Length', response.headers['content-length'] || response.data.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send the file data
    res.send(response.data);
    
  } catch (error) {
    console.error('Error proxying download:', error);
    
    if (error.response) {
      // The target server responded with a non-2xx status
      console.error('Target server error:', {
        status: error.response.status,
        headers: error.response.headers,
        contentType: error.response.headers['content-type']
      });
      
      return res.status(502).json({
        success: false,
        message: 'Error downloading file from source',
        error: `Server responded with status ${error.response.status}`,
        details: 'The file server might be blocking proxy requests or the file might not exist'
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from target server');
      
      return res.status(504).json({
        success: false,
        message: 'No response from the file server',
        error: 'Connection timed out',
        details: 'The file server might be down or blocking the connection'
      });
    } else {
      // Error setting up request
      return res.status(500).json({
        success: false,
        message: 'Error setting up download request',
        error: error.message
      });
    }
  }
});

module.exports = router; 