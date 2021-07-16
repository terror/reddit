const Exception = require('./Exception');

/**
 * This class simply takes the error message and
 * passes it up to the parent Exception class.
 */
class CategoryException extends Exception {
  constructor(message, statusCode) {
    super(message, CategoryException, statusCode);
  }
}

module.exports = CategoryException;
