class Controller {
  constructor(request, response, session) {
    this.request = request;
    this.response = response;
    this.session = session;
  }

  getAction() {
    return this.action;
  }

  setAction(a) {
    this.action = a;
  }

  async doAction() {
    let ret;
    try {
      ret = this.action();
    } catch (e) {
      throw e;
    }
    return ret;
  }

  async error() {
    const valid = ['GET', 'POST', 'PUT', 'DELETE'];
    let st = 404;
    let msg = 'Invalid request path!';

    if (!valid.includes(this.request.requestMethod)) {
      st = 405;
      msg = 'Invalid request method!';
    }

    return await this.response.setResponse({
      template: 'ErrorView',
      title: 'Error',
      statusCode: st,
      payload: {},
      message: msg,
    });
  }
}

module.exports = Controller;
