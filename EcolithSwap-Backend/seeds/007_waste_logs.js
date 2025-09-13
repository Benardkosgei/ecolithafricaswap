exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('waste_logs').del()
    .then(function () {
      // Inserts seed entries
      return knex('waste_logs').insert([
        {user_id: 1, station_id: 1, waste_type: 'PET', weight_kg: 2.5, points_earned: 37, co2_saved_kg: 4.5, verified: true, verification_notes: 'Good quality PET bottles.', verified_by: 2},
        {user_id: 2, station_id: 2, waste_type: 'HDPE', weight_kg: 1.2, points_earned: 14, co2_saved_kg: 2.16, verified: true, verification_notes: 'Clean HDPE containers.', verified_by: 2},
        {user_id: 1, station_id: 1, waste_type: 'OTHER', weight_kg: 0.5, points_earned: 2, co2_saved_kg: 0.9, verified: false, verification_notes: 'Mixed plastics, low quality.', verified_by: null}
      ]);
    });
};