import { app } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';


// #region documentation
// ===========================================================================
//  ARCHITECTURE
//      lead_tables  : metadata registry; one row per dataset
//      leads_{name} : dataset tables
// 
//  NEW DATASET WORKFLOW
//      1. Create new table from json structure
//      2. Register in lead_tables metadata
//      3. Create triggers to automatically maintain row_count
// ===========================================================================
// #endregion documentation

// #region statement generation

function generate_create_table_sql(schema_json) {
    /**
    * @param {json} schema_json - JSON object containing table details
    * @return - array of SQL strings or null if failure
    */

    /* schema_json format
    {
        "name": "leads_{name}",
        "description": "{description}",
        "columns": [
            {
                "title": "{column title}",
                "type": "{column data type}"
                "required": bool
            }
        ]
    }
    */

    try {
        const create_table_sql = `
            CREATE TABLE IF NOT EXISTS ${schema_json.name} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                row_color TEXT,

                ${schema_json.columns.map(col => {
            let colSql = `${col.title} ${col.type.toUpperCase()}`;

            if (col.required) {
                colSql = colSql + ' NOT NULL';
            };

            return colSql;
        }).join(', ')}
            )`;

        const update_metadata_sql = `
            INSERT INTO lead_tables (
                table_name,
                description
            ) VALUES (
                '${schema_json.name}',
                '${schema_json.description}'
            )`;

        const insert_trigger_sql = `
            CREATE TRIGGER IF NOT EXISTS trg_${schema_json.name}_after_insert
            AFTER INSERT ON ${schema_json.name}
            BEGIN
                UPDATE lead_tables
                SET row_count = row_count + 1
                WHERE table_name = '${schema_json.name}';
            END
        `;

        const delete_trigger_sql = `
            CREATE TRIGGER IF NOT EXISTS trg_${schema_json.name}_after_delete
            AFTER DELETE ON ${schema_json.name}
            BEGIN
                UPDATE lead_tables
                SET row_count = row_count - 1
                WHERE table_name = '${schema_json.name}';
            END
        `;

        return [create_table_sql, update_metadata_sql, insert_trigger_sql, delete_trigger_sql];
    } catch (error) {
        console.error(error);
        return null;
    };
};

// #endregion statement generation

// #region init db

const dbPath = path.join(app.getPath('userData'), 'database.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// #endregion init db

// #region migrations

const MIGRATIONS = [
    [
        // metadata registry
        `CREATE TABLE IF NOT EXISTS lead_tables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL UNIQUE,
            description TEXT,
            row_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
    ],
    generate_create_table_sql({
        name: 'leads_Marriage',
        description: 'Newlyweds. People who have just been married.',
        columns: [
            {
                title: 'Source',
                type: 'text',
                required: true
            },
            {
                title: 'Source_URL',
                type: 'text',
                required: false
            },
            {
                title: 'Spouse1_First',
                type: 'text',
                required: true
            },
            {
                title: 'Spouse1_Middle',
                type: 'text',
                required: false
            },
            {
                title: 'Spouse1_Last',
                type: 'text',
                required: true
            },
            {
                title: 'Spouse1_DOB',
                type: 'date',
                required: false
            },
            {
                title: 'Spouse2_First',
                type: 'text',
                required: false
            },
            {
                title: 'Spouse2_Middle',
                type: 'text',
                required: false
            },
            {
                title: 'Spouse2_Last',
                type: 'text',
                required: false
            },
            {
                title: 'Spouse2_DOB',
                type: 'date',
                required: false
            },
            {
                title: 'Married_Last_Name',
                type: 'text',
                required: false
            },
            {
                title: 'License_Date',
                type: 'date',
                required: false
            },
            {
                title: 'License_Number',
                type: 'integer',
                required: false
            },
            {
                title: 'Wedding_Date',
                type: 'date',
                required: false
            },
            {
                title: 'Wedding_County',
                type: 'text',
                required: false
            },
            {
                title: 'Wedding_State',
                type: 'text',
                required: false
            },
            {
                title: 'Scraped_At',
                type: 'date',
                required: true
            },
            {
                title: 'Score',
                type: 'decimal(3, 2)',
                required: true
            }
        ]
    }),
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

// TODO: better error handling here
export const databaseService = {
    createDataset: schema_json => {
        const stmts = generate_create_table_sql(schema_json);

        if (!stmts) {
            return 'error';
        };

        for (const statement of stmts) {
            if (!safeQuery(statement, 'run')) {
                return 'error';
            };
        };

        return 'success';
    },
    getDataset: table_name => {
        if (!table_name) {
            return {
                name: null,
                columns: [],
                data: []
            };
        };

        return {
            name: table_name,
            columns: safeQuery(`PRAGMA table_info(${table_name})`, 'all') || [],
            data: safeQuery(`SELECT * FROM ${table_name}`, 'all') || []
        };
    },
    getAllDatasets: () => {
        return safeQuery('SELECT * FROM lead_tables', 'all') || [];
    },
    updateColor: (table_name, row_id, color) => {
        const statement = `
            UPDATE ${table_name}
            SET row_color = '${color || ''}'
            WHERE id = ${row_id}
        `;

        return safeQuery(statement, 'run') ? 'success' : 'error';
    },
    updateCell: (table_name, row_id, column_name, value) => {
        const statement = `
            UPDATE ${table_name}
            SET ${column_name} = '${value || ''}'
            WHERE id = ${row_id}
        `;

        return safeQuery(statement, 'run') ? 'success' : 'error';
    },
    createRow: (table_name, row_values) => {
        const columns = Object.keys(row_values).map(c => c.replaceAll(' ', '_')).join(', ');
        const values = Object.values(row_values).map(v => {
            if (v) { return `'${v}'` }
            else { return 'NULL' };
        }).join(', ');

        const statement = `
            INSERT INTO ${table_name} (${columns})
            VALUES (${values})
        `;
        
        return safeQuery(statement, 'run') ? 'success' : 'error';
    },
    deleteRow: (table_name, row_id) => {
        const statement = `
            DELETE FROM ${table_name}
            WHERE id = ${row_id}
        `;

        return safeQuery(statement, 'run') ? 'success' : 'error';
    }
};

// #endregion db service
