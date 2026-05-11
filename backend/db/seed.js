const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'ar_transport.db');
const db = new Database(dbPath);

const seed = () => {
  try {
    const insertLocation = db.prepare(`INSERT INTO locations (name, chainage_m, tunnel_section, zone_type) VALUES (?, ?, ?, ?)`);
    const insertSession  = db.prepare(`INSERT INTO sessions (user_id, location_id, device_uid) VALUES (?, ?, ?)`);
    const insertFault    = db.prepare(`INSERT INTO faults (session_id, location_id, fault_type, asset_class, severity, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const insertToolLog  = db.prepare(`INSERT INTO tool_check_logs (tool_id, session_id, action) VALUES (?, ?, ?)`);
    const insertAudit    = db.prepare(`INSERT INTO audit_logs (user_id, event_type, entity_type, entity_id) VALUES (?, ?, ?, ?)`);

    const admin      = db.prepare(`SELECT id FROM users WHERE username = 'admin'`).get();
    const supervisor = db.prepare(`SELECT id FROM users WHERE username = 'supervisor'`).get();
    const engineer   = db.prepare(`SELECT id FROM users WHERE username = 'engineer'`).get();
    const inspector  = db.prepare(`SELECT id FROM users WHERE username = 'inspector'`).get();

    if (!admin) throw new Error('Users not found — run node init.js first');

    const tools = db.prepare(`SELECT id FROM tools`).all();
    if (!tools.length) throw new Error('Tools not found — run node init.js first');

    db.transaction(() => {

      // --- LOCATIONS ---
      const l1 = insertLocation.run('North Portal Entrance',         0,    'Section A', 'Operational').lastInsertRowid;
      const l2 = insertLocation.run('Mid-Tunnel Ventilation Shaft',  1250, 'Section B', 'Maintenance').lastInsertRowid;
      const l3 = insertLocation.run('South Portal Exit',             2500, 'Section C', 'Operational').lastInsertRowid;
      const l4 = insertLocation.run('Crossover Chamber Alpha',       800,  'Section A', 'Restricted').lastInsertRowid;
      const l5 = insertLocation.run('Service Tunnel Junction 2',     1600, 'Section B', 'Maintenance').lastInsertRowid;
      const l6 = insertLocation.run('Rolling Stock Bay 1',           50,   'Section A', 'Operational').lastInsertRowid;
      const l7 = insertLocation.run('Signalling Room South',         2400, 'Section C', 'Restricted').lastInsertRowid;

      // --- SESSIONS ---
      const s1 = insertSession.run(admin.id,      l1, 'DEV-HOLO-001').lastInsertRowid;
      const s2 = insertSession.run(engineer.id,   l2, 'DEV-TAB-002').lastInsertRowid;
      const s3 = insertSession.run(inspector.id,  l3, 'DEV-MOB-003').lastInsertRowid;
      const s4 = insertSession.run(supervisor.id, l4, 'DEV-HOLO-004').lastInsertRowid;
      const s5 = insertSession.run(engineer.id,   l5, 'DEV-TAB-005').lastInsertRowid;
      const s6 = insertSession.run(inspector.id,  l6, 'DEV-MOB-006').lastInsertRowid;

      // --- ACTIVE FAULTS (Open / In progress) ---
      // Civil
      insertFault.run(s1, l1, 'Concrete Spalling',     'Civil',      'High',     'Open',        'Exposed reinforcement detected on tunnel wall.');
      insertFault.run(s1, l2, 'Water Ingress',          'Civil',      'Critical', 'Open',        'Active leak near electrical panel.');
      insertFault.run(s3, l3, 'Spalling Ceiling',       'Civil',      'High',     'In progress', 'Temporary barrier placed.');
      insertFault.run(s4, l4, 'Structural Settlement',  'Civil',      'Critical', 'Open',        'Immediate engineering review required.');
      insertFault.run(s5, l5, 'Joint Sealant Failure',  'Civil',      'Medium',   'Open',        'Water staining visible around expansion joint.');
      // M&E
      insertFault.run(s1, l1, 'Loose Cable Tray',       'M&E',        'Medium',   'Open',        'Fixings show signs of corrosion.');
      insertFault.run(s3, l3, 'Ventilation Fan Noise',  'M&E',        'Medium',   'In progress', 'Bearing replacement scheduled.');
      insertFault.run(s4, l4, 'Power Supply Failure',   'M&E',        'Critical', 'Open',        'Backup systems active, primary fault under investigation.');
      insertFault.run(s5, l5, 'Cable Insulation Wear',  'M&E',        'High',     'Open',        'Visible wear on high-voltage cable sheath.');
      insertFault.run(s6, l6, 'Emergency Light Fault',  'M&E',        'High',     'Open',        'Three emergency units unresponsive in bay.');
      // Signalling
      insertFault.run(s1, l1, 'Signal Dropout',         'Signalling', 'High',     'In progress', 'Intermittent dropout on Track 1 sensor.');
      insertFault.run(s3, l7, 'Comms Cabinet Corrosion','Signalling', 'Medium',   'Open',        'Surface corrosion on cabinet exterior.');
      insertFault.run(s4, l4, 'Track Circuit Fault',    'Signalling', 'Critical', 'Open',        'False clear indication reported by control room.');
      insertFault.run(s5, l5, 'Cable Termination Fault','Signalling', 'High',     'Open',        'Termination block showing heat damage.');
      // Signage
      insertFault.run(s5, l5, 'Faded Emergency Sign',   'Signage',    'Medium',   'Open',        'Luminance below required threshold.');
      insertFault.run(s6, l6, 'Missing Exit Marker',    'Signage',    'High',     'Open',        'Exit marker missing from bay entrance.');

      // --- HISTORICAL FAULTS (Resolved / Closed) — used to train ML model ---
      // Civil
      insertFault.run(s1, l1, 'Concrete Spalling',     'Civil',      'High',     'Resolved', 'Reinforcement treated and resealed.');
      insertFault.run(s2, l2, 'Water Ingress',          'Civil',      'Critical', 'Resolved', 'Leak sealed, drainage improved.');
      insertFault.run(s2, l2, 'Hairline Crack',         'Civil',      'Low',      'Closed',   'Monitored, within tolerance.');
      insertFault.run(s4, l4, 'Joint Sealant Failure',  'Civil',      'Medium',   'Resolved', 'Sealant replaced along full joint.');
      insertFault.run(s5, l5, 'Structural Settlement',  'Civil',      'Critical', 'Resolved', 'Underpinning works completed.');
      insertFault.run(s6, l6, 'Surface Spalling',       'Civil',      'Medium',   'Closed',   'Area cleaned and patched.');
      // M&E
      insertFault.run(s1, l1, 'Loose Cable Tray',       'M&E',        'Medium',   'Resolved', 'Fixings replaced, tray secured.');
      insertFault.run(s2, l2, 'Power Supply Failure',   'M&E',        'Critical', 'Resolved', 'Primary supply restored after board replacement.');
      insertFault.run(s3, l3, 'Faulty Lighting Unit',   'M&E',        'Low',      'Closed',   'Unit replaced during routine maintenance.');
      insertFault.run(s4, l4, 'Cable Insulation Wear',  'M&E',        'High',     'Resolved', 'Affected section re-cabled.');
      insertFault.run(s5, l5, 'Emergency Light Fault',  'M&E',        'High',     'Resolved', 'Three units replaced and tested.');
      insertFault.run(s6, l6, 'Ventilation Fan Noise',  'M&E',        'Medium',   'Resolved', 'Bearing replaced, noise resolved.');
      // Signalling
      insertFault.run(s1, l7, 'Signal Dropout',         'Signalling', 'High',     'Resolved', 'Faulty connector replaced on Track 1.');
      insertFault.run(s2, l4, 'Track Circuit Fault',    'Signalling', 'Critical', 'Resolved', 'False clear root cause identified and fixed.');
      insertFault.run(s3, l7, 'Comms Cabinet Corrosion','Signalling', 'Medium',   'Closed',   'Cabinet treated and resealed.');
      insertFault.run(s4, l3, 'Sensor Misalignment',    'Signalling', 'Low',      'Closed',   'Realigned and tested within tolerance.');
      insertFault.run(s5, l5, 'Cable Termination Fault','Signalling', 'High',     'Resolved', 'Termination block replaced.');
      // Signage
      insertFault.run(s2, l3, 'Damaged Signage',        'Signage',    'Low',      'Closed',   'Replaced during routine check.');
      insertFault.run(s3, l5, 'Faded Emergency Sign',   'Signage',    'Medium',   'Resolved', 'Sign replaced, luminance verified.');
      insertFault.run(s6, l6, 'Missing Exit Marker',    'Signage',    'High',     'Resolved', 'Marker replaced and inspected.');

      // --- TOOL CHECK LOGS ---
      for (const tool of tools) {
        insertToolLog.run(tool.id, s1, 'Check out');
        insertToolLog.run(tool.id, s2, 'Check out');
      }
      insertToolLog.run(tools[0].id, s1, 'Check in');
      insertToolLog.run(tools[1].id, s1, 'Check in');

      // --- AUDIT LOGS ---
      insertAudit.run(admin.id,      'LOGIN',           'user',    admin.id);
      insertAudit.run(engineer.id,   'LOGIN',           'user',    engineer.id);
      insertAudit.run(inspector.id,  'LOGIN',           'user',    inspector.id);
      insertAudit.run(supervisor.id, 'LOGIN',           'user',    supervisor.id);
      insertAudit.run(admin.id,      'FAULT_CREATED',   'fault',   1);
      insertAudit.run(engineer.id,   'FAULT_UPDATED',   'fault',   3);
      insertAudit.run(supervisor.id, 'FAULT_RESOLVED',  'fault',   4);
      insertAudit.run(admin.id,      'SESSION_STARTED', 'session', s1);
      insertAudit.run(engineer.id,   'SESSION_STARTED', 'session', s2);

    })();

    console.log('-----------------------------------------');
    console.log('Database Path:', dbPath);
    console.log('Seeded: 7 locations, 6 sessions');
    console.log('        16 active faults, 20 historical faults');
    console.log('        tool check logs, audit logs');
    console.log('Status: COMPLETE');
    console.log('-----------------------------------------');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    db.close();
  }
};

seed();