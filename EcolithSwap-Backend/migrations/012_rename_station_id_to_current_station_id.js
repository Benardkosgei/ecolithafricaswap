
exports.up = function(knex) {
  return knex.schema.table('batteries', function(table) {
    table.renameColumn('station_id', 'current_station_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('batteries', function(table) {
    table.renameColumn('current_station_id', 'station_id');
  });
};
