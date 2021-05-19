const Controller = require('./Controller');
const Category = require('../models/Category');

class HomeController extends Controller {
  constructor(request, response, session) {
    super(request, response, session);
    this.setAction(this.home);
  }

  async home() {
    let all = await Category.findAll();

    let pay = all.map((item) => {
      return {
        id: item.getId(),
        title: item.getTitle(),
        username: item.getUser().getUsername(),
        createdAt: item.getCreatedAt(),
        deletedAt: item.getDeletedAt(),
      };
    });

    pay.isLoggedIn = Object.entries(this.session.data).length !== 0;

    return await this.response.setResponse({
      template: 'HomeView',
      title: 'Welcome',
      message: 'Homepage!',
      statusCode: 200,
      payload: pay,
    });
  }
}

module.exports = HomeController;
