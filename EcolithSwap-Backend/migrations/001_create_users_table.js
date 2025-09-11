/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('email', 191).unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('full_name').notNullable();
    table.string('phone', 50).unique();
    table.string('location');
    table.enum('role', ['customer', 'admin', 'station_manager']).defaultTo('customer');
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.boolean('phone_verified').defaultTo(false);
    table.string('verification_token');
    table.timestamp('last_login');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['role']);
    table.index(['is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
