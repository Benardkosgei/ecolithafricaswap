const knex = require('knex');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    timezone: 'UTC'
  }
};

// Function to create database if it doesn't exist
async function createDatabase() {
  const dbName = process.env.DB_NAME || 'ecolithswap';
  const db = knex(dbConfig);
  
  try {
    console.log('🔍 Checking if database exists...');
    
    // Check if database exists
    const result = await db.raw(`SHOW DATABASES LIKE '${dbName}'`);
    
    if (result[0].length === 0) {
      console.log(`📁 Creating database '${dbName}'...`);
      await db.raw(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } else {
      console.log(`✅ Database '${dbName}' already exists`);
    }
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Function to run migrations
async function runMigrations() {
  const dbName = process.env.DB_NAME || 'ecolithswap';
  
  const migrationConfig = {
    ...dbConfig,
    connection: {
      ...dbConfig.connection,
      database: dbName
    },
    migrations: {
      directory: path.join(__dirname, '../migrations'),
      tableName: 'knex_migrations'
    }
  };
  
  const db = knex(migrationConfig);
  
  try {
    console.log('🔄 Running database migrations...');
    
    const [batchNo, log] = await db.migrate.latest();
    
    if (log.length === 0) {
      console.log('✅ Database is already up to date');
    } else {
      console.log(`✅ Batch ${batchNo} run: ${log.length} migrations`);
      log.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Main setup function
async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    
    await createDatabase();
    await runMigrations();
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update your .env file with the correct database credentials');
    console.log('   2. Run "npm run seed-db" to populate with sample data (optional)');
    console.log('   3. Run "npm start" to start the server');
    
  } catch (error) {
    console.error('💥 Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase, createDatabase, runMigrations };