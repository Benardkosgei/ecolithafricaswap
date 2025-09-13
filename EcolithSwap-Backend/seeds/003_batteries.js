exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('batteries').del()
    .then(function () {
      // Inserts seed entries
      return knex('batteries').insert([
        {battery_code: 'BATT001', serial_number: 'SN001', model: 'Model X', manufacturer: 'Tesla', capacity_kwh: 75, current_charge_percentage: 80, status: 'available', health_status: 'good', cycle_count: 150, current_station_id: 1, manufacture_date: '2022-01-01', last_maintenance_date: '2023-01-01', next_maintenance_due: '2024-01-01'},
        {battery_code: 'BATT002', serial_number: 'SN002', model: 'Model Y', manufacturer: 'Tesla', capacity_kwh: 100, current_charge_percentage: 90, status: 'rented', health_status: 'excellent', cycle_count: 50, current_station_id: 1, manufacture_date: '2022-06-01', last_maintenance_date: '2023-06-01', next_maintenance_due: '2024-06-01'},
        {battery_code: 'BATT003', serial_number: 'SN003', model: 'Model S', manufacturer: 'Tesla', capacity_kwh: 100, current_charge_percentage: 100, status: 'available', health_status: 'new', cycle_count: 0, current_station_id: 2, manufacture_date: '2023-01-01', last_maintenance_date: null, next_maintenance_due: null}
      ]);
    });
};