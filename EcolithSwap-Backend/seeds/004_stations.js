exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('stations').del()
    .then(function () {
      // Inserts seed entries
      return knex('stations').insert([
        {name: 'Central Station', address: '123 Main St, Nairobi', latitude: -1.286389, longitude: 36.817223, station_type: 'swap', total_slots: 20, available_slots: 15, operating_hours: '24/7', manager_id: 1, is_active: true, accepts_plastic: true, maintenance_mode: false},
        {name: 'Westlands Station', address: '456 Waiyaki Way, Nairobi', latitude: -1.2660, longitude: 36.8021, station_type: 'both', total_slots: 10, available_slots: 8, operating_hours: '6am - 10pm', manager_id: 2, is_active: true, accepts_plastic: false, maintenance_mode: false},
        {name: 'Mombasa Road Station', address: '789 Mombasa Road, Nairobi', latitude: -1.3326, longitude: 36.8882, station_type: 'charge', total_slots: 5, available_slots: 5, operating_hours: '24/7', manager_id: 1, is_active: false, accepts_plastic: true, maintenance_mode: true}
      ]);
    });
};