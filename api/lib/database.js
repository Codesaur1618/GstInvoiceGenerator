const knex = require('knex');

// Database configuration for Vercel
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: process.env.DATABASE_URL || ':memory:'
  },
  useNullAsDefault: true,
  pool: {
    min: 1,
    max: 10
  }
});

// Test the connection
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
  });

module.exports = db;
