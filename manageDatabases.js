import pool from './db.js';

// Instructions: This script sets up the PostgreSQL database for the budget tool.
// It creates tables, inserts mock data, and manages the schema.

// Why assign Frank to Marketing?
// - Ensures he has two active budgets at the same time for testing.
// - Allows proper validation of budget selection when purchasing expensive items + logical logical budget

async function dropTables() {
  console.log('Dropping all tables...');

  const tables = ['transactions', 'budgets', 'products', 'users', 'teams', 'logs'];
  for (const table of tables) {
    await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
  }

  console.log('✅ All tables dropped.');
}

async function createTables() {
  console.log('Creating tables...');

  await pool.query(`
    CREATE TABLE teams (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `);

  await pool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      team_id INT REFERENCES teams(id) ON DELETE SET NULL,
      admin BOOLEAN DEFAULT FALSE
    );
  `);

  await pool.query(`
    CREATE TABLE products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      price NUMERIC NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE budgets (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,  -- Budget now has a name
      team_id INT REFERENCES teams(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE transactions (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      product_id INT REFERENCES products(id) ON DELETE CASCADE,
      team_id INT REFERENCES teams(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE logs (
      id SERIAL PRIMARY KEY,
      executioner TEXT NOT NULL, 
      message TEXT NOT NULL,     
      action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ All tables created.');
}

async function insertMockData() {
  console.log('Inserting mock data...');

  // Insert Teams
  await pool.query(`
    INSERT INTO teams (name) VALUES 
      ('Marketing'),
      ('Field Office')
    ON CONFLICT DO NOTHING;
  `);

  // Insert Users with Real Names (Frank is always in Marketing)
  await pool.query(`
    INSERT INTO users (username, team_id, admin) VALUES
      ('Admin', NULL, TRUE),  -- Admin has no team
      ('Frank', (SELECT id FROM teams WHERE name = 'Marketing'), FALSE),  -- 🆕 Always in Marketing
      ('Charles', (SELECT id FROM teams WHERE name = 'Marketing'), FALSE),
      ('Diana', (SELECT id FROM teams WHERE name = 'Field Office'), FALSE),
      ('Emily', (SELECT id FROM teams WHERE name = 'Field Office'), FALSE),
      ('Toby', (SELECT id FROM teams WHERE name = 'Field Office'), FALSE)
    ON CONFLICT DO NOTHING;
  `);

  // Insert Products (Including an Expensive Product)
  await pool.query(`
    INSERT INTO products (name, price) VALUES
      ('Software', 100.00),
      ('Congress', 500.00),
      ('Hardware', 250.00),
      ('Enterprise Server', 3000.00) -- 🆕 Expensive product for budget selection test
    ON CONFLICT DO NOTHING;
  `);

  // Insert Budgets with Two Active Budgets for Marketing Team
  await pool.query(`
    INSERT INTO budgets (name, team_id, amount, start_date, end_date) VALUES
      -- 🆕 Two active budgets for Marketing (Edge Case)
      ('Short-Term Marketing Budget', (SELECT id FROM teams WHERE name = 'Marketing'), 1500, '2025-01-01', '2025-06-30'),
      ('Long-Term Marketing Budget', (SELECT id FROM teams WHERE name = 'Marketing'), 5000, '2025-01-01', '2025-12-31'),

      ('Field Office Annual', (SELECT id FROM teams WHERE name = 'Field Office'), 7000, '2025-01-01', '2025-12-31'),
      ('Field Office Special', (SELECT id FROM teams WHERE name = 'Field Office'), 2500, '2025-06-01', '2025-08-31')
    ON CONFLICT DO NOTHING;
  `);

  // Insert Example Logs
  await pool.query(`
    INSERT INTO logs (executioner, message) VALUES
      ('Admin', 'Created initial teams and users'),
      ('Admin', 'Assigned budgets to teams'),
      ('Admin', 'Ensured Frank is always in Marketing for testing')
    ON CONFLICT DO NOTHING;
  `);

  console.log('✅ Mock data inserted.');
}

// Instructions: Run this function to manage the database.
// Usage: `node manageDatabase.js delete create insert`
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('delete')) await dropTables();
  if (args.includes('create')) await createTables();
  if (args.includes('insert')) await insertMockData();

  console.log('🚀 Operation complete.');
  pool.end();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  pool.end();
});
