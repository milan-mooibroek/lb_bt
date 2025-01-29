import pool from '../db.js';
import inquirer from 'inquirer';
import { fetchBudgetsByTeamId } from './budgets.js';
import { fetchAllProducts, buyProductForUser } from './products.js';
import { adminDashboard } from './admin.js';

// Fetch all users with their team names
export async function fetchUsers() {
  const result = await pool.query(`
    SELECT users.*, teams.name AS team_name
    FROM users
    LEFT JOIN teams ON users.team_id = teams.id;
  `);
  return result.rows;
}

// Fetch users by team
export async function fetchUsersByTeam(teamId = null) {
  let query = `
    SELECT users.id, users.username, users.admin, teams.name AS team_name
    FROM users
    LEFT JOIN teams ON users.team_id = teams.id
  `;

  const values = [];
  if (teamId) {
    query += ` WHERE users.team_id = $1`;
    values.push(teamId);
  }

  query += ` ORDER BY teams.name, users.username;`;

  const result = await pool.query(query, values);
  return result.rows;
}

// User login flow
export async function userLogin() {
  console.log('Welcome to the Budget Tool!');

  try {
    const users = await fetchUsers();

    // Prompt the user to select a username (formatted with team name)
    const { username } = await inquirer.prompt([
      {
        type: 'list',
        name: 'username',
        message: 'Please select your username:',
        choices: users.map((user) => ({
          name: `${user.username} (${user.team_name || 'No Team'})`,
          value: user.username
        })),
      },
    ]);

    // Find the selected user
    const user = users.find((u) => u.username === username);

    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log(`Logged in as ${user.username} (${user.admin ? 'Admin' : 'User'})`);

    if (user.admin) {
      await adminDashboard(); 
    } else {
      await userDashboard(user);
    }
  } catch (error) {
    console.error('❌ An error occurred:', error.message);
  }
}

// User dashboard
async function userDashboard(user) {
  console.log(`Welcome, ${user.username}!`);
  console.log(`You are in team: ${user.team_name || 'No Team'}.`);

  if (!user.team_id) {
    console.log('❌ You are not part of any team.');
    return;
  }

  const budgets = await fetchBudgetsByTeamId(user.team_id);

  if (!budgets.length) {
    console.log('❌ No budgets assigned to your team.');
    return;
  }

  console.log('📌 Available Budgets:');
  budgets.forEach((budget) => {
    console.log(`- €${budget.amount} (${budget.status}) (Valid: ${budget.start_date} - ${budget.end_date})`);
  });

  const { userOption } = await inquirer.prompt([
    {
      type: 'list',
      name: 'userOption',
      message: 'What would you like to do?',
      choices: ['Buy a Product', 'View Transactions', 'Logout'],
    },
  ]);

  switch (userOption) {
    case 'Buy a Product':
      await selectProduct(user);
      break;
    case 'View Transactions':
      await viewTransactions(user);
      break;
    case 'Logout':
      console.log('🔴 Logging out...');
      return;
  }

  await userDashboard(user);
}

// Select a product from a list
async function selectProduct(user) {
  console.log('🛒 Viewing available products...');
  const products = await fetchAllProducts();

  if (!products.length) {
    console.log('❌ No products available.');
    return;
  }

  const { selectedProductId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedProductId',
      message: 'Select a product to purchase:',
      choices: products.map((product) => ({
        name: `${product.name} (€${product.price})`,
        value: product.id,
      })),
    },
  ]);

  await buyProductForUser(user, selectedProductId);
}

// View transactions
async function viewTransactions(user) {
  console.log('📜 Fetching your transactions...');
  const result = await pool.query(
    `SELECT t.*, p.name AS product_name 
     FROM transactions t
     JOIN products p ON t.product_id = p.id
     WHERE t.user_id = $1;`,
    [user.id]
  );

  const transactions = result.rows;

  if (!transactions.length) {
    console.log('❌ No transactions found.');
    return;
  }

  console.log('📌 Your Transactions:');
  transactions.forEach((tx) => {
    console.log(
      `- Product: ${tx.product_name}, Amount: €${tx.amount}, Date: ${tx.transaction_date}`
    );
  });
}

// Export functions for external use
