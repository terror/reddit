const mysql = require('mysql2/promise');
const DatabaseException = require('../exceptions/DatabaseException');
require('dotenv').config({ path: `${__dirname}/.env` });

class Database {
  static async connect() {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    return connection;
  }

  static async execute(statement, bindParameters) {
    const connection = await Database.connect();
    let results;

    try {
      [results] = await connection.execute(statement, bindParameters);
    } catch (exception) {
      throw new DatabaseException(exception);
    } finally {
      await connection.end();
    }

    return results;
  }

  static async truncate(tables, autoIncrementStart = 1) {
    const connection = await Database.connect();

    try {
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

      tables.forEach(async (table) => {
        await connection.execute(`DELETE FROM ${table}`);
        await connection.execute(
          `ALTER TABLE ${table} AUTO_INCREMENT = ${autoIncrementStart}`
        );
      });

      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    } catch (exception) {
      throw new DatabaseException(exception);
    } finally {
      await connection.end();
    }
  }
}

module.exports = Database;
