exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('notifications').del()
    .then(function () {
      // Inserts seed entries
      return knex('notifications').insert([
        {user_id: 1, type: 'rental_start', message: 'Your battery rental has started.', is_read: true},
        {user_id: 1, type: 'rental_reminder', message: 'Your battery rental is due in 1 hour.', is_read: false},
        {user_id: 2, type: 'payment_success', message: 'Your payment of KES 200.00 was successful.', is_read: true}
      ]);
    });
};