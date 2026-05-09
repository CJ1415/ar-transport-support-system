// seed.js
// Run this to populate the database with random test data for development.
// Requires init.js to have been run first, as it pulls existing users and tools from the DB.
// Safe to run multiple times — each run adds a fresh batch of locations, sessions,
// faults, tool check logs, and audit logs.
//
// Usage: node seed.js

const Database = require('better-sqlite3')
const db = new Database('ar_transport.db')

const tunnelSections = ['UK Land', 'UK Coastal', 'Subsea North', 'Subsea South', 'FR Coastal', 'FR Land']
const zoneTypes = ['Running Tunnel', 'Service Tunnel', 'Cross-passage', 'Piston Relief Duct', 'Terminal']
const locationNames = ['Shakespeare Cliff', 'Castle Hill', 'Sangatte', 'Coquelles', 'Folkestone Terminal', 'Calais Terminal', 'Undersea Section A', 'Undersea Section B']

const endedTimes = [
    '2026-05-01 09:30:00', '2026-05-02 11:45:00', '2026-05-03 14:20:00',
    '2026-05-04 08:15:00', '2026-05-05 16:00:00', '2026-05-06 13:30:00', '2026-05-07 10:00:00'
]

const faultTypes = ['Crack', 'Drainage Blockage', 'Signage Damage', 'Electrical Fault', 'Rail Defect', 'Concrete Spalling', 'Ventilation Fault']
const assetClasses = ['Civil', 'M&E', 'Track', 'Signage']
const severities = ['Low', 'Medium', 'High', 'Critical']
const eventTypes = ['LOGIN', 'LOGOUT', 'FAULT_CREATED', 'TOOL_CHECKOUT', 'SESSION_STARTED', 'SESSION_ENDED']
const entityTypes = ['user', 'fault', 'session', 'tool']
const actions = ['Check in', 'Check out']

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

// Pull fixed users and tools from DB
const userIds = db.prepare('SELECT id FROM users').all().map(r => r.id)
const toolIds = db.prepare('SELECT id FROM tools').all().map(r => r.id)

// Ensure init.js has been run first
if (userIds.length === 0 || toolIds.length === 0) {
    console.error('No users or tools found — run init.js first')
    db.close()
    process.exit(1)
}

function seedLocations() {
    const locationIds = []
    const stmt = db.prepare('INSERT INTO locations (name, chainage_m, tunnel_section, zone_type) VALUES (?, ?, ?, ?)')
    for (let i = 0; i < 5; i++) {
        const result = stmt.run(pick(locationNames), Math.floor(Math.random() * 50000), pick(tunnelSections), pick(zoneTypes))
        locationIds.push(result.lastInsertRowid)
    }
    return locationIds
}

