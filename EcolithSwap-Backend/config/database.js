const knex = require('knex');
const path = require('path');

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: path.resolve(process.cwd(), `.env.${env}`) });

const dbConfig = {
  client: process.env.DB_CLIENT || 'mysql',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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
    directory: '../migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: '../seeds'
  },
  acquireConnectionTimeout: 60000,
  debug: env === 'development'
};

const db = knex(dbConfig);

db.raw('SELECT 1')
  .then(() => {
    console.log(`✅ Database connection established for ${env} environment`);
  })
  .catch((err) => {
    console.error(`❌ Database connection failed for ${env} environment:`, err.message);
  });

module.exports = db;
