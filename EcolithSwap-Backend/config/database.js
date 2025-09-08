const knex = require('knex');
require('dotenv').config();

const dbConfig = {
  client: process.env.DB_CLIENT || 'sqlite3',
  connection: process.env.DB_CLIENT === 'sqlite3' ? {
    filename: process.env.DB_FILENAME || './ecolithswap.db'
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecolithswap',
    charset: 'utf8mb4',
    timezone: 'UTC'
  },
  useNullAsDefault: true,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './seeds'
  },
  acquireConnectionTimeout: 60000,
  debug: process.env.NODE_ENV === 'development'
};

const db = knex(dbConfig);

// Test connection on startup
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ MySQL database connection established');
  })
  .catch((err) => {
    console.error('❌ MySQL database connection failed:', err.message);
  });

module.exports = db;
