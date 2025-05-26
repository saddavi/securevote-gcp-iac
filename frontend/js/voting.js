// Voting module for SecureVote Frontend
class VotingManager {
  constructor() {
    this.currentElection = null;
    this.ballotOptions = [];
    this.selectedOption = null;
  }

  // Open voting modal for an election
  async openVotingModal(election) {
    this.currentElection = election;

    try {
      // Load ballot options for the election
      await this.loadBallotOptions(election.election_id);

      // Populate modal with election data
      this.populateVotingModal();

      // Show the voting modal
      showModal("votingModal");
    } catch (error) {
      console.error("Failed to open voting modal:", error);
      showToast("Failed to load voting interface", "error");
    }
  }

  // Load ballot options from API
  async loadBallotOptions(electionId) {
    // For now, create sample ballot options
    // In a real implementation, this would come from the API
    this.ballotOptions = [
      {
        id: 1,
        title: "Candidate A",
        description:
          "Experienced leader with a focus on innovation and transparency.",
      },
      {
        id: 2,
        title: "Candidate B",
        description:
          "Community advocate with strong background in public service.",
      },
      {
        id: 3,
        title: "Candidate C",
        description: "Business professional committed to economic development.",
      },
    ];
  }

  // Populate voting modal with election data
  populateVotingModal() {
    if (!this.currentElection) return;

    // Set election title and description
    const titleEl = document.getElementById("votingElectionTitle");
    const descEl = document.getElementById("votingElectionDescription");

    if (titleEl) titleEl.textContent = this.currentElection.title;
    if (descEl)
      descEl.textContent =
        this.currentElection.description || "No description provided";

    // Create ballot options
    const optionsContainer = document.getElementById("ballotOptions");
    if (optionsContainer) {
      optionsContainer.innerHTML = this.ballotOptions
        .map((option) => this.createBallotOption(option))
        .join("");

      // Add event listeners to radio buttons
      optionsContainer
        .querySelectorAll('input[type="radio"]')
        .forEach((radio) => {
          radio.addEventListener("change", (e) => {
            this.selectedOption = parseInt(e.target.value);
          });
        });
    }

    // Reset selected option
    this.selectedOption = null;
  }

  // Create ballot option HTML
  createBallotOption(option) {
    return `
            <div class="ballot-option">
                <input type="radio" id="option-${option.id}" name="vote" value="${option.id}">
                <div class="ballot-option-content">
                    <div class="ballot-option-title">${option.title}</div>
                    <div class="ballot-option-description">${option.description}</div>
                </div>
            </div>
        `;
  }

  // Submit vote
  async submitVote() {
    if (!this.selectedOption) {
      showToast(
        "Please select an option before submitting your vote",
        "warning"
      );
      return;
    }

    if (!this.currentElection) {
      showToast("No election selected", "error");
      return;
    }

    if (!auth.isLoggedIn()) {
      showToast("Please log in to vote", "warning");
      return;
    }

    try {
      // Prepare vote data
      const voteData = {
        electionId: this.currentElection.election_id,
        encryptedVote: this.encryptVote(this.selectedOption),
      };

      // Submit vote via API
      const response = await api.submitVote(voteData);

      // Show success message with verification code
      if (response.data.verificationCode) {
        this.showVoteConfirmation(response.data.verificationCode);
      } else {
        showToast("Vote submitted successfully!", "success");
      }

      // Close voting modal
      hideModal("votingModal");

      // Reset voting state
      this.resetVotingState();
    } catch (error) {
      console.error("Failed to submit vote:", error);

      if (error.status === 409) {
        showToast("You have already voted in this election", "warning");
      } else if (error.status === 403) {
        showToast("You are not authorized to vote in this election", "error");
      } else {
        showToast(error.message || "Failed to submit vote", "error");
      }
    }
  }

  // Encrypt vote (simplified encryption for demo)
  encryptVote(optionId) {
    // In a real implementation, this would use proper encryption
    // For demo purposes, we'll use base64 encoding
    const voteData = {
      option: optionId,
      timestamp: new Date().toISOString(),
      voter: auth.currentUser?.userId,
    };

    return btoa(JSON.stringify(voteData));
  }

  // Show vote confirmation with verification code
  showVoteConfirmation(verificationCode) {
    // Create a custom modal for vote confirmation
    const confirmationHtml = `
            <div class="modal show" id="voteConfirmationModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Vote Submitted Successfully!</h3>
                    </div>
                    <div style="padding: 1.5rem;">
                        <div style="text-align: center; margin-bottom: 1.5rem;">
                            <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--success-color);"></i>
                        </div>
                        <p>Your vote has been securely recorded.</p>
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
                            <strong>Verification Code:</strong>
                            <div style="font-family: monospace; font-size: 1.25rem; margin-top: 0.5rem; word-break: break-all;">
                                ${verificationCode}
                            </div>
                            <small style="color: var(--text-secondary);">
                                Save this code to verify your vote later.
                            </small>
                        </div>
                        <div style="text-align: center;">
                            <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", confirmationHtml);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      const modal = document.getElementById("voteConfirmationModal");
      if (modal) modal.remove();
    }, 30000);
  }

  // Reset voting state
  resetVotingState() {
    this.currentElection = null;
    this.ballotOptions = [];
    this.selectedOption = null;
  }

  // Verify vote with verification code
  async verifyVote(verificationCode) {
    if (!verificationCode) {
      showToast("Please enter a verification code", "warning");
      return;
    }

    try {
      const response = await api.verifyVote(verificationCode);

      if (response.data.status === "verified") {
        showToast(
          `Vote verified! Submitted on ${new Date(
            response.data.timestamp
          ).toLocaleString()}`,
          "success"
        );
      } else {
        showToast("Vote verification failed", "error");
      }

      return response.data;
    } catch (error) {
      console.error("Failed to verify vote:", error);
      showToast("Invalid verification code", "error");
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Voting form submission
    const votingForm = document.getElementById("votingForm");
    if (votingForm) {
      votingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.submitVote();
      });
    }

    // Modal close buttons for voting modal
    const votingModal = document.getElementById("votingModal");
    if (votingModal) {
      const closeButtons = votingModal.querySelectorAll(
        '[data-modal="votingModal"]'
      );
      closeButtons.forEach((button) => {
        button.addEventListener("click", () => {
          this.resetVotingState();
          hideModal("votingModal");
        });
      });
    }
  }
}

// Vote verification modal
function showVoteVerificationModal() {
  const verificationHtml = `
        <div class="modal show" id="voteVerificationModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Verify Your Vote</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="verificationForm" style="padding: 0 1.5rem 1.5rem;">
                    <div class="form-group">
                        <label for="verificationCode">Verification Code</label>
                        <input type="text" id="verificationCode" name="verificationCode" 
                               placeholder="Enter your verification code" required>
                        <small>Enter the verification code you received after voting</small>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            Verify Vote
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", verificationHtml);

  // Handle form submission
  const form = document.getElementById("verificationForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = document.getElementById("verificationCode").value;
      await voting.verifyVote(code);
      document.getElementById("voteVerificationModal").remove();
    });
  }
}

// Create global voting manager instance
const voting = new VotingManager();

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  voting.setupEventListeners();

  // Add verify vote button to navigation (could be added to UI)
  // This is just for demo purposes
  if (auth.isLoggedIn()) {
    // Could add a "Verify Vote" link to user menu
  }
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { VotingManager, voting, showVoteVerificationModal };
}
