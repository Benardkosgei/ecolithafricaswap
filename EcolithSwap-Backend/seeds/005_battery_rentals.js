exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('battery_rentals').del()
    .then(function () {
      // Inserts seed entries
      return knex('battery_rentals').insert([
        {user_id: 1, battery_id: 2, pickup_station_id: 1, return_station_id: null, rental_date: '2023-10-26 10:00:00', return_date: null, total_cost: null, status: 'active', hourly_rate: 50.00, payment_status: 'pending'},
        {user_id: 2, battery_id: 1, pickup_station_id: 2, return_station_id: 1, rental_date: '2023-10-25 14:00:00', return_date: '2023-10-25 18:00:00', total_cost: 200.00, status: 'completed', hourly_rate: 50.00, payment_status: 'completed'},
        {user_id: 3, battery_id: 3, pickup_station_id: 1, return_station_id: null, rental_date: '2023-10-26 12:00:00', return_date: null, total_cost: null, status: 'active', hourly_rate: 50.00, payment_status: 'pending'}
      ]);
    });
};