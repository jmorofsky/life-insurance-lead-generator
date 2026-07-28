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


function generateTableSQL(schema_json) {
    /**
    * @param {object} schema_json - JSON object containing table details
    * @return - array of objects containing SQL strings and parameters, or null if failure
    */

    /* schema_json format
    {
        "name": "{name}",
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

    // SQLite only has 5 storage classes: NULL, INTEGER, REAL, TEXT, and BLOB. 
    // However, We still create tables with other types (namely date, decimal, and double)
    // to allow for custom cell rendering based on type in lead tables.

    const formatted_name = `leads_${schema_json.name}`;

    try {
        const create_table_sql = {
            sql: `CREATE TABLE IF NOT EXISTS '${formatted_name}' (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    row_color TEXT,

                    ${schema_json.columns.map(col => {
                        let colSql = `'${col.title}' ${col.type.toUpperCase()}`;

                        if (col.required) {
                            colSql = colSql + ' NOT NULL';
                        };

                        return colSql;
                    }).join(', ')}
                )`
        };

        const update_metadata_sql = schema_json.description ?
            {
                sql: `INSERT INTO lead_tables (
                    table_name,
                    description
                ) VALUES (?, ?)`,
                parameters: [formatted_name, schema_json.description]
            }
            :
            {
                sql: `INSERT INTO lead_tables (
                    table_name,
                    description
                ) VALUES (?, NULL)`,
                parameters: [formatted_name]
            };

        const insert_trigger_sql = {
            sql: `CREATE TRIGGER IF NOT EXISTS 'trg_${formatted_name}_after_insert'
                AFTER INSERT ON "${formatted_name}"
                BEGIN
                    UPDATE lead_tables
                    SET row_count = row_count + 1
                    WHERE table_name = '${formatted_name}';
                END`
        };

        const delete_trigger_sql = {
            sql: `CREATE TRIGGER IF NOT EXISTS 'trg_${formatted_name}_after_delete'
                AFTER DELETE ON "${formatted_name}"
                BEGIN
                    UPDATE lead_tables
                    SET row_count = row_count - 1
                    WHERE table_name = '${formatted_name}';
                END`
        };

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
        {
            sql: `CREATE TABLE IF NOT EXISTS lead_tables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT NOT NULL UNIQUE,
                description TEXT,
                row_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )`
        }
    ],
    generateTableSQL({
        name: 'Marriage',
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
                type: 'decimal',
                required: true
            }
        ]
    }),
];

const CURRENT_VERSION = db.pragma('user_version', { simple: true });
const ERROR = { code: 0, message: null };

for (let i = 0; i < MIGRATIONS.length; i++) {
    if (ERROR.code) { break };
    if (i < CURRENT_VERSION) { continue };

    const stmts = MIGRATIONS[i];

    for (const stmt of stmts) {
        if (!safeQuery(stmt.sql, 'run', stmt.parameters)) {
            console.error("An error occurred while running migrations.");

            ERROR.code = 1;
            ERROR.message = error;
            break;
        };
    };

    db.pragma(`user_version = ${i + 1}`);
};

// #endregion migrations

// #region db service

function safeQuery(statement, method, parameters = []) {
    /**
    * @param {string} statement - SQL statement to execute
    * @param {string} method - better-sqlite3 Statement object method to execute - typically 'all', 'get', or 'run'
    * @param {array} parameters - parameters for statement
    * @return - normal method return if success, null if failure
    */

    if (ERROR.code) {
        return null;
    };

    try {
        const stmt = db.prepare(statement);
        return stmt[method](...parameters);
    } catch (error) {
        console.error(error);
        return null;
    };
};

