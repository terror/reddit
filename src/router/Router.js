const UserController = require('../controllers/UserController');
const CategoryController = require('../controllers/CategoryController');
const PostController = require('../controllers/PostController');
const CommentController = require('../controllers/CommentController');
const HomeController = require('../controllers/HomeController');
const ErrorController = require('../controllers/ErrorController');
const AuthController = require('../controllers/AuthController');

class Router {
  constructor(request, response, session) {
    this.request = request;
    this.response = response;
    this.session = session;
    this.setController(this.request.controllerName);
  }

  // todo: refactor this trash
  setController(c) {
    switch (c) {
      case '':
        this.controller = new HomeController(
          this.request,
          this.response,
          this.session
        );
        break;
      case 'auth':
        this.controller = new AuthController(
          this.request,
          this.response,
          this.session
        );
        break;
      case 'user':
        this.controller = new UserController(
          this.request,
          this.response,
          this.session
        );
        break;
      case 'category':
        this.controller = new CategoryController(
          this.request,
          this.response,
          this.session
        );
        break;
      case 'post':
        this.controller = new PostController(
          this.request,
          this.response,
          this.session
        );
        break;
      case 'comment':
        this.controller = new CommentController(
          this.request,
          this.response,
          this.session
        );
        break;
      default:
        this.controller = new ErrorController(
          this.request,
          this.response,
          this.session
        );
        break;
    }
  }

  getController() {
    return this.controller;
  }

  async dispatch() {
    let ret;
    try {
      ret = await this.controller.doAction();
    } catch (e) {
      this.response.setResponse({
        statusCode: e.statusCode || 400,
        message: e.message,
        payload: {},
      });
      return this.response;
    }
    return ret;
  }
}

module.exports = Router;
