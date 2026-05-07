PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE users (
    id            INTEGER   PRIMARY KEY AUTOINCREMENT,
    username      TEXT      NOT NULL    UNIQUE,
    password_hash TEXT      NOT NULL,
    role          TEXT      NOT NULL CHECK (role IN ('inspector', 'engineer', 'supervisor', 'admin')),
    jurisdiction  TEXT      NOT NULL,
    created_at    TEXT      DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL,
    chainage_m     REAL    NOT NULL,
    tunnel_section TEXT    NOT NULL,
    zone_type      TEXT    NOT NULL
);

-- Sessions table
CREATE TABLE sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL    REFERENCES users(id),
    location_id INTEGER NOT NULL    REFERENCES locations(id),
    device_uid  TEXT    NOT NULL,
    started_at  TEXT    NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    ended_at    TEXT
);

-- Faults table
CREATE TABLE faults (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   INTEGER NOT NULL REFERENCES sessions(id),
    location_id  INTEGER NOT NULL REFERENCES locations(id),
    fault_type   TEXT    NOT NULL,
    asset_class  TEXT    NOT NULL,
    severity     TEXT    NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status       TEXT    NOT NULL CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    notes        TEXT,
    detected_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

-- Tools table
CREATE TABLE tools (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    category        TEXT    NOT NULL,
    rfid_tag        TEXT    NOT NULL UNIQUE,
    calibration_due TEXT
);

-- Tool check logs table
CREATE TABLE tool_check_logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id      INTEGER NOT NULL REFERENCES tools(id),
    session_id   INTEGER NOT NULL REFERENCES sessions(id),
    action       TEXT    NOT NULL CHECK (action IN ('check_in', 'check_out')),
    checked_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

-- Audit logs table
CREATE TABLE audit_logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id),
    event_type   TEXT    NOT NULL,
    entity_type  TEXT    NOT NULL,
    entity_id    INTEGER NOT NULL,
    occurred_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);