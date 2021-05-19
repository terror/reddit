const Controller = require('./Controller');
const Category = require('../models/Category');
const CategoryException = require('../exceptions/CategoryException');
const Post = require('../models/Post');
const AuthException = require('../exceptions/AuthException');
const User = require('../models/User');
const HttpStatusCode = require('../helpers/HttpStatusCode');

class CategoryController extends Controller {
  constructor(request, response, session) {
    super(request, response, session);
    switch (request.requestMethod) {
      case 'POST':
        this.setAction(this.new);
        break;
      case 'GET':
        let values = this.request.parameters.header;
        if (values.length) {
          if (values.length == 2) this.setAction(this.getEditForm);
          else this.setAction(this.show);
          break;
        }
        this.setAction(this.list);
        break;
      case 'PUT':
        this.setAction(this.edit);
        break;
      case 'DELETE':
        this.setAction(this.destroy);
        break;
      default:
        this.setAction(this.error);
        this.response.setResponse({
          statusCode: 405,
          message: 'Invalid request method!',
          payload: {},
        });
        break;
    }
  }

  async new() {
    const { userId, title, description } = this.request.parameters.body;

    // check if logged in
    const user_id = this.session.get('user_id');
    if (!user_id) {
      throw new CategoryException(
        'Cannot create Category: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );
    }

    let res;
    try {
      res = await Category.create(user_id, title, description);
    } catch (e) {
      await this.response.setResponse({
        template: 'ErrorView',
        statusCode: HttpStatusCode.BAD_REQUEST,
        payload: {},
        message: e.message,
      });
      throw e;
    }

    return await this.response.setResponse({
      redirect: '/',
      message: 'Category created successfully!',
      payload: res,
    });
  }

  async list() {
    const res = await Category.findAll();
    this.response.setResponse({
      statusCode: HttpStatusCode.OK,
      payload: res,
      message: 'Categories retrieved successfully!',
    });
    return this.response;
  }

  async show() {
    const res = await this.findCategory(
      parseInt(this.request.parameters.header[0]),
      this.request.parameters
    );

    if (res.statusCode === HttpStatusCode.NOT_FOUND) {
      await this.response.setResponse({
        template: 'ErrorView',
        statusCode: HttpStatusCode.NOT_FOUND,
        payload: {},
        message: `Cannot retrieve Category: Category does not exist with ID ${this.request.parameters.header[0]}.`,
      });
      throw new CategoryException(
        `Cannot retrieve Category: Category does not exist with ID ${this.request.parameters.header[0]}.`
      );
    }

    let posts = await Post.findByCategory(this.request.parameters.header[0]);

    const user_id = this.session.get('user_id');

    let ret = [];
    if (posts != null) {
      for (let i = 0; i < posts.length; ++i) {
        const item = posts[i];

        const state = await item.state(user_id);

        console.log(item.getUpvotes(), item.getDownvotes());

        ret.push({
          id: item.getId(),
          title: item.getTitle(),
          username: item.getUser().getUsername(),
          userId: user_id,
          createdAt: item.getCreatedAt(),
          deletedAt: item.getDeletedAt(),
          upvotes: item.getUpvotes(),
          downvotes: item.getDownvotes(),
          state: state,
          votes: item.getUpvotes() - item.getDownvotes(),
        });
      }
    }

    res.payload.posts = ret;
    res.payload.isLoggedIn = user_id;

    return await this.response.setResponse({
      template: 'Category/ShowView',
      title: res.payload.getTitle(),
      payload: res.payload,
      message: 'Category retrieved successfully!',
      statusCode: HttpStatusCode.OK,
    });
  }

  async edit() {
    const id = this.request.parameters.header[0];

    const user_id = this.session.get('user_id');
    if (!user_id) {
      throw new CategoryException(
        'Cannot update Category: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const { title, description } = this.request.parameters.body;
    if (!title && !description) {
      await this.response.setResponse({
        template: 'ErrorView',
        title: 'Error',
        statusCode: HttpStatusCode.BAD_REQUEST,
        payload: {},
        message: `Cannot update Category: No update parameters were provided.`,
      });

      throw new CategoryException(
        `Cannot update Category: No update parameters were provided.`
      );
    }

    const res = await this.findCategory(parseInt(id), this.request.parameters);

    if (res.statusCode === HttpStatusCode.NOT_FOUND) {
      throw new CategoryException(
        `Cannot update Category: Category does not exist with ID ${id}.`
      );
    }

    // check if deleted
    if (res.payload.deletedAt)
      throw new CategoryException(
        'Cannot update Category: You cannot update a category that has been deleted.'
      );

    // check if wrong user
    if (res.payload.user.getId() !== user_id) {
      throw new CategoryException(
        'Cannot update Category: You cannot update a category created by someone other than yourself.',
        HttpStatusCode.FORBIDDEN
      );
    }

    if (title) res.payload.setTitle(title);
    if (description) res.payload.setDescription(description);

    try {
      const ok = await res.payload.save();
    } catch (e) {
      throw e;
    }

    return await this.response.setResponse({
      redirect: `category/${res.payload.getId()}`,
      message: 'Category updated successfully!',
      payload: res.payload,
    });
  }

  async getEditForm() {
    const id = this.request.parameters.header[0];

    // check if logged in
    const user_id = this.session.get('user_id');
    if (!user_id) {
      throw new CategoryException(
        'Cannot update Category: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );
    }

    // check if category exists
    const cat = await Category.findById(id);
    if (!cat) {
      throw new CategoryException(
        `Cannot update Category: Category does not exist with ID ${id}.`,
        HttpStatusCode.BAD_REQUEST
      );
    }

    // check if wrong user
    if (cat.user.getId() !== user_id) {
      throw new CategoryException(
        'Cannot update Category: You cannot update a category created by someone other than yourself.',
        HttpStatusCode.FORBIDDEN
      );
    }

    return await this.response.setResponse({
      template: 'Category/EditFormView',
      statusCode: HttpStatusCode.OK,
      payload: { id: parseInt(id) },
    });
  }

  async destroy() {
    const id = this.request.parameters.header[0];

    const user_id = this.session.get('user_id');
    if (!user_id) {
      throw new CategoryException(
        'Cannot delete Category: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const res = await Category.findById(parseInt(id));

    if (res === null)
      throw new CategoryException(
        `Cannot delete Category: Category does not exist with ID ${id}.`
      );

    // check if deleted
    if (res.deletedAt)
      throw new CategoryException(
        'Cannot delete Category: You cannot delete a category that has been deleted.'
      );

    // check if wrong user
    if (res.user.getId() !== user_id) {
      throw new CategoryException(
        'Cannot delete Category: You cannot delete a category created by someone other than yourself.',
        HttpStatusCode.FORBIDDEN
      );
    }

    await res.remove();

    return await this.response.setResponse({
      redirect: '/',
      message: 'Category deleted successfully!',
      payload: res,
    });
  }

  async findCategory(id, params) {
    const res = await Category.findById(
      parseInt(this.request.parameters.header[0])
    );
    if (res === null) {
      return {
        statusCode: HttpStatusCode.NOT_FOUND,
        payload: {},
        message: 'Could not retrieve Category.',
      };
    }
    return {
      statusCode: HttpStatusCode.OK,
      payload: res,
      message: 'Category retrieved successfully!',
    };
  }
}

module.exports = CategoryController;
