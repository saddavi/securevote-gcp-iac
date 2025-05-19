const express = require("express");
const router = express.Router();
const db = require("../models/db");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Get election results (only if election has ended)
router.get("/:electionId", async (req, res, next) => {
  try {
    const { electionId } = req.params;

    // Check if election exists and has ended
    const electionResult = await db.query(
      `SELECT * 
       FROM elections 
       WHERE election_id = $1`,
      [electionId]
    );

    if (electionResult.rows.length === 0) {
      return res.status(404).json({ error: "Election not found" });
    }

    const election = electionResult.rows[0];

    // Check if election has ended
    if (new Date(election.end_date) > new Date()) {
      // Election is still ongoing
      return res.status(403).json({
        error:
          "Election results are not available until the election has ended",
        endDate: election.end_date,
      });
    }

    // Get vote count
    const voteCountResult = await db.query(
      "SELECT COUNT(*) as vote_count FROM votes WHERE election_id = $1",
      [electionId]
    );

    // Get ballots
    const ballotsResult = await db.query(
      `SELECT b.*, 
        (SELECT json_agg(json_build_object(
          'option_id', o.option_id,
          'option_text', o.option_text,
          'option_order', o.option_order
        ))
        FROM ballot_options o
        WHERE o.ballot_id = b.ballot_id
        ORDER BY o.option_order) as options
       FROM ballots b
       WHERE b.election_id = $1`,
      [electionId]
    );

    // In a real application, encrypted votes would need to be tallied
    // For simplicity, we're just returning information about the election and votes

    res.json({
      election: {
        id: election.election_id,
        title: election.title,
        description: election.description,
        startDate: election.start_date,
        endDate: election.end_date,
      },
      voteCount: parseInt(voteCountResult.rows[0].vote_count),
      ballots: ballotsResult.rows,
      // In a real system, decrypt and tally votes here
      message: "In a production system, encrypted votes would be tallied here",
    });
  } catch (error) {
    next(error);
  }
});

// Admin-only route to get detailed results for any election
router.get(
  "/:electionId/admin",
  verifyToken,
  isAdmin,
  async (req, res, next) => {
    try {
      const { electionId } = req.params;

      // Check if election exists
      const electionResult = await db.query(
        `SELECT * 
       FROM elections 
       WHERE election_id = $1`,
        [electionId]
      );

      if (electionResult.rows.length === 0) {
        return res.status(404).json({ error: "Election not found" });
      }

      // Get all votes
      const votesResult = await db.query(
        `SELECT v.vote_id, v.encrypted_choice, v.timestamp, v.verification_code
       FROM votes v
       WHERE v.election_id = $1
       ORDER BY v.timestamp`,
        [electionId]
      );

      // Get audit logs
      const logsResult = await db.query(
        `SELECT *
       FROM audit_logs
       WHERE entity_type = 'election' AND entity_id = $1
       ORDER BY timestamp DESC`,
        [electionId]
      );

      res.json({
        election: electionResult.rows[0],
        votes: votesResult.rows,
        auditLogs: logsResult.rows,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
