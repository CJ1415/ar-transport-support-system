const Database = require('better-sqlite3');
const path = require('path');

// TARGET: backend/db/ar_transport.db (Must match init.js)
const dbPath = path.resolve(__dirname, 'ar_transport.db');
const db = new Database(dbPath);

const seed = () => {
  try {
    const insertLocation = db.prepare(`
      INSERT INTO locations (name, chainage_m, tunnel_section, zone_type)
      VALUES (?, ?, ?, ?)
    `);

    const insertSession = db.prepare(`
      INSERT INTO sessions (user_id, location_id, device_uid)
      VALUES (?, ?, ?)
    `);

    const insertFault = db.prepare(`
      INSERT INTO faults (session_id, location_id, fault_type, asset_class, severity, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      // 1. Seed Locations
      insertLocation.run('North Portal Entrance', 0, 'Section A', 'Operational');
      insertLocation.run('Mid-Tunnel Ventilation Shaft', 1250, 'Section B', 'Maintenance');
      insertLocation.run('South Portal Exit', 2500, 'Section C', 'Operational');

      // 2. Seed a dummy session (linking to Admin user ID 1)
      insertSession.run(1, 1, 'DEV-HOLO-001');

      // 3. Seed Sample Faults
      insertFault.run(1, 1, 'Concrete Spalling', 'Civil', 'High', 'Open', 'Exposed reinforcement detected.');
      insertFault.run(1, 2, 'Water Ingress', 'Civil', 'Critical', 'Open', 'Active leak near electrical panel.');
      insertFault.run(1, 1, 'Loose Cable Tray', 'M&E', 'Medium', 'Open', 'Fixings show signs of corrosion.');
      insertFault.run(1, 3, 'Damaged Signage', 'Signage', 'Low', 'Closed', 'Replaced during routine check.');
    })();

    console.log('-----------------------------------------');
    console.log('Database Path:', dbPath);
    console.log('Status: LOCATIONS & FAULTS SEEDED');
    console.log('-----------------------------------------');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    db.close();
  }
};

seed();