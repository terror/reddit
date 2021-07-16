const Response = require('./Response');
const View = require('../views/View');

class HtmlResponse extends Response {
  constructor(statusCode) {
    super(statusCode);

    this.addHeader('Content-Type', 'text/html');
  }

  async setResponse(responseParameters = {}) {
    responseParameters.payload = responseParameters.payload ?? {};

    if (Object.keys(responseParameters).includes('template')) {
      this.view = await View.initialize(
        responseParameters.template,
        responseParameters
      );
    }

    if (Object.keys(responseParameters).includes('redirect')) {
      this.redirect(responseParameters.redirect);
    }

    if (Object.keys(responseParameters).includes('statusCode')) {
      this.setStatusCode(responseParameters.statusCode);
    }

    return this;
  }

  toString() {
    return this.view?.render() ?? '';
  }
}

module.exports = HtmlResponse;
