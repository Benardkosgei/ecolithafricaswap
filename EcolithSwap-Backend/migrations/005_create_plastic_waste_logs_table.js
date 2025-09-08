/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('plastic_waste_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.uuid('station_id').references('id').inTable('stations').notNullable();
    table.decimal('weight_kg', 8, 3).notNullable();
    table.integer('points_earned').notNullable();
    table.decimal('co2_saved_kg', 8, 3);
    table.enum('plastic_type', ['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'OTHER']).defaultTo('OTHER');
    table.text('description');
    table.string('receipt_number').unique();
    table.boolean('verified').defaultTo(false);
    table.uuid('verified_by').references('id').inTable('users');
    table.timestamp('verified_at');
    table.timestamp('logged_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['station_id']);
    table.index(['logged_at']);
    table.index(['verified']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('plastic_waste_logs');
};
