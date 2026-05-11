const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'ar_transport.db');
const db = new Database(dbPath);

const seed = () => {
  try {
    // 1. Cleanup
    db.prepare('DELETE FROM predictions').run();
    db.prepare('DELETE FROM faults').run();
    db.prepare(`DELETE FROM sessions`).run();
    db.prepare(`DELETE FROM locations`).run();

    const insertLocation = db.prepare(`INSERT INTO locations (name, chainage_m, tunnel_section, zone_type) VALUES (?, ?, ?, ?)`);
    const insertSession = db.prepare(`INSERT INTO sessions (user_id, location_id, device_uid) VALUES (?, ?, ?)`);
    const insertFault = db.prepare(`INSERT INTO faults (session_id, location_id, fault_type, asset_class, severity, status, notes, detected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertPrediction = db.prepare(`INSERT INTO predictions (fault_id, predicted_severity, confidence) VALUES (?, ?, ?)`);

    db.transaction(() => {
      const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
      if (!admin) throw new Error("Admin user not found. Run init.js first!");

      // 2. Create standard locations
      const locIds = [];
      locIds.push(insertLocation.run('North Portal', 0, 'Section A', 'Operational').lastInsertRowid);
      locIds.push(insertLocation.run('Vent Shaft 1', 500, 'Section A', 'Maintenance').lastInsertRowid);
      locIds.push(insertLocation.run('Cross Passage 4', 1200, 'Section B', 'Operational').lastInsertRowid);
      locIds.push(insertLocation.run('Signal Box South', 2200, 'Section C', 'Operational').lastInsertRowid);
      locIds.push(insertLocation.run('Drainage Sump 2', 1800, 'Section B', 'Maintenance').lastInsertRowid);

      // 3. Create a session
      const sessionId = insertSession.run(admin.id, locIds[0], 'DEV-HOLO-001').lastInsertRowid;

      // 4. GENERATE 100+ FAULTS
      const types = ['Concrete Crack', 'Water Ingress', 'Cable Corrosion', 'Signal Interference', 'Joint Failure', 'Loose Bolt'];
      const assets = ['Civil', 'M&E', 'Track', 'Signage'];
      const severities = ['Low', 'Medium', 'High', 'Critical'];
      const statuses = ['Open', 'In progress', 'Closed'];

      console.log("Generating 120 faults for ML datasets...");

      for (let i = 0; i < 120; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const asset = assets[Math.floor(Math.random() * assets.length)];
        const sev = severities[Math.floor(Math.random() * severities.length)];
        const stat = statuses[Math.floor(Math.random() * statuses.length)];
        const loc = locIds[Math.floor(Math.random() * locIds.length)];

        // Random date within the last 6 months
        const date = new Date(Date.now() - Math.floor(Math.random() * 15552000000)).toISOString();

        const faultResult = insertFault.run(
          sessionId,
          loc,
          type,
          asset,
          sev,
          stat,
          `Automated inspection log entry #${i + 1000}`,
          date
        );

        // 5. Add ML Predictions for half of the faults
        if (i % 2 === 0) {
          insertPrediction.run(
            faultResult.lastInsertRowid,
            severities[Math.floor(Math.random() * severities.length)],
            (Math.random() * (0.99 - 0.7) + 0.7).toFixed(2) // 70-99% confidence
          );
        }
      }
    })();

    console.log('-----------------------------------------');
    console.log('Status: 120 FAULTS & 60 ML PREDICTIONS SEEDED');
    console.log('-----------------------------------------');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    db.close();
  }
};

seed();