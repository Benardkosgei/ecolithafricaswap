exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('user_profiles').del()
    .then(function () {
      // Inserts seed entries
      return knex('user_profiles').insert([
        {user_id: 1, total_swaps: 10, total_distance_km: 120.5, total_amount_spent: 2500.00, plastic_recycled_kg: 5.2, co2_saved_kg: 14.56, money_saved: 500.00, current_points: 150, total_points_earned: 300, total_points_redeemed: 150, notifications_enabled: true, sms_notifications: true, email_notifications: true, preferred_language: 'en'},
        {user_id: 2, total_swaps: 5, total_distance_km: 60.2, total_amount_spent: 1200.00, plastic_recycled_kg: 2.1, co2_saved_kg: 5.88, money_saved: 250.00, current_points: 75, total_points_earned: 150, total_points_redeemed: 75, notifications_enabled: true, sms_notifications: false, email_notifications: true, preferred_language: 'en'},
        {user_id: 3, total_swaps: 2, total_distance_km: 24.1, total_amount_spent: 500.00, plastic_recycled_kg: 1.0, co2_saved_kg: 2.8, money_saved: 100.00, current_points: 30, total_points_earned: 60, total_points_redeemed: 30, notifications_enabled: false, sms_notifications: false, email_notifications: false, preferred_language: 'fr'}
      ]);
    });
};