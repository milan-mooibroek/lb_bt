import pool from '../db.js';

// Fetch all teams
export async function fetchAllTeams() {
  const result = await pool.query(`SELECT * FROM teams;`);
  return result.rows;
}

// Add a new team
export async function addTeam(name) {
  await pool.query(`INSERT INTO teams (name) VALUES ($1)`, [name]);
  console.log(`Team "${name}" added successfully.`);
}

// Remove a team
export async function removeTeam(teamId) {
  await pool.query(`DELETE FROM teams WHERE id = $1`, [teamId]);
  console.log(`Team with ID "${teamId}" removed successfully.`);
}

// Get team details by ID
export async function getTeamById(teamId) {
  const result = await pool.query(`SELECT * FROM teams WHERE id = $1`, [teamId]);
  return result.rows[0];
}

// Move a user to another team
export async function moveUserToTeam(userId, newTeamId) {
  await pool.query(`UPDATE users SET team_id = $1 WHERE id = $2`, [newTeamId, userId]);
  console.log(`User with ID "${userId}" moved to Team "${newTeamId}".`);
}
