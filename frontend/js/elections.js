// Elections management module for SecureVote Frontend
class ElectionsManager {
  constructor() {
    this.elections = [];
    this.currentFilter = "all";
    this.refreshInterval = null;
  }

  // Initialize elections manager
  async init() {
    await this.loadElections();
    this.setupEventListeners();
    this.startAutoRefresh();
  }

  // Load elections from API
  async loadElections() {
    try {
      const response = await api.getElections();
      this.elections = response.data || [];
      this.updateElectionsDisplay();
    } catch (error) {
      console.error("Failed to load elections:", error);
      showToast("Failed to load elections", "error");
    }
  }

  // Filter elections by status
  filterElections(status) {
    this.currentFilter = status;
    this.updateElectionsDisplay();

    // Update filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-filter="${status}"]`).classList.add("active");
  }

  // Get elections based on current filter
  getFilteredElections() {
    if (this.currentFilter === "all") {
      return this.elections;
    }

    return this.elections.filter((election) => {
      const now = new Date();
      const startDate = new Date(election.start_date);
      const endDate = new Date(election.end_date);

      switch (this.currentFilter) {
        case "upcoming":
          return startDate > now;
        case "active":
          return startDate <= now && endDate >= now;
        case "completed":
          return endDate < now;
        default:
          return true;
      }
    });
  }

  // Get election status
  getElectionStatus(election) {
    const now = new Date();
    const startDate = new Date(election.start_date);
    const endDate = new Date(election.end_date);

    if (startDate > now) return "upcoming";
    if (startDate <= now && endDate >= now) return "active";
    return "completed";
  }

  // Update elections display
  updateElectionsDisplay() {
    const container = document.getElementById("electionsGrid");
    if (!container) return;

    const filteredElections = this.getFilteredElections();

    if (filteredElections.length === 0) {
      container.innerHTML = `
                <div class="no-elections">
                    <i class="fas fa-ballot-check"></i>
                    <p>No ${
                      this.currentFilter === "all" ? "" : this.currentFilter
                    } elections available.</p>
                    <small>Check back later or contact an administrator.</small>
                </div>
            `;
      return;
    }

    container.innerHTML = filteredElections
      .map((election) => this.createElectionCard(election))
      .join("");
  }

  // Create election card HTML
  createElectionCard(election) {
    const status = this.getElectionStatus(election);
    const canVote = auth.isLoggedIn() && status === "active";
    const canManage = auth.isAdmin();

    const startDate = new Date(election.start_date).toLocaleDateString();
    const endDate = new Date(election.end_date).toLocaleDateString();

    return `
            <div class="election-card" data-election-id="${
              election.election_id
            }">
                <div class="election-header">
                    <div>
                        <h3 class="election-title">${election.title}</h3>
                        <div class="election-status status-${status}">${status.toUpperCase()}</div>
                    </div>
                </div>
                <p class="election-description">${
                  election.description || "No description provided"
                }</p>
                <div class="election-dates">
                    <span><i class="fas fa-calendar-start"></i> Starts: ${startDate}</span>
                    <span><i class="fas fa-calendar-end"></i> Ends: ${endDate}</span>
                </div>
                <div class="election-actions">
                    ${
                      canVote
                        ? `<button class="btn btn-primary vote-btn" data-election-id="${election.election_id}">
                        <i class="fas fa-vote-yea"></i> Vote
                    </button>`
                        : ""
                    }
                    ${
                      status === "completed"
                        ? `<button class="btn btn-outline view-results-btn" data-election-id="${election.election_id}">
                        <i class="fas fa-chart-bar"></i> View Results
                    </button>`
                        : ""
                    }
                    ${
                      canManage
                        ? `<button class="btn btn-secondary manage-btn" data-election-id="${election.election_id}">
                        <i class="fas fa-cog"></i> Manage
                    </button>`
                        : ""
                    }
                </div>
            </div>
        `;
  }

  // Setup event listeners
  setupEventListeners() {
    // Filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.filterElections(btn.dataset.filter);
      });
    });

    // Election actions (using event delegation)
    const electionsGrid = document.getElementById("electionsGrid");
    if (electionsGrid) {
      electionsGrid.addEventListener("click", (e) => {
        const button = e.target.closest("button");
        if (!button) return;

        const electionId = button.dataset.electionId;
        if (!electionId) return;

        if (button.classList.contains("vote-btn")) {
          this.startVoting(electionId);
        } else if (button.classList.contains("view-results-btn")) {
          this.viewResults(electionId);
        } else if (button.classList.contains("manage-btn")) {
          this.manageElection(electionId);
        }
      });
    }
  }

  // Start voting process
  async startVoting(electionId) {
    if (!auth.isLoggedIn()) {
      showToast("Please log in to vote", "warning");
      showModal("loginModal");
      return;
    }

    try {
      const response = await api.getElection(electionId);
      const election = response.data;

      // Open voting modal with election data
      await voting.openVotingModal(election);
    } catch (error) {
      console.error("Failed to load election:", error);
      showToast("Failed to load election details", "error");
    }
  }

  // View election results
  async viewResults(electionId) {
    try {
      const response = await api.getResults(electionId);
      const results = response.data;

      // Switch to results section and display
      navigateToSection("results");
      resultsManager.displayResults(results);
    } catch (error) {
      console.error("Failed to load results:", error);
      showToast("Results not available yet", "warning");
    }
  }

  // Manage election (admin only)
  manageElection(electionId) {
    if (!auth.isAdmin()) {
      showToast("Admin access required", "error");
      return;
    }

    // Navigate to admin section
    navigateToSection("admin");
    // TODO: Implement election management interface
    showToast("Election management interface coming soon", "warning");
  }

  // Start auto-refresh
  startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      if (document.getElementById("elections").classList.contains("active")) {
        this.loadElections();
      }
    }, CONFIG.POLLING_INTERVAL);
  }

  // Stop auto-refresh
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Create new election (admin only)
  async createElection(electionData) {
    if (!auth.isAdmin()) {
      showToast("Admin access required", "error");
      return;
    }

    try {
      const response = await api.createElection(electionData);
      showToast("Election created successfully!", "success");

      // Reload elections
      await this.loadElections();

      return response.data;
    } catch (error) {
      console.error("Failed to create election:", error);
      showToast(error.message || "Failed to create election", "error");
      throw error;
    }
  }

  // Update election statistics on home page
  updateStats() {
    const totalElections = this.elections.length;
    const activeElections = this.elections.filter(
      (e) => this.getElectionStatus(e) === "active"
    ).length;

    const activeElectionsEl = document.getElementById("activeElections");
    if (activeElectionsEl) {
      activeElectionsEl.textContent = activeElections;
    }

    // Animate numbers
    this.animateNumber("activeElections", activeElections);
  }

  // Animate number display
  animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000; // 1 second
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentValue = Math.floor(
        startValue + (targetValue - startValue) * progress
      );
      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }
}

// Create global elections manager instance
const electionsManager = new ElectionsManager();

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Initialize elections manager
  electionsManager.init();
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ElectionsManager, electionsManager };
}
