// Authentication module for SecureVote Frontend
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    this.init();
  }

  async init() {
    // Check if user is logged in on page load
    if (this.token) {
      try {
        await this.getCurrentUser();
      } catch (error) {
        console.warn("Token validation failed:", error);
        this.logout();
      }
    }
    this.updateUI();
  }

  // Get current user from API
  async getCurrentUser() {
    try {
      const response = await api.getCurrentUser();
      this.currentUser = response.data;
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.USER_DATA,
        JSON.stringify(this.currentUser)
      );
      return this.currentUser;
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await api.login({ email, password });

      this.token = response.data.token;
      this.currentUser = {
        userId: response.data.userId,
        email: email,
        role: response.data.role,
      };

      // Store in localStorage
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, this.token);
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.USER_DATA,
        JSON.stringify(this.currentUser)
      );

      // Update UI
      this.updateUI();
      this.closeModals();

      showToast("Login successful!", "success");
      return response.data;
    } catch (error) {
      if (error.status === 401) {
        showToast("Invalid email or password", "error");
      } else {
        showToast(error.message || "Login failed", "error");
      }
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await api.register(userData);

      this.token = response.data.token;
      this.currentUser = {
        userId: response.data.userId,
        email: userData.email,
        role: userData.role || "voter",
      };

      // Store in localStorage
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, this.token);
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.USER_DATA,
        JSON.stringify(this.currentUser)
      );

      // Update UI
      this.updateUI();
      this.closeModals();

      showToast("Account created successfully!", "success");
      return response.data;
    } catch (error) {
      if (error.status === 409) {
        showToast("An account with this email already exists", "error");
      } else if (error.status === 400) {
        showToast("Please check your input and try again", "error");
      } else {
        showToast(error.message || "Registration failed", "error");
      }
      throw error;
    }
  }

  // Logout user
  logout() {
    this.token = null;
    this.currentUser = null;

    // Clear localStorage
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);

    // Update UI
    this.updateUI();
    this.closeModals();

    showToast("Logged out successfully", "success");

    // Navigate to home
    navigateToSection("home");
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.token && this.currentUser;
  }

  // Check if user is admin
  isAdmin() {
    return (
      this.currentUser && this.currentUser.role === CONFIG.USER_ROLES.ADMIN
    );
  }

  // Update UI based on authentication state
  updateUI() {
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const userMenu = document.getElementById("userMenu");
    const userName = document.getElementById("userName");
    const adminLinks = document.querySelectorAll(".admin-only");

    if (this.isLoggedIn()) {
      // Show user menu, hide login/register buttons
      if (loginBtn) loginBtn.style.display = "none";
      if (registerBtn) registerBtn.style.display = "none";
      if (userMenu) userMenu.style.display = "flex";
      if (userName) userName.textContent = this.currentUser.email;

      // Show admin features if user is admin
      adminLinks.forEach((element) => {
        element.style.display = this.isAdmin() ? "block" : "none";
      });
    } else {
      // Show login/register buttons, hide user menu
      if (loginBtn) loginBtn.style.display = "inline-flex";
      if (registerBtn) registerBtn.style.display = "inline-flex";
      if (userMenu) userMenu.style.display = "none";

      // Hide admin features
      adminLinks.forEach((element) => {
        element.style.display = "none";
      });
    }
  }

  // Close all modals
  closeModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.remove("show");
    });
  }

  // Validate password strength
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return {
        valid: false,
        message: "Password must be at least 8 characters long",
      };
    }
    if (!hasUpperCase || !hasLowerCase) {
      return {
        valid: false,
        message: "Password must contain both uppercase and lowercase letters",
      };
    }
    if (!hasNumbers) {
      return {
        valid: false,
        message: "Password must contain at least one number",
      };
    }
    if (!hasSpecialChar) {
      return {
        valid: false,
        message: "Password must contain at least one special character",
      };
    }

    return { valid: true, message: "Password is strong" };
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Create global auth manager instance
const auth = new AuthManager();

// Modal management functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("show");
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
  }
}

// Event listeners for authentication
document.addEventListener("DOMContentLoaded", function () {
  // Login button
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => showModal("loginModal"));
  }

  // Register button
  const registerBtn = document.getElementById("registerBtn");
  if (registerBtn) {
    registerBtn.addEventListener("click", () => showModal("registerModal"));
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => auth.logout());
  }

  // Switch between login and register
  const switchToRegister = document.getElementById("switchToRegister");
  if (switchToRegister) {
    switchToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      hideModal("loginModal");
      showModal("registerModal");
    });
  }

  const switchToLogin = document.getElementById("switchToLogin");
  if (switchToLogin) {
    switchToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      hideModal("registerModal");
      showModal("loginModal");
    });
  }

  // Login form submission
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(loginForm);
      const email = formData.get("email");
      const password = formData.get("password");

      if (!auth.validateEmail(email)) {
        showToast("Please enter a valid email address", "error");
        return;
      }

      try {
        await auth.login(email, password);
        loginForm.reset();
      } catch (error) {
        // Error already handled in auth.login
      }
    });
  }

  // Register form submission
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(registerForm);
      const userData = {
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        organization: formData.get("organization"),
        password: formData.get("password"),
        role: formData.get("role"),
      };

      // Validation
      if (!userData.fullName || !userData.email || !userData.password) {
        showToast("Please fill in all required fields", "error");
        return;
      }

      if (!auth.validateEmail(userData.email)) {
        showToast("Please enter a valid email address", "error");
        return;
      }

      const passwordValidation = auth.validatePassword(userData.password);
      if (!passwordValidation.valid) {
        showToast(passwordValidation.message, "error");
        return;
      }

      try {
        await auth.register(userData);
        registerForm.reset();
      } catch (error) {
        // Error already handled in auth.register
      }
    });
  }

  // Modal close buttons
  document.querySelectorAll(".modal-close").forEach((button) => {
    button.addEventListener("click", () => {
      const modalId = button.getAttribute("data-modal");
      if (modalId) {
        hideModal(modalId);
      }
    });
  });

  // Close modal when clicking outside
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("show");
      }
    });
  });
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { AuthManager, auth, showModal, hideModal };
}