// TODO: better error handling here - update safeQuery to return object, status and message if error
export const databaseService = {
    createDataset: schema_json => {
        if (!schema_json) { return 'error' };

        const stmts = generateTableSQL(schema_json);

        if (!stmts) { return 'error' };

        for (const statement of stmts) {
            if (!safeQuery(statement.sql, 'run', statement.parameters)) {
                return 'error';
            };
        };

        return 'success';
    },
    deleteDataset: (dataset_id, table_name) => {
        if (!dataset_id || !table_name) { return 'error' };

        const stmts = [
            { sql: `DROP TABLE IF EXISTS "${table_name}"` },
            {
                sql: `DELETE FROM lead_tables 
                    WHERE id = ${dataset_id} AND table_name = '${table_name}'`
            }
        ];

        for (const stmt of stmts) {
            if (!safeQuery(stmt.sql, 'run', stmt.parameters)) {
                return 'error';
            };
        };

        return 'success';
    },
    cloneDataset: dataset => {
        if (!dataset) { return 'error' };

        let new_table_name = `${dataset.table_name}: Clone`;
        let exists = false;
        let count = 1;

        do {
            const result = safeQuery(
                'SELECT * FROM lead_tables WHERE table_name = ?',
                'get',
                [new_table_name]
            );

            if (result === null) {
                return 'error';
            } else if (result === undefined) {
                exists = false;
            } else {
                exists = true;
                count += 1;
                new_table_name = `${dataset.table_name}: Clone (${count})`;
            };
        } while (exists);

        const info = safeQuery(
            `SELECT * FROM pragma_table_info('${dataset.table_name}')`,
            'all'
        );

        const columns = info.map(c => {
            if (['id', 'row_color'].includes(c.name)) {
                return null;
            };

            return {
                title: c.name,
                type: c.type,
                required: !!c.notnull
            };
        }).filter(Boolean);

        const stmts = generateTableSQL({
            name: new_table_name.slice(6),  // remove leading "leads_"
            description: dataset.description,
            columns: columns
        });

        for (const stmt of stmts) {
            if (!safeQuery(stmt.sql, 'run', stmt.parameters)) {
                return 'error';
            };
        };

        if (!safeQuery(
            `INSERT INTO '${new_table_name}' SELECT * FROM '${dataset.table_name}'`,
            'run'
        )) { return 'error' };

        return 'success';
    },
    editDataset: (dataset, new_name, new_description) => {
        if (!dataset || !new_name) {
            return 'error';
        };

        const formatted_name = `leads_${new_name}`;

        // if the dataset name didn't get updated
        if (formatted_name === dataset.table_name) {
            if (!safeQuery(
                `UPDATE lead_tables
                SET table_name = ?, description = ?
                WHERE id = ?`,
                'run',
                [formatted_name, new_description || null, dataset.id]
            )) {
                return 'error';
            };

            return 'success';
        };

        const stmts = [
            {
                sql: `ALTER TABLE '${dataset.table_name}' 
                    RENAME TO '${formatted_name}'`
            },
            {
                sql: `UPDATE lead_tables
                    SET table_name = ?, description = ?
                    WHERE id = ?`,
                parameters: [formatted_name, new_description || null, dataset.id]
            },
            {
                sql: `DROP TRIGGER IF EXISTS 'trg_${dataset.table_name}_after_insert'`
            },
            {
                sql: `CREATE TRIGGER IF NOT EXISTS 'trg_${formatted_name}_after_insert'
                    AFTER INSERT ON '${formatted_name}'
                    BEGIN
                        UPDATE lead_tables
                        SET row_count = row_count + 1
                        WHERE table_name = '${formatted_name}';
                    END`
            },
            {
                sql: `DROP TRIGGER IF EXISTS 'trg_${dataset.table_name}_after_delete'`
            },
            {
                sql: `CREATE TRIGGER IF NOT EXISTS "trg_${formatted_name}_after_delete"
                    AFTER DELETE ON "${formatted_name}"
                    BEGIN
                        UPDATE lead_tables
                        SET row_count = row_count - 1
                        WHERE table_name = '${formatted_name}';
                    END`
            }
        ];

        for (const stmt of stmts) {
            if (!safeQuery(stmt.sql, 'run', stmt.parameters)) {
                return 'error';
            };
        };

        return 'success';
    },
    getDataset: table_name => {
        if (!table_name) { return 'error' };

        return {
            name: table_name,
            columns: safeQuery(
                `SELECT * FROM pragma_table_info('${table_name}')`,
                'all'
            ),
            data: safeQuery(
                `SELECT * FROM "${table_name}"`,
                'all'
            )
        };
    },
    getAllDatasets: () => {
        return safeQuery('SELECT * FROM lead_tables', 'all');
    },
    updateColor: (table_name, row_id, color) => {
        if (!table_name || !row_id || !color) { return 'error' };

        return safeQuery(
            `UPDATE "${table_name}"
            SET row_color = ?
            WHERE id = ?`,
            'run',
            [color, row_id]
        ) ? 'success' : 'error';
    },
    updateCell: (table_name, row_id, column_name, value) => {
        if (!table_name || !row_id || !column_name) { return 'error' };

        if (value === null || value === undefined) {
            return safeQuery(
                `UPDATE "${table_name}"
                SET "${column_name}" = NULL
                WHERE id = ?`,
                'run',
                [row_id]
            ) ? 'success' : 'error';
        } else {
            return safeQuery(
                `UPDATE "${table_name}"
                SET "${column_name}" = ?
                WHERE id = ?`,
                'run',
                [value, row_id]
            ) ? 'success' : 'error';
        };
    },
    createRow: (table_name, row_values) => {
        if (!table_name || !row_values) { return 'error' };

        const columns = Object.keys(row_values).map(c => `"${c}"`).join(', ');
        const values = Object.values(row_values).map(v => {
            if (v === null || v === undefined) { return 'NULL' }
            else { return v };
        });

        return safeQuery(
            `INSERT INTO "${table_name}" (${columns})
            VALUES (${values.map(v => '?').join(', ')})`,
            'run',
            values
        ) ? 'success' : 'error';
    },
    deleteRow: (table_name, row_id) => {
        if (!table_name || !row_id) { return 'error' };

        return safeQuery(
            `DELETE FROM "${table_name}"
            WHERE id = ?`,
            'run',
            [row_id]
        ) ? 'success' : 'error';
    }
};

// #endregion db service
