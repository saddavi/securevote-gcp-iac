// Admin module for SecureVote Frontend
class AdminManager {
  constructor() {
    this.analytics = {
      totalUsers: 0,
      totalElections: 0,
      totalVotes: 0,
      activeElections: 0,
    };
  }

  // Initialize admin manager
  async init() {
    if (!auth.isAdmin()) {
      return;
    }

    await this.loadAnalytics();
    this.setupEventListeners();
  }

  // Load analytics data
  async loadAnalytics() {
    try {
      // In a real implementation, these would be separate API calls
      // For now, we'll simulate the data based on elections

      // Get elections data
      const electionsResponse = await api.getElections();
      const elections = electionsResponse.data || [];

      this.analytics.totalElections = elections.length;
      this.analytics.activeElections = elections.filter(
        (e) => electionsManager.getElectionStatus(e) === "active"
      ).length;

      // Simulate other statistics
      this.analytics.totalUsers = Math.floor(Math.random() * 1000) + 100;
      this.analytics.totalVotes = Math.floor(Math.random() * 5000) + 500;

      this.updateAnalyticsDisplay();
    } catch (error) {
      console.error("Failed to load analytics:", error);
      showToast("Failed to load analytics data", "error");
    }
  }

  // Update analytics display
  updateAnalyticsDisplay() {
    // Update home page stats
    this.animateStatistic("totalVoters", this.analytics.totalUsers);
    this.animateStatistic("activeElections", this.analytics.activeElections);
    this.animateStatistic("totalVotes", this.analytics.totalVotes);
  }

