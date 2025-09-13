exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('ticket_messages').del()
    .then(function () {
      // Inserts seed entries
      return knex('ticket_messages').insert([
        {ticket_id: 1, sender_id: 1, message: 'I have tried everything, but the battery won\'t charge.'},
        {ticket_id: 1, sender_id: 2, message: 'We are looking into the issue. Please bring the battery to the nearest station.'},
        {ticket_id: 2, sender_id: 2, message: 'Can you please provide the transaction ID for the double charge?'}
      ]);
    });
};