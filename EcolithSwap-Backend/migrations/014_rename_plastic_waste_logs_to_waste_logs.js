
exports.up = function(knex) {
  return knex.schema.renameTable('plastic_waste_logs', 'waste_logs');
};

exports.down = function(knex) {
  return knex.schema.renameTable('waste_logs', 'plastic_waste_logs');
};
