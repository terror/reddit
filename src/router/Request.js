class Request {
  constructor(
    requestMethod = 'GET',
    controllerName = '',
    parameters = {},
    cookies
  ) {
    this.requestMethod = requestMethod;
    this.controllerName = this.parseControllerName(controllerName);
    this.parameters = this.parseParams(parameters, controllerName);
    this.cookies = cookies;
  }

  parseControllerName(m) {
    return m.split('/')[1] || '';
  }

  parseParams(a, b) {
    let ret = {};
    const c = b.split('/').slice(2);
    ret.body = a;
    ret.header = c.length ? c : [];
    return ret;
  }

  getRequestMethod() {
    return this.requestMethod;
  }

  getControllerName() {
    return this.controllerName;
  }

  getParameters() {
    return this.parameters;
  }

  getCookies() {
    return this.cookies;
  }
}

module.exports = Request;
