import { app } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';


// region init db

const dbPath = path.join(app.getPath('userData'), 'database.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT
    )    
`);

// endregion init db

// region migrations

const MIGRATIONS = [
    [
        'ALTER TABLE leads ADD COLUMN name TINYTEXT',
        'ALTER TABLE leads ADD COLUMN age UNSIGNED TINYINT',
        'ALTER TABLE leads ADD COLUMN rowColor TINYTEXT'
    ],
    [
        'INSERT INTO leads (name, age) VALUES (\'Bill\', 65)'
    ]
];

const CURRENT_VERSION = db.pragma('user_version', { simple: true });
const ERROR = { code: 0, message: null };

for (let i = 0; i < MIGRATIONS.length; i++) {
    if (i < CURRENT_VERSION) { continue };

    try {
        const statements = MIGRATIONS[i];

        for (const statement of statements) {
            const stmt = db.prepare(statement);
            stmt.run();
        };

        db.pragma(`user_version = ${i + 1}`);
    } catch (error) {
        console.error('An error occurred while running migrations.');
        console.error(error);

        ERROR.code = 1;
        ERROR.message = error;
        break;
    };
};

// endregion migrations

// region db service

function safeQuery(statement, method) {
    /**
    * @param {string} statement - SQL statement to execute
    * @param {string} method - better-sqlite3 Statement object method to execute - typically 'all' or 'get'
    */

    if (ERROR.code) {
        return null;
    };

    const stmt = db.prepare(statement);
    return stmt[method]();
};

export const databaseService = {
    getLeads: () => {
        return safeQuery('SELECT * FROM leads', 'all') || [];
    }
};

// endregion db service
