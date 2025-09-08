/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('battery_rentals', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.uuid('battery_id').references('id').inTable('batteries').notNullable();
    table.uuid('pickup_station_id').references('id').inTable('stations').notNullable();
    table.uuid('return_station_id').references('id').inTable('stations');
    table.timestamp('start_time').defaultTo(knex.fn.now());
    table.timestamp('end_time');
    table.decimal('initial_charge_percentage', 5, 2);
    table.decimal('final_charge_percentage', 5, 2);
    table.decimal('distance_covered_km', 8, 2);
    table.decimal('base_cost', 10, 2).defaultTo(50.00);
    table.decimal('hourly_rate', 10, 2).defaultTo(25.00);
    table.decimal('total_cost', 10, 2);
    table.enum('status', ['active', 'completed', 'cancelled', 'overdue']).defaultTo('active');
    table.enum('payment_status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending');
    table.text('notes');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['battery_id']);
    table.index(['status']);
    table.index(['payment_status']);
    table.index(['start_time']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('battery_rentals');
};
