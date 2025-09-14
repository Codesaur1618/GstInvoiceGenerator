const knex = require('knex');
const path = require('path');

// Database configuration
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../../db/local.db')
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
