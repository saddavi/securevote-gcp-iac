const express = require("express");
const router = express.Router();
const db = require("../models/db");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Get all elections
router.get("/", async (req, res, next) => {
  try {
    let query = `
      SELECT election_id, title, description, start_date, end_date, status
      FROM elections
      WHERE 1=1
    `;

    const queryParams = [];

    // Filter for active elections
    if (req.query.active === "true") {
      query += " AND status = $1 AND start_date <= NOW() AND end_date >= NOW()";
      queryParams.push("active");
    }

    // Filter by status
    if (req.query.status && !req.query.active) {
      query += " AND status = $1";
      queryParams.push(req.query.status);
    }

    query += " ORDER BY start_date DESC";

    const result = await db.query(query, queryParams);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get election by ID
router.get("/:id", async (req, res, next) => {
  try {
    // Get election details
    const electionResult = await db.query(
      `SELECT e.*, u.email as creator_email, u.full_name as creator_name
       FROM elections e
       LEFT JOIN users u ON e.created_by = u.user_id
       WHERE e.election_id = $1`,
      [req.params.id]
    );

    if (electionResult.rows.length === 0) {
      return res.status(404).json({ error: "Election not found" });
    }

    const election = electionResult.rows[0];

    // Get ballots for this election
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
      [req.params.id]
    );

    // Add ballots to the election object
    election.ballots = ballotsResult.rows;

    res.json(election);
  } catch (error) {
    next(error);
  }
});

// Create a new election (admin only)
router.post("/", verifyToken, isAdmin, async (req, res, next) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      status = "draft",
    } = req.body;

    // Validate required fields
    if (!title || !start_date || !end_date) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["title", "start_date", "end_date"],
      });
    }

    // Create the election
    const result = await db.query(
      `INSERT INTO elections (title, description, start_date, end_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, start_date, end_date, status, req.user.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update election (admin only)
router.put("/:id", verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { title, description, start_date, end_date, status } = req.body;

    // Check if election exists
    const checkResult = await db.query(
      "SELECT * FROM elections WHERE election_id = $1",
      [req.params.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Election not found" });
    }

    // Update the election
    const result = await db.query(
      `UPDATE elections 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_date = COALESCE($3, start_date),
           end_date = COALESCE($4, end_date),
           status = COALESCE($5, status)
       WHERE election_id = $6
       RETURNING *`,
      [title, description, start_date, end_date, status, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Add a ballot to an election (admin only)
router.post("/:id/ballots", verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { title, instructions, options } = req.body;

    // Validate required fields
    if (!title || !options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["title", "options (array)"],
      });
    }

    // Start a transaction
    const client = await db.getClient();

    try {
      await client.query("BEGIN");

      // Create the ballot
      const ballotResult = await client.query(
        `INSERT INTO ballots (election_id, title, instructions)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [req.params.id, title, instructions]
      );

      const ballotId = ballotResult.rows[0].ballot_id;

      // Add ballot options
      for (let i = 0; i < options.length; i++) {
        await client.query(
          `INSERT INTO ballot_options (ballot_id, option_text, option_order)
           VALUES ($1, $2, $3)`,
          [ballotId, options[i].text, i + 1]
        );
      }

      await client.query("COMMIT");

      // Get the complete ballot with options
      const completeResult = await db.query(
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
         WHERE b.ballot_id = $1`,
        [ballotId]
      );

      res.status(201).json(completeResult.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

// Delete an election (admin only)
router.delete("/:id", verifyToken, isAdmin, async (req, res, next) => {
  try {
    // Check if election exists
    const checkResult = await db.query(
      "SELECT * FROM elections WHERE election_id = $1",
      [req.params.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Election not found" });
    }

    // Delete the election (cascade will handle ballots, options, and votes)
    await db.query("DELETE FROM elections WHERE election_id = $1", [
      req.params.id,
    ]);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
