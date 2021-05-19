const Exception = require('./Exception');

/**
 * This class takes the error object that is thrown
 * by the mysql2 library and changes the message so that
 * it reads "DatabaseException" instead of just the generic
 * "Error" message. To see an example of this class in use,
 * please look at the truncate method in src/database/Database.js
 */
class DatabaseException extends Exception {
	constructor(error) {
		const message = error.message.replace('Error: ', 'DatabaseException: ');
		const stack = error.stack.replace('Error: ', 'DatabaseException: ');

		super(message, DatabaseException);

		this.message = message;
		this.stack = stack;
	}
}

module.exports = DatabaseException;