function seedSessions(userIds, locationIds) {
    const sessionIds = []
    const stmt = db.prepare('INSERT INTO sessions (user_id, location_id, device_uid, ended_at) VALUES (?, ?, ?, ?)')
    for (let i = 0; i < 10; i++) {
        const deviceUid = 'DEV-' + String(i + 1).padStart(4, '0')
        const endedAt = i < 7 ? pick(endedTimes) : null
        const result = stmt.run(pick(userIds), pick(locationIds), deviceUid, endedAt)
        sessionIds.push(result.lastInsertRowid)
    }
    return sessionIds
}

    function seedFaults(sessionIds, locationIds) {
        const stmt = db.prepare('INSERT INTO faults (session_id, location_id, fault_type, asset_class, severity, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')

        // Weighted severity based on fault type and tunnel section
        // Reflects real-world maintenance risk profiles for the Channel Tunnel
        function pickSeverity(faultType, tunnelSection) {
            const isSubsea = tunnelSection.includes('Subsea')
            const isCoastal = tunnelSection.includes('Coastal')

            const weights = {
        'Ventilation Fault':  isSubsea  ? ['Critical', 'Critical', 'Critical', 'Critical', 'Critical', 'Critical', 'Critical', 'Critical', 'High', 'High']
                            : isCoastal ? ['Critical', 'Critical', 'Critical', 'High', 'High', 'High', 'High', 'Medium', 'Medium', 'Low']
                            :             ['Critical', 'Critical', 'High', 'High', 'High', 'High', 'Medium', 'Medium', 'Medium', 'Low'],

        'Rail Defect':        isSubsea  ? ['Critical', 'Critical', 'Critical', 'Critical', 'High', 'High', 'High', 'High', 'Medium', 'Low']
                            :             ['Critical', 'Critical', 'High', 'High', 'High', 'High', 'Medium', 'Medium', 'Medium', 'Low'],

        'Crack':              isSubsea  ? ['Critical', 'Critical', 'Critical', 'High', 'High', 'High', 'Medium', 'Medium', 'Low', 'Low']
                            :             ['Critical', 'High', 'High', 'High', 'Medium', 'Medium', 'Medium', 'Low', 'Low', 'Low'],

        'Concrete Spalling':  isSubsea  ? ['Critical', 'Critical', 'High', 'High', 'High', 'High', 'Medium', 'Medium', 'Low', 'Low']
                            :             ['Critical', 'High', 'High', 'High', 'Medium', 'Medium', 'Medium', 'Low', 'Low', 'Low'],

        'Electrical Fault':   ['Critical', 'Critical', 'High', 'High', 'High', 'Medium', 'Medium', 'Medium', 'Low', 'Low'],

        'Drainage Blockage':  isSubsea  ? ['Critical', 'High', 'High', 'High', 'Medium', 'Medium', 'Medium', 'Low', 'Low', 'Low']
                            :             ['High', 'Medium', 'Medium', 'Medium', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low'],

        'Signage Damage':     ['High', 'Medium', 'Medium', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low'],
    }

        const options = weights[faultType] || ['Low', 'Medium', 'High', 'Critical']
        return pick(options)
    }

    // Asset class based on fault type
    function pickAssetClass(faultType) {
        const map = {
            'Crack':             'Civil',
            'Concrete Spalling': 'Civil',
            'Drainage Blockage': 'Civil',
            'Rail Defect':       'Track',
            'Electrical Fault':  'M&E',
            'Ventilation Fault': 'M&E',
            'Signage Damage':    'Signage',
        }
        return map[faultType] || pick(assetClasses)
    }

    // Mainly resolved/closed historical faults — used for ML training data
    for (let i = 0; i < 160; i++) {
        const faultType = pick(faultTypes)
        const locationId = pick(locationIds)

        // Get tunnel section for this location to inform severity
        const location = db.prepare('SELECT tunnel_section FROM locations WHERE id = ?').get(locationId)
        const severity = pickSeverity(faultType, location.tunnel_section)
        const assetClass = pickAssetClass(faultType)

        // Historical
        stmt.run(pick(sessionIds), locationId, faultType, assetClass, severity, pick(['Resolved', 'Closed']), 'Historical fault record ' + (i + 1))
    }

    // Active faults — current open issues
    for (let i = 0; i < 40; i++) {
        const faultType = pick(faultTypes)
        const locationId = pick(locationIds)

        const location = db.prepare('SELECT tunnel_section FROM locations WHERE id = ?').get(locationId)
        const severity = pickSeverity(faultType, location.tunnel_section)
        const assetClass = pickAssetClass(faultType)

        stmt.run(pick(sessionIds), locationId, faultType, assetClass, severity, pick(['Open', 'In progress']), 'Active fault record ' + (i + 1))
    }
}

function seedToolCheckLogs(toolIds, sessionIds) {
    const stmt = db.prepare('INSERT INTO tool_check_logs (tool_id, session_id, action) VALUES (?, ?, ?)')
    for (let i = 0; i < 20; i++) {
        stmt.run(pick(toolIds), pick(sessionIds), pick(actions))
    }
}

function seedAuditLogs(userIds) {
    const stmt = db.prepare('INSERT INTO audit_logs (user_id, event_type, entity_type, entity_id) VALUES (?, ?, ?, ?)')
    for (let i = 0; i < 20; i++) {
        stmt.run(pick(userIds), pick(eventTypes), pick(entityTypes), Math.floor(Math.random() * 10) + 1)
    }
}

const locationIds = seedLocations()
const sessionIds = seedSessions(userIds, locationIds)
seedFaults(sessionIds, locationIds)
seedToolCheckLogs(toolIds, sessionIds)
seedAuditLogs(userIds)

db.close()
console.log('Database seeded with random test data')