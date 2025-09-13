exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('support_tickets').del()
    .then(function () {
      // Inserts seed entries
      return knex('support_tickets').insert([
        {user_id: 1, subject: 'Problem with battery', message: 'The battery I rented is not charging.', status: 'open', agent_id: 2},
        {user_id: 2, subject: 'Payment issue', message: 'I was double-charged for my rental.', status: 'in_progress', agent_id: 2},
        {user_id: 3, subject: 'Station not working', message: 'The station at Westlands is not releasing batteries.', status: 'closed', agent_id: 1}
      ]);
    });
};