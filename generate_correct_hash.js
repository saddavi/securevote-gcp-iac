const bcrypt = require("bcrypt");

async function generateCorrectHash() {
  const password = "Test1234!";
  const saltRounds = 10;

  try {
    // Generate the correct hash
    const correctHash = await bcrypt.hash(password, saltRounds);

    // Verify it works
    const isValid = await bcrypt.compare(password, correctHash);

    console.log("=== BCRYPT HASH GENERATION ===");
    console.log("Password:", password);
    console.log("Correct Hash:", correctHash);
    console.log("Verification:", isValid ? "✅ VALID" : "❌ INVALID");
    console.log("");

    // Test the old incorrect hash for comparison
    const oldIncorrectHash =
      "$2b$10$4tVQpt./tu3PpDwYkmRkdOwKahIfcfiayAOc0ffXp8P3ZDzh9KUXa";
    const oldHashValid = await bcrypt.compare(password, oldIncorrectHash);

    console.log("=== OLD HASH VERIFICATION ===");
    console.log("Old Hash:", oldIncorrectHash);
    console.log("Old Hash Valid:", oldHashValid ? "✅ VALID" : "❌ INVALID");
    console.log("");

    console.log("=== SQL UPDATE STATEMENT ===");
    console.log(
      `UPDATE users SET hashed_password = '${correctHash}' WHERE email = 'test@example.com';`
    );

    return correctHash;
  } catch (error) {
    console.error("Error generating hash:", error);
    throw error;
  }
}

generateCorrectHash().catch(console.error);
