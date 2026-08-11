import axios from 'axios';

const UPLOAD_API_URL = 'http://localhost:5001/api/upload';

/**
 * Upload an image or document file into a specific folder and return the generated image URL
 * @param {File} file - The file object to upload
 * @param {string} folder - The target folder name (e.g. 'purchase', 'sales', 'inventory')
 * @returns {Promise<{success: boolean, url: string, imageUrl: string}>}
 */
export const uploadImageApi = async (file, folder = 'general') => {
  if (!file) return null;

  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const response = await axios.post(`${UPLOAD_API_URL}/image?folder=${encodeURIComponent(folder)}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true,
  });

  return response.data;
};

