/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('stations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.string('name').notNullable();
    table.text('address').notNullable();
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.enum('station_type', ['swap', 'charge', 'both']).notNullable();
    table.integer('available_batteries').defaultTo(0);
    table.integer('total_slots').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.boolean('accepts_plastic').defaultTo(true);
    table.boolean('self_service').defaultTo(false);
    table.boolean('maintenance_mode').defaultTo(false);
    table.text('operating_hours');
    table.text('contact_info');
    table.string('manager_id').references('id').inTable('users');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['latitude', 'longitude']);
    table.index(['station_type']);
    table.index(['is_active']);
    table.index(['accepts_plastic']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('stations');
};
