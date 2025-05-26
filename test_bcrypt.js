const bcrypt = require("bcrypt");

async function testBcrypt() {
  const password = "password";
  const storedHash =
    "$2b$10$n9TvvhfLp0n8NtZpGZmTT.W.UoFXSUGRadPvTYajrUodmDgfsBYcS";

  console.log("Testing bcrypt with:");
  console.log("Password:", password);
  console.log("Stored hash:", storedHash);

  try {
    const result = await bcrypt.compare(password, storedHash);
    console.log("bcrypt.compare result:", result);

    // Also test generating a new hash
    const newHash = await bcrypt.hash(password, 10);
    console.log("New hash generated:", newHash);

    const newResult = await bcrypt.compare(password, newHash);
    console.log("New hash comparison result:", newResult);
  } catch (error) {
    console.error("Error during bcrypt operations:", error);
  }
}

testBcrypt();
