const Cookie = require('../auth/Cookie');
const HttpStatusCode = require('../helpers/HttpStatusCode');
const Url = require('../helpers/Url');

/**
 * This class is responsible for getting the data ready to go back to the client.
 */
class Response {
  constructor(statusCode = HttpStatusCode.OK) {
    this.statusCode = statusCode;
    this.headers = {};
    this.cookies = [];
  }

  getStatusCode() {
    return this.statusCode;
  }

  getHeaders() {
    return this.headers;
  }

  setStatusCode(statusCode) {
    this.statusCode = statusCode;
  }

  addHeader(name, value) {
    this.headers[name] = value;
  }

  redirect(location) {
    this.addHeader('Location', Url.path(location));
    this.setStatusCode(HttpStatusCode.SEE_OTHER);
  }

  addCookie(cookie) {
    this.cookies.push(cookie);
    this.addHeader('Set-Cookie', this.stringifyCookies());
  }

  stringifyCookies() {
    return this.cookies.map((cookie) => cookie.toString());
  }
}

module.exports = Response;
