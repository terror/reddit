const Controller = require('./Controller');
const User = require('../models/User');
const AuthException = require('../exceptions/AuthException');
const Cookie = require('../auth/Cookie');
const HttpStatusCode = require('../helpers/HttpStatusCode');
const Logger = require('../helpers/Logger');

class AuthController extends Controller {
  constructor(request, response, session) {
    super(request, response, session);
    const params = this.request.parameters.header;

    switch (request.getRequestMethod()) {
      case 'GET':
        if (params[0] === 'register') this.setAction(this.getRegisterForm);
        else if (params[0] === 'login') this.setAction(this.getLoginForm);
        else this.setAction(this.logout);
        break;
      case 'POST':
        this.setAction(this.login);
      default:
        break;
    }
  }

  async getRegisterForm() {
    return await this.response.setResponse({
      template: 'User/NewFormView',
      title: 'New User',
      payload: {},
    });
  }

  async getLoginForm() {
    const cookies = this.request.getCookies();
    return await this.response.setResponse({
      template: 'Auth/LoginFormView',
      title: 'Login',
      payload: { email: cookies.email },
    });
  }

  async login() {
    const { email, password, remember } = this.request.getParameters().body;

    if (remember === 'on') this.response.addCookie(new Cookie('email', email));

    let user;
    try {
      user = await User.logIn(email, password);
    } catch (e) {
      await this.response.setResponse({
        template: 'ErrorView',
        statusCode: 400,
        payload: {},
        message: e.message,
      });
      throw e;
    }

    if (!user) {
      await this.response.setResponse({
        template: 'ErrorView',
        statusCode: 400,
        payload: {},
        message: 'Cannot log in: Invalid credentials.',
      });
      throw new AuthException('Cannot log in: Invalid credentials.');
    }

    this.session.set('user_id', user.getId());

    await this.response.setResponse({
      redirect: `user/${user.getId()}`,
      message: 'Logged in successfully!',
    });

    return this.response;
  }

  logout() {
    this.session.destroy();
    return this.response.setResponse({
      redirect: '/',
      message: 'Logged out successfully!',
    });
  }
}

module.exports = AuthController;
