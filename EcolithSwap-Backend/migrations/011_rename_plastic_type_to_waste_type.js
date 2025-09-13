
exports.up = function(knex) {
  return knex.schema.table('plastic_waste_logs', function(table) {
    table.renameColumn('plastic_type', 'waste_type');
  });
};

exports.down = function(knex) {
  return knex.schema.table('plastic_waste_logs', function(table) {
    table.renameColumn('waste_type', 'plastic_type');
  });
};
