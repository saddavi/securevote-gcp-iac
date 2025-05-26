// Main application file for SecureVote Frontend
class SecureVoteApp {
  constructor() {
    this.currentSection = "home";
    this.isInitialized = false;
  }

  // Initialize the application
  async init() {
    if (this.isInitialized) return;

    try {
      // Setup event listeners
      this.setupEventListeners();

      // Setup navigation
      this.setupNavigation();

      // Initialize modules
      await this.initializeModules();

      // Perform health check
      await this.performHealthCheck();

      // Load initial data
      await this.loadInitialData();

      this.isInitialized = true;
      console.log("SecureVote application initialized successfully");
    } catch (error) {
      console.error("Failed to initialize application:", error);
      showToast("Application initialization failed", "error");
    }
  }

  // Setup navigation
  setupNavigation() {
    // Navigation links
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        if (section) {
          this.navigateToSection(section);
        }
      });
    });

    // Get started button
    const getStartedBtn = document.getElementById("getStartedBtn");
    if (getStartedBtn) {
      getStartedBtn.addEventListener("click", () => {
        if (auth.isLoggedIn()) {
          this.navigateToSection("elections");
        } else {
          showModal("loginModal");
        }
      });
    }

    // Learn more button
    const learnMoreBtn = document.getElementById("learnMoreBtn");
    if (learnMoreBtn) {
      learnMoreBtn.addEventListener("click", () => {
        this.showAboutModal();
      });
    }

    // Mobile navigation toggle
    const navToggle = document.getElementById("navToggle");
    const navMenu = document.getElementById("navMenu");
    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
      });
    }
  }

  // Navigate to a section
  navigateToSection(sectionName) {
    // Hide all sections
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active");
    });

    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
      targetSection.classList.add("active");
      this.currentSection = sectionName;
    }

    // Update navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });

    const activeLink = document.querySelector(
      `[data-section="${sectionName}"]`
    );
    if (activeLink) {
      activeLink.classList.add("active");
    }

    // Close mobile menu
    const navMenu = document.getElementById("navMenu");
    if (navMenu) {
      navMenu.classList.remove("active");
    }

    // Section-specific actions
    this.onSectionChange(sectionName);
  }

  // Handle section changes
  onSectionChange(sectionName) {
    switch (sectionName) {
      case "elections":
        electionsManager.loadElections();
        break;
      case "admin":
        if (auth.isAdmin()) {
          adminManager.loadAnalytics();
        }
        break;
      case "results":
        // Load results if needed
        break;
    }
  }

  // Setup general event listeners
  setupEventListeners() {
    // Handle authentication state changes
    document.addEventListener("userLoggedIn", () => {
      this.onUserAuthenticated();
    });

    document.addEventListener("userLoggedOut", () => {
      this.onUserLoggedOut();
    });

    // Handle keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Handle browser back/forward
    window.addEventListener("popstate", (e) => {
      // Handle browser navigation if implementing URL routing
    });

    // Handle visibility change for auto-refresh
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        electionsManager.stopAutoRefresh();
      } else {
        electionsManager.startAutoRefresh();
      }
    });
  }

  // Initialize all modules
  async initializeModules() {
    // Auth manager is initialized automatically
    // Elections manager initializes itself
    // Admin manager initializes when user is admin
    // Voting manager sets up its event listeners
  }

  // Perform health check
  async performHealthCheck() {
    try {
      const health = await api.healthCheck();

      if (health.status === "healthy") {
        console.log("API health check passed");
      } else {
        console.warn("API health check failed:", health);
        showToast("API connectivity issues detected", "warning");
      }
    } catch (error) {
      console.error("Health check failed:", error);
      showToast("Unable to connect to server", "error");
    }
  }

  // Load initial data
  async loadInitialData() {
    try {
      // Load elections for home page statistics
      await electionsManager.loadElections();

      // Update statistics
      electionsManager.updateStats();

      // Load admin data if user is admin
      if (auth.isAdmin()) {
        await adminManager.loadAnalytics();
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  }

  // Handle user authentication
  onUserAuthenticated() {
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent("userAuthenticated"));

    // Reload data that requires authentication
    this.loadInitialData();

    // Initialize admin features if user is admin
    if (auth.isAdmin()) {
      adminManager.init();
    }
  }

  // Handle user logout
  onUserLoggedOut() {
    // Navigate to home if in admin section
    if (this.currentSection === "admin") {
      this.navigateToSection("home");
    }

    // Dispatch custom event
    document.dispatchEvent(new CustomEvent("userLoggedOut"));
  }

  // Handle keyboard shortcuts
  handleKeyboardShortcuts(e) {
    // Escape key to close modals
    if (e.key === "Escape") {
      document.querySelectorAll(".modal.show").forEach((modal) => {
        modal.classList.remove("show");
      });
    }

    // Navigation shortcuts (Ctrl + number)
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "1":
          e.preventDefault();
          this.navigateToSection("home");
          break;
        case "2":
          e.preventDefault();
          this.navigateToSection("elections");
          break;
        case "3":
          e.preventDefault();
          this.navigateToSection("results");
          break;
        case "4":
          if (auth.isAdmin()) {
            e.preventDefault();
            this.navigateToSection("admin");
          }
          break;
      }
    }
  }

  // Show about modal
  showAboutModal() {
    const aboutHtml = `
            <div class="modal show" id="aboutModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>About SecureVote</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div style="padding: 1.5rem;">
                        <p>SecureVote is a modern, secure digital voting platform designed to facilitate transparent and trustworthy elections.</p>
                        
                        <h4 style="margin: 1.5rem 0 0.5rem;">Key Features</h4>
                        <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                            <li>End-to-end encryption for vote security</li>
                            <li>Real-time election monitoring</li>
                            <li>Transparent audit trails</li>
                            <li>Mobile-responsive design</li>
                            <li>Role-based access control</li>
                        </ul>
                        
                        <h4 style="margin: 1.5rem 0 0.5rem;">Security</h4>
                        <p>All votes are encrypted and stored securely. The system provides verification codes to ensure vote integrity while maintaining voter anonymity.</p>
                        
                        <div style="text-align: center; margin-top: 2rem;">
                            <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", aboutHtml);
  }

  // Refresh application data
  async refresh() {
    try {
      await this.loadInitialData();
      showToast("Data refreshed successfully", "success");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      showToast("Failed to refresh data", "error");
    }
  }

  // Get application status
  getStatus() {
    return {
      initialized: this.isInitialized,
      currentSection: this.currentSection,
      userLoggedIn: auth.isLoggedIn(),
      userRole: auth.currentUser?.role || null,
      totalElections: electionsManager.elections.length,
      apiConnected: true, // Would need to track this
    };
  }
}

// Global navigation function
function navigateToSection(sectionName) {
  if (window.app) {
    window.app.navigateToSection(sectionName);
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", async function () {
  // Create global app instance
  window.app = new SecureVoteApp();

  // Initialize the application
  await window.app.init();

  // Add refresh functionality (could be triggered by a button)
  window.refreshApp = () => window.app.refresh();

  // Add global navigation helper
  window.navigateToSection = navigateToSection;

  // Development helpers (remove in production)
  if (window.location.hostname === "localhost") {
    window.debugApp = () => {
      console.log("App Status:", window.app.getStatus());
      console.log("Auth Status:", auth);
      console.log("Elections:", electionsManager.elections);
    };
  }
});

// Handle page unload
window.addEventListener("beforeunload", function () {
  // Clean up intervals
  if (electionsManager.refreshInterval) {
    clearInterval(electionsManager.refreshInterval);
  }
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SecureVoteApp };
}
