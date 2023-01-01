/**
 * Runs an SQL query on the database.
 * @since 20230101
 * @param {import('sqlite3').Database} db The database to use.
 * @param {string} sql The SQL query to run.
 * @returns {Promise<*>}
 */
export const query = (db, sql) => new Promise((resolve, reject) => {
    console.log('SQL >', sql);
    db.run(sql, (err) => {
        if (err != null) reject(err);
        else resolve();
    });
});

/**
 * Runs an SQL query on the database.
 * @since 20230101
 * @param {import('sqlite3').Database} db The database to use.
 * @param {string} sql The SQL query to run.
 * @returns {Promise<Object[]>}
 */
export const fetch = (db, sql) => new Promise((resolve, reject) => {
    console.log('SQL >', sql);
    db.all(sql, (err, rows) => {
        if (err != null) reject(err);
        else resolve(rows);
    });
});
