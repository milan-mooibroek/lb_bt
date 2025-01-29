import pool from '../db.js';

// Fetch budgets by team ID and prioritize the soonest-expiring budget
export async function fetchBudgetsByTeamId(teamId) {
  const result = await pool.query(`
    SELECT 
      id, name, team_id, amount, start_date, end_date,
      (CASE
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'current'
        WHEN CURRENT_DATE < start_date THEN 'upcoming'
        ELSE 'expired'
      END) AS status 
    FROM budgets
    WHERE team_id = $1
    ORDER BY 
      (CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 1  -- Prioritize current
        WHEN CURRENT_DATE < start_date THEN 2  -- Then upcoming
        ELSE 3  -- Expired goes last
      END), 
      end_date ASC;  -- Choose the soonest-expiring current budget first
  `, [teamId]);

  return result.rows;
}

// Fetch all budgets across teams (same prioritization logic)
export async function fetchAllBudgets() {
  const result = await pool.query(`
    SELECT 
      id, name, team_id, amount, start_date, end_date,
      (CASE
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'current'
        WHEN CURRENT_DATE < start_date THEN 'upcoming'
        ELSE 'expired'
      END) AS status
    FROM budgets
    ORDER BY 
      (CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 1
        WHEN CURRENT_DATE < start_date THEN 2
        ELSE 3
      END), 
      end_date ASC;
  `);

  return result.rows;
}

// Allocate budget evenly among team members for spending
export async function allocateBudget(teamId, amountPerUser) {
  const users = await pool.query(`SELECT id, username FROM users WHERE team_id = $1;`, [teamId]);
  if (!users.rows.length) {
    console.log(`❌ No users found for team ID ${teamId}.`);
    return [];
  }

  const userAllocations = users.rows.map(user => ({
    userId: user.id,
    username: user.username,
    allocatedAmount: amountPerUser
  }));

  return userAllocations;
}

// Add a budget (with team ID, name, and validation)
export async function addBudget(adminUser, teamId, name, amount, startDate, endDate) {
  // Prevent overlapping budgets
  const checkExisting = await pool.query(`
    SELECT * FROM budgets WHERE team_id = $1 AND (
      ($2 BETWEEN start_date AND end_date) OR
      ($3 BETWEEN start_date AND end_date) OR
      (start_date BETWEEN $2 AND $3) OR
      (end_date BETWEEN $2 AND $3)
    );
  `, [teamId, startDate, endDate]);

  if (checkExisting.rows.length > 0) {
    console.log(`❌ Cannot add budget "${name}". A conflicting budget already exists for this team.`);
    return;
  }

  await pool.query(
    `INSERT INTO budgets (team_id, name, amount, start_date, end_date) VALUES ($1, $2, $3, $4, $5)`,
    [teamId, name, amount, startDate, endDate]
  );

  console.log(`✅ Budget "${name}" (€${amount}) added to Team ${teamId} from ${startDate} to ${endDate}.`);

  // Log admin action
  await pool.query(
    `INSERT INTO logs (executioner, message) VALUES ($1, $2)`,
    [adminUser, `Added budget "${name}" (€${amount}) for Team ${teamId}`]
  );
}

// Remove a budget by ID
export async function removeBudget(adminUser, budgetId) {
  const budget = await pool.query(`SELECT * FROM budgets WHERE id = $1`, [budgetId]);

  if (!budget.rows.length) {
    console.log(`❌ Budget with ID "${budgetId}" not found.`);
    return;
  }

  await pool.query(`DELETE FROM budgets WHERE id = $1`, [budgetId]);
  console.log(`✅ Budget "${budget.rows[0].name}" removed successfully.`);

  // Log admin action
  await pool.query(
    `INSERT INTO logs (executioner, message) VALUES ($1, $2)`,
    [adminUser, `Removed budget "${budget.rows[0].name}"`]
  );
}

export async function fetchCurrentBudgets() {
  const result = await pool.query(`
    SELECT 
      b.id, b.name, b.team_id, b.amount, b.start_date, b.end_date,
      t.name AS team_name,
      (SELECT COUNT(*) FROM users WHERE team_id = b.team_id) AS team_size
    FROM budgets b
    JOIN teams t ON b.team_id = t.id
    WHERE CURRENT_DATE BETWEEN b.start_date AND b.end_date
    ORDER BY b.end_date ASC; -- Soonest expiring budget first
  `);

  return result.rows;
}
