/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('user_id').references('id').inTable('users').notNullable();
    table.uuid('rental_id').references('id').inTable('battery_rentals');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('KES');
    table.enum('payment_method', ['mpesa', 'card', 'cash', 'points', 'bank_transfer']).notNullable();
    table.string('payment_reference').unique();
    table.string('mpesa_receipt_number');
    table.string('transaction_id');
    table.enum('status', ['pending', 'completed', 'failed', 'cancelled', 'refunded']).defaultTo('pending');
    table.text('description');
    table.json('metadata');
    table.timestamp('processed_at');
    table.decimal('fee_amount', 10, 2).defaultTo(0);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['rental_id']);
    table.index(['status']);
    table.index(['payment_method']);
    table.index(['payment_reference']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};
