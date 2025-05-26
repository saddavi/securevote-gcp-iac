// Configuration for SecureVote Frontend
const CONFIG = {
  // API Configuration
  API_BASE_URL: "https://securevote-api-dev-832948640879.us-central1.run.app",
  API_ENDPOINTS: {
    // Authentication
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    ME: "/api/auth/me",
    LOGOUT: "/api/auth/logout",

    // Elections
    ELECTIONS: "/api/elections",
    ELECTION_BY_ID: "/api/elections/{id}",

    // Voting
    VOTES: "/api/votes",
    VOTE_VERIFY: "/api/votes/verify/{code}",

    // Results
    RESULTS: "/api/results/{electionId}",
    PUBLISH_RESULTS: "/api/results/{electionId}/publish",
  },

  // Application Settings
  APP_NAME: "SecureVote",
  VERSION: "1.0.0",

  // UI Settings
  TOAST_DURATION: 5000, // 5 seconds
  POLLING_INTERVAL: 30000, // 30 seconds

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: "securevote_auth_token",
    USER_DATA: "securevote_user_data",
    THEME: "securevote_theme",
  },

  // Election Status
  ELECTION_STATUS: {
    UPCOMING: "upcoming",
    ACTIVE: "active",
    COMPLETED: "completed",
  },

  // User Roles
  USER_ROLES: {
    VOTER: "voter",
    ADMIN: "admin",
  },

  // API Response Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
};

// Utility function to build API URLs
CONFIG.buildApiUrl = function (endpoint, params = {}) {
  let url = this.API_BASE_URL + endpoint;

  // Replace path parameters
  Object.keys(params).forEach((key) => {
    url = url.replace(`{${key}}`, params[key]);
  });

  return url;
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}
