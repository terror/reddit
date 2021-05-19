const HttpStatusCode = require('../helpers/HttpStatusCode');
const logger = require('../helpers/Logger');

/**
 * A custom exception handler that extends the built-in
 * JS Error class. We can call the logger once in this class
 * and we know that it will fire every time an exception is
 * thrown. This way, we don't have to call the logger every
 * time we throw an error in every other class.
 */
class Exception extends Error {
	constructor(message, exception, statusCode = HttpStatusCode.BAD_REQUEST) {
		super(message);
		Error.captureStackTrace(this, exception);
		this.name = exception.name;
		this.statusCode = statusCode;
		logger.error(this);
	}
}

module.exports = Exception;
