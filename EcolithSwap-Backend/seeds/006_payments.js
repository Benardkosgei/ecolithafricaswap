exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('payments').del()
    .then(function () {
      // Inserts seed entries
      return knex('payments').insert([
        {user_id: 2, rental_id: 2, amount: 200.00, currency: 'KES', status: 'completed', payment_method: 'mpesa', payment_reference: 'R2ABC123', mpesa_receipt_number: 'ABC123XYZ', description: 'Payment for rental #2'},
        {user_id: 1, rental_id: 1, amount: 50.00, currency: 'KES', status: 'pending', payment_method: 'card', payment_reference: 'R1DEF456', mpesa_receipt_number: null, description: 'Payment for rental #1'}
      ]);
    });
};