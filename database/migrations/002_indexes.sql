-- Add indexes for better performance
CREATE INDEX idx_elections_dates ON elections(start_date, end_date);
CREATE INDEX idx_votes_election_id ON votes(election_id);
CREATE INDEX idx_votes_voter_hash ON votes(voter_hash);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
