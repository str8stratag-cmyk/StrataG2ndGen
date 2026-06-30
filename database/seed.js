import { query, initializeDatabase } from '../backend/database.js';

async function seed() {
  try {
    await initializeDatabase();
    console.log('✅ Database connection established');

    // Check if drivers already exist
    const existing = await query('SELECT COUNT(*) FROM drivers');
    const count = parseInt(existing.rows[0].count);

    if (count > 0) {
      console.log(`⚠️  ${count} drivers already exist. Skipping seed.`);
      console.log('   To re-seed, run: DELETE FROM drivers;');
      process.exit(0);
    }

    const drivers = [
      {
        name: 'PJ',
        callsign: 'TOW-1',
        phone: '16562151523',
        vehicle_type: 'Heavy Duty Tow',
        current_location_lat: 27.9506,
        current_location_lng: -82.4572,
        current_location_address: 'Tampa, FL (Downtown)',
      },
      {
        name: 'Zach',
        callsign: 'TOW-2',
        phone: '18133594168',
        vehicle_type: 'Flatbed Tow',
        current_location_lat: 27.9965,
        current_location_lng: -82.4518,
        current_location_address: 'Tampa, FL (Ybor City)',
      },
      {
        name: 'Ted',
        callsign: 'TOW-3',
        phone: '17277177054',
        vehicle_type: 'Wheel-Lift Tow',
        current_location_lat: 27.8913,
        current_location_lng: -82.5064,
        current_location_address: 'Tampa, FL (South Tampa)',
      },
      {
        name: 'Jay',
        callsign: 'TOW-4',
        phone: '18138186108',
        vehicle_type: 'Heavy Duty Tow',
        current_location_lat: 28.0196,
        current_location_lng: -82.7722,
        current_location_address: 'Clearwater, FL',
      },
    ];

    for (const driver of drivers) {
      const result = await query(
        `INSERT INTO drivers (name, callsign, phone, vehicle_type, status, current_location_lat, current_location_lng, current_location_address, completed_dispatches)
         VALUES ($1, $2, $3, $4, 'AVAILABLE', $5, $6, $7, 0) RETURNING *`,
        [driver.name, driver.callsign, driver.phone, driver.vehicle_type, driver.current_location_lat, driver.current_location_lng, driver.current_location_address]
      );
      console.log(`✅ Seeded driver: ${result.rows[0].name} (${result.rows[0].callsign}) - ${result.rows[0].phone}`);
    }

    // Create admin user
    const adminExists = await query('SELECT * FROM users WHERE email = $1', ['admin@stratag.tech']);
    if (adminExists.rows.length === 0) {
      await query(
        `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, 'Admin', 'admin')`,
        ['admin@stratag.tech', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrzM8vL1gJkN0Z1Z1Z1Z1Z1Z1Z1Z1'] // placeholder hash
      );
      console.log('✅ Seeded admin user: admin@stratag.tech');
    }

    console.log('\n✅ Seed complete!');
    console.log('   4 real drivers loaded into the database.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
