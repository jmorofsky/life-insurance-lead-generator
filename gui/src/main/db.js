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
                title: 'source',
                type: 'text',
                required: true
            },
            {
                title: 'source_url',
                type: 'text',
                required: false
            },
            {
                title: 'spouse1_first',
                type: 'text',
                required: true
            },
            {
                title: 'spouse1_middle',
                type: 'text',
                required: false
            },
            {
                title: 'spouse1_last',
                type: 'text',
                required: true
            },
            {
                title: 'spouse1_dob',
                type: 'date',
                required: false
            },
            {
                title: 'spouse2_first',
                type: 'text',
                required: false
            },
            {
                title: 'spouse2_middle',
                type: 'text',
                required: false
            },
            {
                title: 'spouse2_last',
                type: 'text',
                required: false
            },
            {
                title: 'spouse2_dob',
                type: 'date',
                required: false
            },
            {
                title: 'married_last_name',
                type: 'text',
                required: false
            },
            {
                title: 'license_date',
                type: 'date',
                required: false
            },
            {
                title: 'license_number',
                type: 'integer',
                required: false
            },
            {
                title: 'wedding_date',
                type: 'date',
                required: false
            },
            {
                title: 'wedding_county',
                type: 'text',
                required: false
            },
            {
                title: 'wedding_state',
                type: 'text',
                required: false
            },
            {
                title: 'scraped_at',
                type: 'date',
                required: true
            },
            {
                title: 'score',
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
    }
};

// #endregion db service
