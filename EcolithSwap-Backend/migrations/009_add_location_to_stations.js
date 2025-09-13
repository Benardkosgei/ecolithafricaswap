exports.up = function(knex) {
  return knex.schema.table('stations', function(table) {
    table.string('location').after('address');
  });
};

exports.down = function(knex) {
  return knex.schema.table('stations', function(table) {
    table.dropColumn('location');
  });
};