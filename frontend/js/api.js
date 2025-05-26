// API Service for SecureVote Frontend
class ApiService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  // Get authorization header with token
  getAuthHeaders() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Generic fetch wrapper with error handling
  async request(url, options = {}) {
    const fullUrl = url.startsWith("http") ? url : `${this.baseURL}${url}`;

    const config = {
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      showLoading(true);
      const response = await fetch(fullUrl, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new ApiError(
          data.error || data.message || "Request failed",
          response.status,
          data
        );
      }

      return { data, status: response.status, headers: response.headers };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Network error or server unavailable", 0, error);
    } finally {
      showLoading(false);
    }
  }

  // HTTP Methods
  async get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl, { method: "GET" });
  }

  async post(url, data = {}) {
    return this.request(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(url, data = {}) {
    return this.request(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(url) {
    return this.request(url, { method: "DELETE" });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get("/health");
      return response.data;
    } catch (error) {
      console.error("Health check failed:", error);
      return { status: "unhealthy", error: error.message };
    }
  }

  // Authentication API calls
  async register(userData) {
    return this.post(CONFIG.API_ENDPOINTS.REGISTER, userData);
  }

  async login(credentials) {
    return this.post(CONFIG.API_ENDPOINTS.LOGIN, credentials);
  }

  async getCurrentUser() {
    return this.get(CONFIG.API_ENDPOINTS.ME);
  }

  // Elections API calls
  async getElections(params = {}) {
    return this.get(CONFIG.API_ENDPOINTS.ELECTIONS, params);
  }

  async getElection(id) {
    const url = CONFIG.buildApiUrl(CONFIG.API_ENDPOINTS.ELECTION_BY_ID, { id });
    return this.get(url);
  }

  async createElection(electionData) {
    return this.post(CONFIG.API_ENDPOINTS.ELECTIONS, electionData);
  }

  async updateElection(id, electionData) {
    const url = CONFIG.buildApiUrl(CONFIG.API_ENDPOINTS.ELECTION_BY_ID, { id });
    return this.put(url, electionData);
  }

  async deleteElection(id) {
    const url = CONFIG.buildApiUrl(CONFIG.API_ENDPOINTS.ELECTION_BY_ID, { id });
    return this.delete(url);
  }

  // Voting API calls
  async submitVote(voteData) {
    return this.post(CONFIG.API_ENDPOINTS.VOTES, voteData);
  }

  async verifyVote(verificationCode) {
    const url = CONFIG.buildApiUrl(CONFIG.API_ENDPOINTS.VOTE_VERIFY, {
      code: verificationCode,
    });
    return this.get(url);
  }

  // Results API calls
  async getResults(electionId) {
    const url = CONFIG.buildApiUrl(CONFIG.API_ENDPOINTS.RESULTS, {
      electionId,
    });
    return this.get(url);
  }

  async publishResults(electionId) {
    const url = CONFIG.buildApiUrl(CONFIG.API_ENDPOINTS.PUBLISH_RESULTS, {
      electionId,
    });
    return this.post(url);
  }
}

// Custom Error class for API errors
class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// Create global API instance
const api = new ApiService();

// Loading state management
function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    if (show) {
      overlay.classList.add("show");
    } else {
      overlay.classList.remove("show");
    }
  }
}

// Toast notification system
function showToast(message, type = "success", title = "") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "fas fa-check-circle";
  if (type === "error") icon = "fas fa-exclamation-circle";
  if (type === "warning") icon = "fas fa-exclamation-triangle";

  toast.innerHTML = `
        <i class="${icon}"></i>
        <div class="toast-content">
            ${title ? `<div class="toast-title">${title}</div>` : ""}
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, CONFIG.TOAST_DURATION);
}

// Global error handler
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  if (event.reason instanceof ApiError) {
    showToast(event.reason.message, "error", "API Error");
  } else {
    showToast("An unexpected error occurred", "error", "System Error");
  }
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ApiService, ApiError, api, showToast, showLoading };
}
