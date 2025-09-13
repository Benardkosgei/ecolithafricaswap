
exports.up = function(knex) {
  return knex.schema.table('waste_logs', function(table) {
    table.enum('status', ['verified', 'pending_verification']).defaultTo('pending_verification');
  });
};

exports.down = function(knex) {
  return knex.schema.table('waste_logs', function(table) {
    table.dropColumn('status');
  });
};
