// Validation utilities for SecureVote API

/**
 * Validates an email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - Whether the email is valid
 */
const validateEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - Whether the password meets strength requirements
 */
const validatePassword = (password) => {
  // At least 8 characters, containing letters, numbers and symbols
  const re = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return re.test(password);
};

/**
 * Sanitizes an input string to prevent SQL injection
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeInput = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/[\\$'"]/g, "\\$&")
    .trim();
};

module.exports = {
  validateEmail,
  validatePassword,
  sanitizeInput,
};
