const Exception = require('./Exception');

/**
 * This class simply takes the error message and
 * passes it up to the parent Exception class.
 */
class AuthException extends Exception {
  constructor(message) {
    super(message, AuthException);
  }
}

module.exports = AuthException;
