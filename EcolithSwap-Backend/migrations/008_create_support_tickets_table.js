const knex = require('knex');

exports.up = function (knex) {
    return knex.schema.createTable('support_tickets', function (table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.string('subject').notNullable();
        table.text('message').notNullable();
        table.string('status').defaultTo('open');
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('support_tickets');
};