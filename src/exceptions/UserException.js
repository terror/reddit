const Exception = require('./Exception');

/**
 * This class simply takes the error message and
 * passes it up to the parent Exception class.
 */
class UserException extends Exception {
  constructor(message, statusCode) {
    super(message, UserException, statusCode);
  }
}

module.exports = UserException;
