/**
 * Formats a Date object or ISO string into a relative human-readable string (e.g., "just now", "10m ago", "3h ago", "Yesterday")
 * @param {Date|string} dateInput - The input date to format
 * @returns {string} Relative time format
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  
  // Calculate difference in milliseconds
  const diffMs = now.getTime() - date.getTime();
  
  // Handling slight timezone differences or future postings
  if (diffMs < 0) {
    return 'just now';
  }

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  }
  
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  
  if (diffDays === 1) {
    return 'Yesterday';
  }
  
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Fallback to standard local date representation
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Generates a stable and beautiful linear gradient background based on a hash of the username.
 * @param {string} username - User's username
 * @returns {string} CSS linear-gradient string
 */
export const getGradientForUsername = (username) => {
  if (!username) return 'linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)';
  
  // Simple stable hash algorithm (djb2-like)
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const gradients = [
    'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)', // Coral Sunset
    'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)', // Sunrise
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Fresh Green
    'linear-gradient(135deg, #1F1C2C 0%, #928DAB 100%)', // Lavender Dark
    'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', // Clean Blue
    'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', // Orange/Yellow
    'linear-gradient(135deg, #7F00FF 0%, #FF007F 100%)', // Purple/Pink
    'linear-gradient(135deg, #00F260 0%, #0575E6 100%)'  // Neon/Blue
  ];
  
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

/**
 * Checks if a user is verified (e.g. system admins, reviewers, demo accounts)
 * @param {string} username - User's username
 * @returns {boolean} True if verified
 */
export const isVerifiedUser = (username) => {
  if (!username) return false;
  const verified = ['piyusha', 'admin', 'connecthub_guest', 'reviewer', '3w_internship', 'system'];
  return verified.includes(username.toLowerCase());
};

