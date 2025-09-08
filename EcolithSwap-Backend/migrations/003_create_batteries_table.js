/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('batteries', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.string('battery_code').unique().notNullable();
    table.string('serial_number').unique().notNullable();
    table.string('model').notNullable();
    table.string('manufacturer');
    table.decimal('capacity_kwh', 8, 2).notNullable();
    table.decimal('current_charge_percentage', 5, 2).defaultTo(100);
    table.enum('status', ['available', 'rented', 'charging', 'maintenance', 'retired']).defaultTo('available');
    table.enum('health_status', ['excellent', 'good', 'fair', 'poor', 'critical']).defaultTo('excellent');
    table.integer('cycle_count').defaultTo(0);
    table.date('manufacture_date');
    table.date('last_maintenance_date');
    table.date('next_maintenance_due');
    table.uuid('current_station_id').references('id').inTable('stations');
    table.uuid('current_rental_id').references('id').inTable('battery_rentals');
    table.text('notes');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['battery_code']);
    table.index(['status']);
    table.index(['health_status']);
    table.index(['current_station_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('batteries');
};
