import pg from 'pg';

// Hardcoded PostgreSQL credentials
const pool = new pg.Pool({
  user: "user",              // PostgreSQL username
  host: "budget_postgres",   // Container name from docker-compose.yml
  database: "budgets",       // Database name
  password: "password",      // Password
  port: 5432,                // Default PostgreSQL port
});

export default pool;
