const Database = require('better-sqlite3')
const path = require('path');

const dbPath = path.resolve(__dirname, '../ar_transport.db');
const db = new Database(dbPath);

// Name data
const firstNames = ['James', 'Sophie', 'Ahmed', 'Claire', 'Luc', 'Pierre', 'Emma', 'Hassan', 'Rafael', 'Connor', 'Sergiu', 'Joe', 'Jacob']
const lastNames = ['Smith', 'Dubois', 'Khan', 'Martin', 'Taylor', 'Bernard', 'Jones', 'Sapand', 'Skinner', 'Mulea', 'Kempson', 'Dalton']

// User data
const roles = ['inspector', 'engineer', 'supervisor', 'admin']
const jurisdictions = ['UK', 'FR', 'ALL']

// Location data
const tunnelSections = ['UK Land', 'UK Coastal', 'Subsea North', 'Subsea South', 'FR Coastal', 'FR Land']
const zoneTypes = ['Running Tunnel', 'Service Tunnel', 'Cross-passage', 'Piston Relief Duct', 'Terminal']
const locationNames = ['Shakespeare Cliff', 'Castle Hill', 'Sangatte', 'Coquelles', 'Folkestone Terminal', 'Calais Terminal', 'Undersea Section A', 'Undersea Section B']

// Tool data
const toolNames = ['Torque Wrench', 'Laser Measure', 'Crack Gauge', 'Gas Detector', 'Thermal Camera', 'Voltage Tester']
const toolCategories = ['Measurement', 'Safety', 'Electrical', 'Inspection']
const calibrationDates = ['2026-09-01', '2026-10-15', '2026-12-01', '2027-01-30', '2027-03-01']

// Session data
const endedTimes = [
    '2026-05-01 09:30:00',
    '2026-05-02 11:45:00',
    '2026-05-03 14:20:00',
    '2026-05-04 08:15:00',
    '2026-05-05 16:00:00',
    '2026-05-06 13:30:00',
    '2026-05-07 10:00:00'
]

// Fault data
const faultTypes = ['Crack', 'Drainage Blockage', 'Signage Damage', 'Electrical Fault', 'Rail Defect', 'Concrete Spalling']
const assetClasses = ['Civil', 'M&E', 'Track', 'Signage']
const severities = ['Low', 'Medium', 'High', 'Critical']
const statuses = ['Open', 'In Progress', 'Resolved', 'Closed']

// Audit data
const eventTypes = ['LOGIN', 'LOGOUT', 'FAULT_CREATED', 'TOOL_CHECKOUT', 'SESSION_STARTED', 'SESSION_ENDED']
const entityTypes = ['user', 'fault', 'session', 'tool']

// Actions
const actions = ['check_in', 'check_out']


function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5)
}

function generateUsernames() {
    const all = []
    for (const first of firstNames) {
        for (const last of lastNames) {
            all.push((first + '.' + last).toLowerCase())
        }
    }
    return shuffle(all)
}

function seedUsers() {
    const userIds = []
    const usernames = generateUsernames()
    const stmt = db.prepare('INSERT INTO users (username, password_hash, role, jurisdiction) VALUES (?, ?, ?, ?)')

    for (let i = 0; i < 10; i++) {
        const username = usernames[i]
        const role = pick(roles)
        const jurisdiction = pick(jurisdictions)
        const result = stmt.run(username, 'hashed_pw_123', role, jurisdiction)
        userIds.push(result.lastInsertRowid)
    }

    return userIds
}

function seedLocations() {
    const locationIds = []
    const stmt = db.prepare('INSERT INTO locations (name, chainage_m, tunnel_section, zone_type) VALUES (?, ?, ?, ?)')

    for (let i = 0; i < 5; i++) {
        const name = pick(locationNames)
        const chainage = Math.floor(Math.random() * 50000)
        const tunnelSection = pick(tunnelSections)
        const zoneType = pick(zoneTypes)
        const result = stmt.run(name, chainage, tunnelSection, zoneType)
        locationIds.push(result.lastInsertRowid)
    }

    return locationIds
}

function seedTools() {
    const toolIds = []
    const stmt = db.prepare('INSERT INTO tools (name, category, rfid_tag, calibration_due) VALUES (?, ?, ?, ?)')

    for (let i = 0; i < 6; i++) {
        const name = pick(toolNames)
        const category = pick(toolCategories)
        const rfidTag = 'RFID-' + String(i + 1).padStart(4, '0')
        const calibrationDue = pick(calibrationDates)
        const result = stmt.run(name, category, rfidTag, calibrationDue)
        toolIds.push(result.lastInsertRowid)
    }

    return toolIds
}

function seedSessions(userIds, locationIds) {
    const sessionIds = []
    const stmt = db.prepare('INSERT INTO sessions (user_id, location_id, device_uid, ended_at) VALUES (?, ?, ?, ?)')

    for (let i = 0; i < 10; i++) {
        const userId = pick(userIds)
        const locationId = pick(locationIds)
        const deviceUid = 'DEV-' + String(i + 1).padStart(4, '0')
        const endedAt = i < 7 ? pick(endedTimes) : null
        const result = stmt.run(userId, locationId, deviceUid, endedAt)
        sessionIds.push(result.lastInsertRowid)
    }

    return sessionIds
}

function seedFaults(sessionIds, locationIds) {
    const stmt = db.prepare('INSERT INTO faults (session_id, location_id, fault_type, asset_class, severity, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')

    for (let i = 0; i < 15; i++) {
        const sessionId = pick(sessionIds)
        const locationId = pick(locationIds)
        const faultType = pick(faultTypes)
        const assetClass = pick(assetClasses)
        const severity = pick(severities)
        const status = pick(statuses)
        const notes = 'Routine inspection note ' + (i + 1)
        stmt.run(sessionId, locationId, faultType, assetClass, severity, status, notes)
    }
}

function seedToolCheckLogs(toolIds, sessionIds) {
    const stmt = db.prepare('INSERT INTO tool_check_logs (tool_id, session_id, action) VALUES (?, ?, ?)')

    for (let i = 0; i < 20; i++) {
        const toolId = pick(toolIds)
        const sessionId = pick(sessionIds)
        const action = pick(actions)
        stmt.run(toolId, sessionId, action)
    }
}

function seedAuditLogs(userIds) {
    const stmt = db.prepare('INSERT INTO audit_logs (user_id, event_type, entity_type, entity_id) VALUES (?, ?, ?, ?)')

    for (let i = 0; i < 20; i++) {
        const userId = pick(userIds)
        const eventType = pick(eventTypes)
        const entityType = pick(entityTypes)
        const entityId = Math.floor(Math.random() * 10) + 1
        stmt.run(userId, eventType, entityType, entityId)
    }
}

const userIds = seedUsers()
const locationIds = seedLocations()
const toolIds = seedTools()
const sessionIds = seedSessions(userIds, locationIds)
seedFaults(sessionIds, locationIds)
seedToolCheckLogs(toolIds, sessionIds)
seedAuditLogs(userIds)

db.close()