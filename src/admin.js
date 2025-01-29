import pool from '../db.js';
import inquirer from 'inquirer';
import { fetchCurrentBudgets } from './budgets.js';
import { fetchAllProducts, buyProductFromBudget } from './products.js';
import { fetchUsersByTeam } from './users.js';

// Admin Dashboard
export async function adminDashboard() {
  console.log('Welcome to the Admin Dashboard!');

  try {
    const { adminOption } = await inquirer.prompt([
      {
        type: 'list',
        name: 'adminOption',
        message: 'What would you like to manage?',
        choices: ['Users', 'Teams', 'Budgets', 'Products', 'Spend All Current Budgets', 'Exit'],
      },
    ]);

    switch (adminOption) {
      case 'Users':
        await manageUsers();
        break;
      case 'Teams':
        await manageTeams();
        break;
      case 'Budgets':
        await manageBudgets();
        break;
      case 'Products':
        await manageProducts();
        break;
      case 'Spend All Current Budgets':
        await spendAllCurrentBudgets();
        break;
      case 'Exit':
        console.log('Exiting Admin Dashboard...');
        return;
    }

    await adminDashboard(); // Loop back
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

// Manage Users
async function manageUsers() {
  console.log('Managing Users...');
  const { userOption } = await inquirer.prompt([
    {
      type: 'list',
      name: 'userOption',
      message: 'What would you like to do with users?',
      choices: ['Add User', 'Remove User', 'Move User to Another Team', 'Back'],
    },
  ]);

  switch (userOption) {
    case 'Add User':
      const { username, teamId, isAdmin } = await inquirer.prompt([
        { type: 'input', name: 'username', message: 'Enter the username:' },
        { type: 'input', name: 'teamId', message: 'Enter the team ID (or leave blank for none):' },
        { type: 'confirm', name: 'isAdmin', message: 'Is this user an admin?' },
      ]);
      await pool.query(
        `INSERT INTO users (username, team_id, admin) VALUES ($1, $2, $3)`,
        [username, teamId || null, isAdmin]
      );
      console.log(`User "${username}" added successfully.`);
      break;

    case 'Remove User':
      const { userIdToRemove } = await inquirer.prompt([
        { type: 'input', name: 'userIdToRemove', message: 'Enter the user ID to remove:' },
      ]);
      await pool.query(`DELETE FROM users WHERE id = $1`, [userIdToRemove]);
      console.log(`User with ID "${userIdToRemove}" removed successfully.`);
      break;

    case 'Move User to Another Team':
      const { userId, newTeamId } = await inquirer.prompt([
        { type: 'input', name: 'userId', message: 'Enter the user ID:' },
        { type: 'input', name: 'newTeamId', message: 'Enter the new team ID:' },
      ]);
      await pool.query(`UPDATE users SET team_id = $1 WHERE id = $2`, [newTeamId, userId]);
      console.log(`User with ID "${userId}" moved to Team "${newTeamId}".`);
      break;

    case 'Back':
      return;
  }

  await manageUsers(); // Loop back to manage users
}

// Manage Teams
async function manageTeams() {
  console.log('Managing Teams...');
  const { teamOption } = await inquirer.prompt([
    {
      type: 'list',
      name: 'teamOption',
      message: 'What would you like to do with teams?',
      choices: ['Add Team', 'Remove Team', 'View All Teams', 'Back'],
    },
  ]);

  switch (teamOption) {
    case 'Add Team':
      const { teamName } = await inquirer.prompt([
        { type: 'input', name: 'teamName', message: 'Enter the team name:' },
      ]);
      await pool.query(`INSERT INTO teams (name) VALUES ($1)`, [teamName]);
      console.log(`Team "${teamName}" added successfully.`);
      break;

    case 'Remove Team':
      const { teamIdToRemove } = await inquirer.prompt([
        { type: 'input', name: 'teamIdToRemove', message: 'Enter the team ID to remove:' },
      ]);
      await pool.query(`DELETE FROM teams WHERE id = $1`, [teamIdToRemove]);
      console.log(`Team with ID "${teamIdToRemove}" removed successfully.`);
      break;

    case 'View All Teams':
      const teams = await pool.query(`SELECT * FROM teams`);
      console.table(teams.rows);
      break;

    case 'Back':
      return;
  }

  await manageTeams(); // Loop back to manage teams
}

// Manage Budgets
async function manageBudgets() {
  console.log('Managing Budgets...');
  const { budgetOption } = await inquirer.prompt([
    {
      type: 'list',
      name: 'budgetOption',
      message: 'What would you like to do with budgets?',
      choices: ['Add Budget', 'Remove Budget', 'View All Budgets', 'Back'],
    },
  ]);

  switch (budgetOption) {
    case 'Add Budget':
      const { teamId, amount, startDate, endDate } = await inquirer.prompt([
        { type: 'input', name: 'teamId', message: 'Enter the team ID:' },
        { type: 'input', name: 'amount', message: 'Enter the budget amount:' },
        { type: 'input', name: 'startDate', message: 'Enter the start date (YYYY-MM-DD):' },
        { type: 'input', name: 'endDate', message: 'Enter the end date (YYYY-MM-DD):' },
      ]);
      await pool.query(
        `INSERT INTO budgets (team_id, amount, start_date, end_date) VALUES ($1, $2, $3, $4)`,
        [teamId, amount, startDate, endDate]
      );
      console.log('Budget added successfully.');
      break;

    case 'Remove Budget':
      const { budgetIdToRemove } = await inquirer.prompt([
        { type: 'input', name: 'budgetIdToRemove', message: 'Enter the budget ID to remove:' },
      ]);
      await pool.query(`DELETE FROM budgets WHERE id = $1`, [budgetIdToRemove]);
      console.log(`Budget with ID "${budgetIdToRemove}" removed successfully.`);
      break;

    case 'View All Budgets':
      const budgets = await pool.query(`SELECT * FROM budgets`);
      console.table(budgets.rows);
      break;

    case 'Back':
      return;
  }

  await manageBudgets(); // Loop back to manage budgets
}

// Manage Products
async function manageProducts() {
  console.log('Managing Products...');
  const { productOption } = await inquirer.prompt([
    {
      type: 'list',
      name: 'productOption',
      message: 'What would you like to do with products?',
      choices: ['Add Product', 'Remove Product', 'View All Products', 'Back'],
    },
  ]);

  switch (productOption) {
    case 'Add Product':
      const { productName, price } = await inquirer.prompt([
        { type: 'input', name: 'productName', message: 'Enter the product name:' },
        { type: 'input', name: 'price', message: 'Enter the product price:' },
      ]);
      await pool.query(`INSERT INTO products (name, price) VALUES ($1, $2)`, [productName, price]);
      console.log(`Product "${productName}" added successfully.`);
      break;

    case 'Remove Product':
      const { productIdToRemove } = await inquirer.prompt([
        { type: 'input', name: 'productIdToRemove', message: 'Enter the product ID to remove:' },
      ]);
      await pool.query(`DELETE FROM products WHERE id = $1`, [productIdToRemove]);
      console.log(`Product with ID "${productIdToRemove}" removed successfully.`);
      break;

    case 'View All Products':
      const products = await pool.query(`SELECT * FROM products`);
      console.table(products.rows);
      break;

    case 'Back':
      return;
  }

  await manageProducts(); // Loop back to manage products
}

// Spend All Current Budgets
export async function spendAllCurrentBudgets() {
  console.log('💰 Spending all available budgets...');

  // Fetch all active budgets
  const budgets = await fetchCurrentBudgets();

  if (!budgets.length) {
    console.log('❌ No active budgets available.');
    return;
  }

  // Fetch available products
  const products = await fetchAllProducts();
  if (!products.length) {
    console.log('❌ No products available for purchase.');
    return;
  }

  for (const budget of budgets) {
    console.log(`💰 Evaluating Budget: ${budget.name} (€${budget.amount}) for Team ${budget.team_id}`);

    // Get all team members
    const teamMembers = await fetchUsersByTeam(budget.team_id);
    if (!teamMembers.length) {
      console.log(`⚠️ No members in Team ${budget.team_id}. Skipping...`);
      continue;
    }

    let remainingBudget = parseFloat(budget.amount);
    let maxPerMember = Math.floor(remainingBudget / teamMembers.length);

    // Find the most expensive product within the budget per member
    let bestProduct = products
      .filter(p => p.price <= maxPerMember)
      .sort((a, b) => b.price - a.price)[0];

    if (!bestProduct) {
      console.log(`⚠️ No product fits within the budget per person.`);
      continue;
    }

    for (const user of teamMembers) {
      if (remainingBudget >= bestProduct.price) {
        console.log(`✅ Buying "${bestProduct.name}" (€${bestProduct.price}) for ${user.username}`);
        await buyProductFromBudget([budget], bestProduct, user); // Spend budget
        remainingBudget -= bestProduct.price;
      } else {
        console.log(`❌ Not enough budget left for ${user.username} to buy anything.`);
      }
    }

    console.log(`✅ Budget for Team ${budget.team_id} optimized. Remaining: €${remainingBudget}`);
  }
}