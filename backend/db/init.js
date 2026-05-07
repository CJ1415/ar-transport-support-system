const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// absolute path to DB file (more reliable)
const dbPath = path.resolve(__dirname, '../ar_transport.db');

console.log("DB path:", dbPath);

// force close any existing handles by NOT importing shared db instances here

// delete database file if it exists
if (fs.existsSync(dbPath)) {
    try {
        fs.unlinkSync(dbPath);
        console.log('Old database deleted.');
    } catch (err) {
        console.error('Failed to delete database:', err.message);
        process.exit(1);
    }
} else {
    console.log('No existing database found.');
}

// create fresh DB
const db = new Database(dbPath);

// read schema
const schema = fs.readFileSync(
    path.join(__dirname, 'schema.sql'),
    'utf8'
);

db.exec(schema);

console.log('Database schema created successfully.');

db.close();