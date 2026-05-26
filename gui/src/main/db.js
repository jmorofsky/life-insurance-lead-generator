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

// region db service

export const databaseService = {
    getLeads: () => {
        const query = db.prepare('SELECT * FROM leads');
        return query.all();
    }
};

// endregion db service
