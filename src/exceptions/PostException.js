const Exception = require('./Exception');

/**
 * This class simply takes the error message and
 * passes it up to the parent Exception class.
 */
class PostException extends Exception {
	constructor(message, statusCode) {
		super(message, PostException, statusCode);
	}
}

module.exports = PostException;
