const Controller = require('./Controller');

class ErrorController extends Controller {
  constructor(request, response, session) {
    super(request, response, session);
    this.setAction(this.error);
  }
}

module.exports = ErrorController;
