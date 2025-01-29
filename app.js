import { userLogin } from './src/users.js';

// Instructions: This is the main entry point for the CLI application.
// - Starts the user login process and directs users to the correct dashboard. Was planning on adding session for user to add to log table, but time

async function main() {
  await userLogin();
}

main().catch((err) => {
  console.error('An unexpected error occurred:', err.message);
});
