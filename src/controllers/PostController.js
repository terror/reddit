const Controller = require('./Controller');
const Post = require('../models/Post');
const PostException = require('../exceptions/PostException');
const Comment = require('../models/Comment');
const HttpStatusCode = require('../helpers/HttpStatusCode');

const statusCodes = {
  SUCCESS: 200,
  NOT_FOUND: 404,
  ERROR: 400,
};

class PostController extends Controller {
  constructor(request, response, session) {
    super(request, response, session);
    switch (request.requestMethod) {
      case 'POST':
        this.setAction(this.new);
        break;
      case 'GET':
        let values = this.request.parameters.header;
        if (values.length == 2) {
          if (values[1] == 'edit') this.setAction(this.getEditForm);
          if (values[1] == 'bookmark') this.setAction(this.bookmark);
          if (values[1] == 'unbookmark') this.setAction(this.unbookmark);
          if (values[1] == 'upvote') this.setAction(this.upvote);
          if (values[1] == 'downvote') this.setAction(this.downvote);
          if (values[1] == 'unvote') this.setAction(this.unvote);
        } else this.setAction(this.show);
        break;
      case 'PUT':
        this.setAction(this.edit);
        break;
      case 'DELETE':
        this.setAction(this.destroy);
        break;
      default:
        this.setAction(this.error);
        break;
    }
  }

