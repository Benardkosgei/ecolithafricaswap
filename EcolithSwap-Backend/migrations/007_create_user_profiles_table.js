/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_profiles', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('user_id').references('id').inTable('users').unique().notNullable();
    table.string('avatar_url');
    table.date('date_of_birth');
    table.enum('gender', ['male', 'female', 'other', 'prefer_not_to_say']);
    table.string('occupation');
    table.string('vehicle_type');
    table.string('vehicle_model');
    table.string('license_plate');
    table.integer('total_swaps').defaultTo(0);
    table.decimal('total_distance_km', 10, 2).defaultTo(0);
    table.decimal('total_amount_spent', 10, 2).defaultTo(0);
    table.decimal('plastic_recycled_kg', 8, 3).defaultTo(0);
    table.decimal('co2_saved_kg', 8, 3).defaultTo(0);
    table.decimal('money_saved', 10, 2).defaultTo(0);
    table.integer('current_points').defaultTo(0);
    table.integer('total_points_earned').defaultTo(0);
    table.integer('total_points_redeemed').defaultTo(0);
    table.json('preferences');
    table.boolean('notifications_enabled').defaultTo(true);
    table.boolean('sms_notifications').defaultTo(true);
    table.boolean('email_notifications').defaultTo(true);
    table.string('preferred_language').defaultTo('en');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['total_swaps']);
    table.index(['current_points']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_profiles');
};