  // Animate statistic counter
  animateStatistic(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startValue = parseInt(element.textContent) || 0;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(
        startValue + (targetValue - startValue) * easeOutQuart
      );

      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Create new election
  async createElection(electionData) {
    if (!auth.isAdmin()) {
      showToast("Admin access required", "error");
      return;
    }

    try {
      // Validate dates
      const startDate = new Date(electionData.startDate);
      const endDate = new Date(electionData.endDate);
      const now = new Date();

      if (startDate < now) {
        showToast("Start date must be in the future", "error");
        return;
      }

      if (endDate <= startDate) {
        showToast("End date must be after start date", "error");
        return;
      }

      // Format data for API
      const formattedData = {
        title: electionData.title,
        description: electionData.description,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      // Create election via elections manager
      await electionsManager.createElection(formattedData);

      // Update analytics
      await this.loadAnalytics();

      return true;
    } catch (error) {
      console.error("Failed to create election:", error);
      throw error;
    }
  }

  // Get system analytics
  getSystemAnalytics() {
    return {
      elections: {
        total: this.analytics.totalElections,
        active: this.analytics.activeElections,
        completed:
          this.analytics.totalElections - this.analytics.activeElections,
        upcoming: 0, // Would need to calculate from actual data
      },
      users: {
        total: this.analytics.totalUsers,
        voters: Math.floor(this.analytics.totalUsers * 0.9),
        admins: Math.floor(this.analytics.totalUsers * 0.1),
      },
      votes: {
        total: this.analytics.totalVotes,
        today: Math.floor(Math.random() * 100),
        thisWeek: Math.floor(Math.random() * 500),
      },
    };
  }

  // Show analytics modal
  showAnalyticsModal() {
    const analytics = this.getSystemAnalytics();

    const analyticsHtml = `
            <div class="modal show" id="analyticsModal">
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3>System Analytics</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div style="padding: 1.5rem;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                            <div class="stat">
                                <i class="fas fa-poll" style="color: var(--primary-color);"></i>
                                <span class="stat-number">${analytics.elections.total}</span>
                                <span class="stat-label">Total Elections</span>
                                <small>${analytics.elections.active} active, ${analytics.elections.completed} completed</small>
                            </div>
                            <div class="stat">
                                <i class="fas fa-users" style="color: var(--success-color);"></i>
                                <span class="stat-number">${analytics.users.total}</span>
                                <span class="stat-label">Registered Users</span>
                                <small>${analytics.users.voters} voters, ${analytics.users.admins} admins</small>
                            </div>
                            <div class="stat">
                                <i class="fas fa-vote-yea" style="color: var(--warning-color);"></i>
                                <span class="stat-number">${analytics.votes.total}</span>
                                <span class="stat-label">Total Votes</span>
                                <small>${analytics.votes.today} today, ${analytics.votes.thisWeek} this week</small>
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", analyticsHtml);
  }

  // Setup event listeners
  setupEventListeners() {
    // Create election button
    const createElectionBtn = document.getElementById("createElectionBtn");
    if (createElectionBtn) {
      createElectionBtn.addEventListener("click", () => {
        showModal("createElectionModal");
      });
    }

    // Analytics button
    const analyticsBtn = document.getElementById("analyticsBtn");
    if (analyticsBtn) {
      analyticsBtn.addEventListener("click", () => {
        this.showAnalyticsModal();
      });
    }

    // Manage elections button
    const manageElectionsBtn = document.getElementById("manageElectionsBtn");
    if (manageElectionsBtn) {
      manageElectionsBtn.addEventListener("click", () => {
        this.showManageElectionsModal();
      });
    }

    // Create election form
    const createElectionForm = document.getElementById("createElectionForm");
    if (createElectionForm) {
      createElectionForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(createElectionForm);
        const electionData = {
          title: formData.get("title"),
          description: formData.get("description"),
          startDate: formData.get("startDate"),
          endDate: formData.get("endDate"),
        };

        try {
          await this.createElection(electionData);
          createElectionForm.reset();
          hideModal("createElectionModal");
        } catch (error) {
          // Error already handled in createElection
        }
      });
    }
  }

  // Show manage elections modal
  showManageElectionsModal() {
    const elections = electionsManager.elections;

    const manageHtml = `
            <div class="modal show" id="manageElectionsModal">
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3>Manage Elections</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div style="padding: 1.5rem;">
                        ${
                          elections.length === 0
                            ? `
                            <div class="no-elections">
                                <i class="fas fa-ballot-check"></i>
                                <p>No elections to manage.</p>
                                <small>Create a new election to get started.</small>
                            </div>
                        `
                            : `
                            <div style="display: grid; gap: 1rem;">
                                ${elections
                                  .map(
                                    (election) => `
                                    <div class="election-card" style="margin: 0;">
                                        <div class="election-header">
                                            <div>
                                                <h4>${election.title}</h4>
                                                <div class="election-status status-${electionsManager.getElectionStatus(
                                                  election
                                                )}">
                                                    ${electionsManager
                                                      .getElectionStatus(
                                                        election
                                                      )
                                                      .toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                        <p style="margin: 0.5rem 0;">${
                                          election.description ||
                                          "No description"
                                        }</p>
                                        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                                            <button class="btn btn-outline btn-sm" onclick="adminManager.editElection('${
                                              election.election_id
                                            }')">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                            <button class="btn btn-secondary btn-sm" onclick="adminManager.viewElectionDetails('${
                                              election.election_id
                                            }')">
                                                <i class="fas fa-eye"></i> Details
                                            </button>
                                            ${
                                              electionsManager.getElectionStatus(
                                                election
                                              ) === "completed"
                                                ? `
                                                <button class="btn btn-primary btn-sm" onclick="adminManager.publishResults('${election.election_id}')">
                                                    <i class="fas fa-chart-bar"></i> Publish Results
                                                </button>
                                            `
                                                : ""
                                            }
                                        </div>
                                    </div>
                                `
                                  )
                                  .join("")}
                            </div>
                        `
                        }
                        <div style="text-align: center; margin-top: 2rem;">
                            <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", manageHtml);
  }

  // Edit election (placeholder)
  editElection(electionId) {
    showToast("Election editing interface coming soon", "warning");
    // TODO: Implement election editing
  }

  // View election details (placeholder)
  viewElectionDetails(electionId) {
    showToast("Election details interface coming soon", "warning");
    // TODO: Implement detailed election view
  }

  // Publish results
  async publishResults(electionId) {
    try {
      await api.publishResults(electionId);
      showToast("Results published successfully!", "success");

      // Close manage modal and reload elections
      document.getElementById("manageElectionsModal")?.remove();
      await electionsManager.loadElections();
    } catch (error) {
      console.error("Failed to publish results:", error);
      showToast("Failed to publish results", "error");
    }
  }
}

// Create global admin manager instance
const adminManager = new AdminManager();

// Initialize when DOM is ready and user is authenticated
document.addEventListener("DOMContentLoaded", function () {
  // Initialize admin features if user is admin
  if (auth.isAdmin()) {
    adminManager.init();
  }

  // Re-initialize when user logs in
  document.addEventListener("userAuthenticated", () => {
    if (auth.isAdmin()) {
      adminManager.init();
    }
  });
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { AdminManager, adminManager };
}
