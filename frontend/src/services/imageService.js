import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const imageService = {
  // Get all images
  getImages: async () => {
    try {
      const response = await axios.get(`${API_URL}/images`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching images:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to fetch images' 
      };
    }
  },

  // Upload an image
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/images`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to upload image' 
      };
    }
  },

  // Resize an image
  resizeImage: async (imageId, width, maintainAspectRatio = true) => {
    try {
      const response = await axios.post(
        `${API_URL}/images/${imageId}/resize`,
        { width, maintain_aspect_ratio: maintainAspectRatio },
        {
          headers: {
            ...getAuthHeader(),
          },
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error resizing image:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to resize image' 
      };
    }
  },

  // Extract text from an image
  extractText: async (imageId, lang = 'eng') => {
    try {
      const response = await axios.post(
        `${API_URL}/images/${imageId}/ocr`,
        { lang },
        {
          headers: {
            ...getAuthHeader(),
          },
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error extracting text:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to extract text' 
      };
    }
  },

  // Get usage statistics
  getUsageStats: async (days = 30) => {
    try {
      const response = await axios.get(`${API_URL}/usage?days=${days}`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to fetch usage statistics' 
      };
    }
  },
};

export default imageService; 