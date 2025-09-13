
exports.up = function(knex) {
  return knex.schema.table('plastic_waste_logs', function(table) {
    table.decimal('verified_weight_kg', 8, 3).after('weight_kg');
  });
};

exports.down = function(knex) {
  return knex.schema.table('plastic_waste_logs', function(table) {
    table.dropColumn('verified_weight_kg');
  });
};
