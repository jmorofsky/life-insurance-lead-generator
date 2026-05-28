import { app } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';


// #region init db

const dbPath = path.join(app.getPath('userData'), 'database.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// #endregion init db

// #region migrations

const MIGRATIONS = [
    [
        `CREATE TABLE IF NOT EXISTS marriageLeads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            source MEDIUMTEXT NOT NULL,
            source_url MEDIUMTEXT,

            spouse1_first TINYTEXT NOT NULL,
            spouse1_middle TINYTEXT,
            spouse1_last TINYTEXT NOT NULL,
            spouse1_dob DATE,

            spouse2_first TINYTEXT,
            spouse2_middle TINYTEXT,
            spouse2_last TINYTEXT,
            spouse2_dob DATE,

            married_last_name TINYTEXT,

            license_date DATE,
            license_number MEDIUMINT,
            wedding_date DATE,
            wedding_county TINYTEXT,
            wedding_state TINYTEXT,

            scraped_at DATE NOT NULL,
            score DECIMAL(3, 2) NOT NULL,

            rowColor TINYTEXT
        )`
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

// #endregion migrations

// #region db service

function safeQuery(statement, method) {
    /**
    * @param {string} statement - SQL statement to execute
    * @param {string} method - better-sqlite3 Statement object method to execute - typically 'all', 'get', or 'run'
    * @return - normal method return if success, null if failure
    */

    if (ERROR.code) {
        return null;
    };

    try {
        const stmt = db.prepare(statement);
        return stmt[method]();
    } catch (error) {
        console.error(error);
        return null;
    };
};

export const databaseService = {
    getMarriageLeads: () => {
        return safeQuery('SELECT * FROM marriageLeads', 'all') || [];
    },
    updateColor: (rowId, color) => {
        const statement = `
        UPDATE leads
        SET rowColor = '${color}'
        WHERE id = ${rowId}
        `

        return safeQuery(statement, 'run') ? 'success' : 'error';
    }
};

// #endregion db service
