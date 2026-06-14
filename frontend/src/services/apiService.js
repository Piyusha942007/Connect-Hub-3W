import apiClient from '../api/client';

/**
 * Fetch paginated posts
 * @param {number} page - Page number to load
 * @param {number} limit - Number of posts per page
 * @returns {Promise<object>} Response containing posts, currentPage, and hasMore
 */
export const fetchPosts = async (page = 1, limit = 10, category = '', search = '', sort = '') => {
  let url = `/api/posts?page=${page}&limit=${limit}`;
  if (category && category !== 'All') {
    url += `&category=${encodeURIComponent(category)}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  if (sort) {
    url += `&sort=${encodeURIComponent(sort)}`;
  }
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Create a new post (handles text and/or file upload)
 * @param {string} text - Text content of the post
 * @param {File} imageFile - Uploaded file resource
 * @returns {Promise<object>} Created post data
 */
export const createPostApi = async (text, imageFile, category = 'General', pollData = null) => {
  const formData = new FormData();
  if (text) {
    formData.append('text', text);
  }
  if (imageFile) {
    formData.append('image', imageFile);
  }
  if (category) {
    formData.append('category', category);
  }
  if (pollData) {
    formData.append('poll', JSON.stringify(pollData));
  }

  const response = await apiClient.post('/api/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Toggle like/unlike status on a post
 * @param {string} postId - MongoDB ObjectId of the post
 * @returns {Promise<array>} Updated array of likes [{ userId, username }]
 */
export const likePostApi = async (postId) => {
  const response = await apiClient.post(`/api/posts/${postId}/like`);
  return response.data;
};

/**
 * Add a comment to a post
 * @param {string} postId - MongoDB ObjectId of the post
 * @param {string} text - Comment text
 * @returns {Promise<array>} Updated array of comments [{ userId, username, text, createdAt }]
 */
export const commentPostApi = async (postId, text) => {
  const response = await apiClient.post(`/api/posts/${postId}/comment`, { text });
  return response.data;
};

/**
 * Add a reply to a comment on a post
 * @param {string} postId - MongoDB ObjectId of the post
 * @param {string} commentId - MongoDB ObjectId of the parent comment
 * @param {string} text - Reply text
 * @returns {Promise<array>} Updated array of comments with nested replies
 */
export const replyCommentPostApi = async (postId, commentId, text) => {
  const response = await apiClient.post(`/api/posts/${postId}/comment/${commentId}/reply`, { text });
  return response.data;
};

/**
 * Update an existing post (handles text modifications, image replacement, or image removal)
 * @param {string} postId - MongoDB ObjectId of the post
 * @param {string} text - Updated text content
 * @param {File} imageFile - Optional new image file resource to upload
 * @param {boolean} removeImage - True if the existing image should be deleted
 * @returns {Promise<object>} Updated post data
 */
export const updatePostApi = async (postId, text, imageFile, removeImage = false, category = undefined) => {
  const formData = new FormData();
  if (text !== undefined) {
    formData.append('text', text);
  }
  if (imageFile) {
    formData.append('image', imageFile);
  }
  if (removeImage) {
    formData.append('removeImage', 'true');
  }
  if (category !== undefined) {
    formData.append('category', category);
  }

  const response = await apiClient.put(`/api/posts/${postId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Delete a post
 * @param {string} postId - MongoDB ObjectId of the post
 * @returns {Promise<object>} Confirmation message
 */
export const deletePostApi = async (postId) => {
  const response = await apiClient.delete(`/api/posts/${postId}`);
  return response.data;
};

/**
 * Promote or unpromote a post
 * @param {string} postId - MongoDB ObjectId of the post
 * @returns {Promise<object>} Updated post data
 */
export const promotePostApi = async (postId) => {
  const response = await apiClient.put(`/api/posts/${postId}/promote`);
  return response.data;
};

/**
 * Vote in a poll on a post
 * @param {string} postId - MongoDB ObjectId of the post
 * @param {string} optionId - ID of the poll option being voted for
 * @returns {Promise<object>} Updated post data
 */
export const votePollApi = async (postId, optionId) => {
  const response = await apiClient.post(`/api/posts/${postId}/vote`, { optionId });
  return response.data;
};