  async new() {
    const {
      userId,
      categoryId,
      title,
      type,
      content,
    } = this.request.parameters.body;

    const user_id = this.session.get('user_id');
    if (!user_id)
      throw new PostException(
        'Cannot create Post: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );

    let res;

    try {
      res = await Post.create(user_id, categoryId, title, type, content);
    } catch (e) {
      await this.response.setResponse({
        template: 'ErrorView',
        statusCode: statusCodes.ERROR,
        payload: {},
        message: e.message,
      });
      throw e;
    }

    return await this.response.setResponse({
      redirect: `category/${categoryId}`,
      message: 'Post created successfully!',
      payload: res,
    });
  }

  async show() {
    const res = await this.findPost(
      parseInt(this.request.parameters.header[0]),
      this.request.parameters
    );

    if (res.statusCode === statusCodes.NOT_FOUND) {
      await this.response.setResponse({
        template: 'ErrorView',
        statusCode: statusCodes.NOT_FOUND,
        payload: {},
        message: `Cannot retrieve Post: Post does not exist with ID ${this.request.parameters.header[0]}.`,
      });
      throw new PostException(
        `Cannot retrieve Post: Post does not exist with ID ${this.request.parameters.header[0]}.`
      );
    }

    const user_id = this.session.get('user_id');
    const is_bookmarked = await Post.isBookmarked(user_id, res.payload.id);
    const state = await res.payload.state(user_id);

    res.payload.canEdit = res.payload.type === 'Text';
    res.payload.isUsersPost = res.payload.getId() === user_id;
    res.payload.canComment = user_id;
    res.payload.user_id = user_id;
    res.payload.is_bookmarked = is_bookmarked;
    res.payload.state = state;
    res.payload.votes = res.payload.getUpvotes() - res.payload.getDownvotes();

    let comments = await Comment.findByPost(this.request.parameters.header[0]);

    let ret = [];
    if (comments != null) {
      for (let i = 0; i < comments.length; ++i) {
        const item = comments[i];

        const is_comment_bookmarked = await Comment.isBookmarked(
          user_id,
          item.getId()
        );
        const state = await item.state(user_id);

        ret.push({
          id: item.getId(),
          username: item.getUser().getUsername(),
          createdAt: item.getCreatedAt(),
          content: item.getContent(),
          deletedAt: item.getDeletedAt(),
          isUsersComment: item.user.getId() === this.session.get('user_id'),
          is_bookmarked: is_comment_bookmarked,
          votes: item.getUpvotes() - item.getDownvotes(),
          state: state,
          isLoggedIn: user_id,
        });
      }
    }

    res.payload.comments = ret;

    return await this.response.setResponse({
      template: 'Post/ShowView',
      title: `${res.payload.getTitle()}`,
      payload: res.payload,
      message: 'Post retrieved successfully!',
      statusCode: 200,
    });
  }

  async edit() {
    const user_id = this.session.get('user_id');
    if (!user_id)
      throw new PostException(
        'Cannot update Post: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );

    const res = await this.findPost(
      parseInt(this.request.parameters.header[0]),
      this.request.parameters
    );

    if (res.statusCode === statusCodes.NOT_FOUND)
      throw new PostException(
        `Cannot update Post: Post does not exist with ID ${this.request.parameters.header[0]}.`
      );

    if (res.payload.deletedAt)
      throw new PostException(
        'Cannot update Post: You cannot update a post that has been deleted.'
      );

    if (res.payload.user.getId() !== user_id) {
      throw new PostException(
        'Cannot update Post: You cannot update a post created by someone other than yourself.',
        HttpStatusCode.FORBIDDEN
      );
    }

    const { content } = this.request.parameters.body;
    if (!content) {
      await this.response.setResponse({
        template: 'ErrorView',
        title: 'Error',
        statusCode: 400,
        payload: {},
        message: `Cannot update Post: No update parameters were provided.`,
      });

      throw new PostException(
        'Cannot update Post: No update parameters were provided.'
      );
    }

    res.payload.setContent(content);

    try {
      const ok = await res.payload.save();
    } catch (e) {
      throw e;
    }

    return await this.response.setResponse({
      redirect: `post/${res.payload.getId()}`,
      message: 'Post updated successfully!',
      payload: res.payload,
    });
  }

  async getEditForm() {
    const id = this.request.parameters.header[0];

    const user_id = this.session.get('user_id');
    if (!user_id)
      throw new PostException(
        'Cannot update Post: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );

    const res = await Post.findById(parseInt(id));

    if (!res) {
      throw new PostException(
        `Cannot update Post: Post does not exist with ID ${id}.`
      );
    }

    if (res.user.getId() !== user_id) {
      throw new PostException(
        'Cannot update Post: You cannot update a post created by someone other than yourself.',
        HttpStatusCode.FORBIDDEN
      );
    }

    return await this.response.setResponse({
      template: 'Post/EditFormView',
      statusCode: 200,
      payload: res,
    });
  }

  async destroy() {
    const id = this.request.parameters.header[0];

    const user_id = this.session.get('user_id');
    if (!user_id)
      throw new PostException(
        'Cannot delete Post: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );

    const res = await Post.findById(parseInt(id));

    if (res === null)
      throw new PostException(
        `Cannot delete Post: Post does not exist with ID ${this.request.parameters.header[0]}.`
      );

    if (res.deletedAt)
      throw new PostException(
        'Cannot delete Post: You cannot delete a post that has been deleted.'
      );

    if (res.user.getId() !== user_id) {
      throw new PostException(
        'Cannot delete Post: You cannot delete a post created by someone other than yourself.',
        HttpStatusCode.FORBIDDEN
      );
    }

    await res.remove();

    return await this.response.setResponse({
      redirect: `post/${res.getId()}`,
      message: 'Post deleted successfully!',
      payload: res,
    });
  }

  async bookmark() {
    const id = this.request.parameters.header[0];

    const res = await Post.findById(parseInt(id));

    if (res === null)
      throw new PostException(
        `Cannot bookmark Post: Post does not exist with ID ${this.request.parameters.header[0]}.`
      );

    const user_id = this.session.get('user_id');
    if (!user_id)
      throw new PostException(
        'Cannot bookmark Post: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );

    try {
      await res.bookmark(user_id);
    } catch (e) {
      this.response.setResponse({
        message: e.message,
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        payload: {},
      });
      throw e;
    }

    return this.response.setResponse({
      message: 'Post was bookmarked successfully!',
      statusCode: HttpStatusCode.OK,
      payload: {},
    });
  }

  async unbookmark() {
    const id = this.request.parameters.header[0];

    const res = await Post.findById(parseInt(id));

    if (res === null)
      throw new PostException(
        `Cannot unbookmark Post: Post does not exist with ID ${this.request.parameters.header[0]}.`
      );

    const user_id = this.session.get('user_id');
    if (!user_id)
      throw new PostException(
        'Cannot unbookmark Post: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );

    try {
      await res.unbookmark(user_id);
    } catch (e) {
      this.response.setResponse({
        message: e.message,
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        payload: {},
      });
      throw e;
    }

    return this.response.setResponse({
      message: 'Post was unbookmarked successfully!',
      statusCode: HttpStatusCode.OK,
      payload: {},
    });
  }

  async upvote() {
    const id = this.request.parameters.header[0];

    const res = await Post.findById(parseInt(id));

    if (res === null)
      throw new PostException(
        `Cannot up vote Post: Post does not exist with ID ${this.request.parameters.header[0]}.`
      );

    const user_id = this.session.get('user_id');
    if (!user_id)
      throw new PostException(
        'Cannot up vote Post: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );

    try {
      await res.upVote(user_id);
    } catch (e) {
      this.response.setResponse({
        message: e.message,
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        payload: {},
      });
      throw e;
    }

    return this.response.setResponse({
      message: 'Post was up voted successfully!',
      statusCode: HttpStatusCode.OK,
      payload: {},
    });
  }

  async downvote() {
    const id = this.request.parameters.header[0];

    const res = await Post.findById(parseInt(id));

    if (res === null)
      throw new PostException(
        `Cannot down vote Post: Post does not exist with ID ${this.request.parameters.header[0]}.`
      );

    const user_id = this.session.get('user_id');
    if (!user_id)
      throw new PostException(
        'Cannot down vote Post: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );

    try {
      await res.downVote(user_id);
    } catch (e) {
      this.response.setResponse({
        message: e.message,
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        payload: {},
      });
      throw e;
    }

    return this.response.setResponse({
      message: 'Post was down voted successfully!',
      statusCode: HttpStatusCode.OK,
      payload: {},
    });
  }

  async unvote() {
    const id = this.request.parameters.header[0];

    const res = await Post.findById(parseInt(id));

    if (res === null)
      throw new PostException(
        `Cannot unvote Post: Post does not exist with ID ${this.request.parameters.header[0]}.`
      );

    const user_id = this.session.get('user_id');
    if (!user_id)
      throw new PostException(
        'Cannot unvote Post: You must be logged in.',
        HttpStatusCode.UNAUTHORIZED
      );

    try {
      await res.unvote(user_id);
    } catch (e) {
      this.response.setResponse({
        message: e.message,
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        payload: {},
      });
      throw e;
    }

    return this.response.setResponse({
      message: 'Post was unvoted successfully!',
      statusCode: HttpStatusCode.OK,
      payload: {},
    });
  }

  async findPost(id, params) {
    const res = await Post.findById(id);

    if (res === null) {
      return {
        statusCode: statusCodes.NOT_FOUND,
        payload: {},
        message: 'Could not retrieve Post.',
      };
    }
    return {
      statusCode: statusCodes.SUCCESS,
      payload: res,
      message: 'Post retrieved successfully!',
    };
  }
}

module.exports = PostController;
