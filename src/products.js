import pool from '../db.js';
import { fetchBudgetsByTeamId } from './budgets.js';

// Fetch all products
export async function fetchAllProducts() {
  const result = await pool.query(`SELECT * FROM products;`);
  return result.rows;
}

// Add a new product
export async function addProduct(name, price) {
  await pool.query(
    `INSERT INTO products (name, price) VALUES ($1, $2)`,
    [name, price]
  );
  console.log(`✅ Product "${name}" added successfully at €${price}.`);
}

// Remove a product
export async function removeProduct(productId) {
  await pool.query(`DELETE FROM products WHERE id = $1`, [productId]);
  console.log(`✅ Product with ID "${productId}" removed successfully.`);
}

// Get product details by ID
export async function getProductById(productId) {
  const result = await pool.query(`SELECT * FROM products WHERE id = $1;`, [productId]);
  return result.rows[0];
}

// Buy a product for a user (fetches budgets)
export async function buyProductForUser(user, productId) {
  const product = await getProductById(productId);
  if (!product) {
    console.log('❌ Invalid product selection.');
    return;
  }

  console.log(`💰 Checking budget for purchase: ${product.name} (€${product.price})`);

  let budgets = await fetchBudgetsByTeamId(user.team_id);
  let currentBudgets = budgets.filter((budget) => budget.status === 'current')
                              .sort((a, b) => new Date(a.end_date) - new Date(b.end_date));

  if (!currentBudgets.length) {
    console.log('❌ No active budget available for this purchase.');
    return;
  }

  let totalBudgetAvailable = currentBudgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  if (totalBudgetAvailable < product.price) {
    console.log(`❌ Not enough total funds across all budgets to purchase "${product.name}".`);
    return;
  }

  // Spend budget on the product
  await buyProductFromBudget(currentBudgets, product, user);
}

// Buy a product from a specific budget
export async function buyProductFromBudget(budgets, product, user) {
  let remainingPrice = parseFloat(product.price);

  for (let budget of budgets) {
    if (remainingPrice <= 0) break;

    let budgetAmount = parseFloat(budget.amount);
    let amountToDeduct = Math.min(remainingPrice, budgetAmount);

    if (amountToDeduct > 0) {
      console.log(`🔎 Using Budget: ${budget.name} (€${budget.amount}) (Valid: ${budget.start_date} - ${budget.end_date})`);

      // Deduct amount from the budget
      await pool.query(`UPDATE budgets SET amount = amount - $1 WHERE id = $2;`, [amountToDeduct, budget.id]);

      remainingPrice -= amountToDeduct;
    }
  }

  // Log the transaction
  await pool.query(
    `INSERT INTO transactions (user_id, product_id, team_id, amount) VALUES ($1, $2, $3, $4);`,
    [user.id, product.id, user.team_id, product.price]
  );

  console.log(`✅ Successfully purchased "${product.name}" for €${product.price}.`);

  // Log transaction into logs table
  await pool.query(`INSERT INTO logs (executioner, message) VALUES ($1, $2)`, 
    [user.username, `Purchased "${product.name}" for €${product.price}`]);
}
