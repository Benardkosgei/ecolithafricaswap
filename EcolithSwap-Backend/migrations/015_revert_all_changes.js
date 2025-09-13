
exports.up = function(knex) {
  return knex.schema.dropTableIfExists('waste_logs')
    .then(() => knex.schema.dropTableIfExists('plastic_waste_logs'));
};

exports.down = function(knex) {
  // This is a destructive migration, so we won't try to recreate the tables.
  // If you need to revert, you should restore from a backup.
  return Promise.resolve();
};
