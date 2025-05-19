const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../models/db");
const { verifyToken } = require("../middleware/auth");

// Submit a vote
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { electionId, encryptedChoice } = req.body;

    // Validate required fields
    if (!electionId || !encryptedChoice) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["electionId", "encryptedChoice"],
      });
    }

    // Check if election exists and is active
    const electionResult = await db.query(
      `SELECT * 
       FROM elections 
       WHERE election_id = $1 
       AND status = 'active'
       AND start_date <= NOW()
       AND end_date >= NOW()`,
      [electionId]
    );

    if (electionResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Election is not active or does not exist" });
    }

    // Create a voter hash based on user ID and election ID
    // This allows anonymous voting while preventing duplicate votes
    const voterHash = crypto
      .createHash("sha256")
      .update(`${req.user.userId}-${electionId}`)
      .digest("hex");

    // Check if user already voted in this election
    const voteCheckResult = await db.query(
      "SELECT * FROM votes WHERE voter_hash = $1 AND election_id = $2",
      [voterHash, electionId]
    );

    if (voteCheckResult.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "You have already voted in this election" });
    }

    // Generate a verification code
    const verificationCode = crypto
      .createHash("sha256")
      .update(`${voterHash}-${Date.now()}`)
      .digest("hex")
      .substring(0, 10)
      .toUpperCase();

    // Record the vote
    const result = await db.query(
      `INSERT INTO votes (election_id, voter_hash, encrypted_choice, verification_code)
       VALUES ($1, $2, $3, $4)
       RETURNING vote_id, timestamp, verification_code`,
      [electionId, voterHash, encryptedChoice, verificationCode]
    );

    // Log the voting action without revealing the voter's identity
    await db.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, ip_address, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        "VOTE_CAST",
        "election",
        electionId,
        req.ip,
        JSON.stringify({
          timestamp: new Date(),
          verificationCode: verificationCode,
        }),
      ]
    );

    res.status(201).json({
      message: "Vote recorded successfully",
      voteId: result.rows[0].vote_id,
      timestamp: result.rows[0].timestamp,
      verificationCode: result.rows[0].verification_code,
    });
  } catch (error) {
    next(error);
  }
});

// Verify a vote with verification code
router.get("/verify/:code", async (req, res, next) => {
  try {
    const verificationCode = req.params.code;

    // Find the vote
    const voteResult = await db.query(
      `SELECT v.vote_id, v.timestamp, v.election_id, e.title as election_title
       FROM votes v
       JOIN elections e ON v.election_id = e.election_id
       WHERE v.verification_code = $1`,
      [verificationCode]
    );

    if (voteResult.rows.length === 0) {
      return res.status(404).json({ error: "Vote not found" });
    }

    res.json({
      verified: true,
      vote: voteResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
