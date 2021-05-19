const Model = require('./Model');
const User = require('./User');
const Post = require('./Post');
const CommentException = require('../exceptions/CommentException');

class Comment extends Model {
  constructor(
    id,
    postId,
    userId,
    content,
    createdAt = null,
    editedAt = null,
    deletedAt = null,
    user = null,
    post = null,
    replyId = null,
    upvotes = 0,
    downvotes = 0
  ) {
    super(id);
    this.postId = postId;
    this.userId = userId;
    this.content = content;
    this.createdAt = createdAt;
    this.editedAt = editedAt;
    this.deletedAt = deletedAt;
    this.user = user;
    this.post = post;
    this.replyId = replyId;
    this.upvotes = upvotes;
    this.downvotes = downvotes;
  }

  static async create(userId, postId, content, replyId = null) {
    // validate
    if (!content)
      throw new CommentException('Cannot create Comment: Missing content.');

    // check for user and category
    const user = await User.findById(userId);
    if (!user)
      throw new CommentException(
        `Cannot create Comment: User does not exist with ID ${userId}.`
      );

    const post = await Post.findById(postId);
    if (!post)
      throw new CommentException(
        `Cannot create Comment: Post does not exist with ID ${postId}.`
      );

    const connection = await Model.connect();
    const sql = `INSERT INTO comment (user_id, post_id, reply_id, content) VALUES (?, ?, ?, ?)`;
    let results;

    try {
      [results] = await connection.execute(sql, [
        userId,
        postId,
        replyId,
        content,
      ]);
    } catch (_) {
    } finally {
      await connection.end();
    }
    if (!results) return null;

    const { insertId, created_at, edited_at, deleted_at } = results;

    if (replyId) {
      const ret = new Comment(
        insertId - 1,
        userId,
        postId,
        content,
        created_at,
        edited_at,
        deleted_at,
        user,
        post,
        replyId
      );
      return new Comment(
        insertId,
        userId,
        postId,
        content,
        created_at,
        edited_at,
        deleted_at,
        user,
        post,
        ret
      );
    }
    return new Comment(
      insertId,
      userId,
      postId,
      content,
      created_at,
      edited_at,
      deleted_at,
      user,
      post,
      replyId
    );
  }

  static async findById(id) {
    if (!id) return null;
    const connection = await Model.connect();
    const sql = `SELECT * FROM comment where id = ?`;
    let results;

    try {
      [results] = await connection.execute(sql, [id]);
    } catch (_) {
    } finally {
      await connection.end();
    }

    if (!results.length) return null;

    const {
      post_id,
      user_id,
      reply_id,
      content,
      created_at,
      edited_at,
      deleted_at,
    } = results[0];

    // check for user and category
    const user = await User.findById(user_id);
    if (!user) return null;

    const post = await Post.findById(post_id);
    if (!post) return null;

    const { up, down } = await Comment.getVotes(id);

    return new Comment(
      id,
      post_id,
      user_id,
      content,
      created_at,
      edited_at,
      deleted_at,
      user,
      post,
      reply_id,
      up,
      down
    );
  }

  static async findByUser(user_id) {
    if (!user_id) return null;
    const connection = await Model.connect();
    const sql = `SELECT * FROM comment where user_id = ?`;
    let results;

    try {
      [results] = await connection.execute(sql, [user_id]);
    } catch (_) {
    } finally {
      await connection.end();
    }

    if (!results.length) return null;

    let ret = [];
    for (let i = 0; i < results.length; ++i) {
      const {
        id,
        post_id,
        reply_id,
        content,
        created_at,
        edited_at,
        deleted_at,
      } = results[i];

      // check for user and category
      const user = await User.findById(user_id);
      if (!user) return null;

      const post = await Post.findById(post_id);
      if (!post) return null;

      const { up, down } = await Comment.getVotes(id);

      ret.push(
        new Comment(
          id,
          post_id,
          user_id,
          content,
          created_at,
          edited_at,
          deleted_at,
          user,
          post,
          reply_id,
          up,
          down
        )
      );
    }
    return ret;
  }

  static async findByPost(post_id) {
    if (!post_id) return null;
    const connection = await Model.connect();
    const sql = `SELECT * FROM comment where post_id = ?`;
    let results;

    try {
      [results] = await connection.execute(sql, [post_id]);
    } catch (_) {
    } finally {
      await connection.end();
    }

    if (!results.length) return null;

    let ret = [];
    for (let i = 0; i < results.length; ++i) {
      const {
        id,
        user_id,
        reply_id,
        content,
        created_at,
        edited_at,
        deleted_at,
      } = results[i];

      // check for user and category
      const user = await User.findById(user_id);
      if (!user) return null;

      const post = await Post.findById(post_id);
      if (!post) return null;

      ret.push(
        new Comment(
          id,
          post_id,
          user_id,
          content,
          created_at,
          edited_at,
          deleted_at,
          user,
          post,
          reply_id
        )
      );
    }
    return ret;
  }

  static async getReplies(reply_id) {
    if (!reply_id) return null;
    const connection = await Model.connect();
    const sql = `SELECT * FROM comment where reply_id = ?`;
    let results;

    try {
      [results] = await connection.execute(sql, [reply_id]);
    } catch (_) {
    } finally {
      await connection.end();
    }

    if (!results.length) return null;

    let ret = [];
    for (let i = 0; i < results.length; ++i) {
      const {
        id,
        post_id,
        user_id,
        content,
        created_at,
        edited_at,
        deleted_at,
      } = results[i];

      // check for user and category
      const user = await User.findById(user_id);
      if (!user) return null;

      const post = await Post.findById(post_id);
      if (!post) return null;

      ret.push(
        new Comment(
          id,
          post_id,
          user_id,
          content,
          created_at,
          edited_at,
          deleted_at,
          user,
          post,
          reply_id
        )
      );
    }
    return ret;
  }

  async save() {
    // validate
    if (!this.content)
      throw new CommentException('Cannot update Comment: Missing content.');

    const connection = await Model.connect();
    const sql = 'UPDATE comment SET content=?, edited_at=NOW() where id=?';
    try {
      await connection.execute(sql, [this.content, this.id]);
    } catch (_) {
    } finally {
      await connection.end();
    }
    return true;
  }

  async remove() {
    const connection = await Model.connect();
    const sql = 'UPDATE comment SET deleted_at=NOW() where id=?';
    try {
      await connection.execute(sql, [this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }
    return true;
  }

  static async getBookmarkedComments(id) {
    const connection = await Model.connect();
    const sql = 'SELECT * FROM bookmarked_comment WHERE user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [id]);
    } catch (_) {
    } finally {
      await connection.end();
    }

    let ret = [];
    for (let i = 0; i < results.length; ++i) {
      const { comment_id } = results[i];
      ret.push(await Comment.findById(comment_id));
    }
    return ret;
  }

  async bookmark(id) {
    let connection = await Model.connect();
    let sql =
      'SELECT * FROM bookmarked_comment where comment_id=? and user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [this.id, id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    if (results.length)
      throw new CommentException(
        'Cannot bookmark Comment: Comment has already been bookmarked.'
      );

    // add row to table
    connection = await Model.connect();
    sql = 'INSERT INTO bookmarked_comment (comment_id, user_id) VALUES(?, ?)';

    try {
      await connection.execute(sql, [this.id, id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    return true;
  }

  async unbookmark(id) {
    let connection = await Model.connect();
    let sql =
      'SELECT * FROM bookmarked_comment where comment_id=? and user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [this.id, id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    if (!results.length)
      throw new CommentException(
        'Cannot unbookmark Comment: Comment has not been bookmarked.'
      );

    // remove row from table
    connection = await Model.connect();
    sql = 'DELETE FROM bookmarked_comment where comment_id=? and user_id=?';

    try {
      await connection.execute(sql, [this.id, id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    return true;
  }

  static async getVotes(id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM comment_vote where comment_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    let votes = { up: 0, down: 0 };
    for (let i = 0; i < results.length; ++i) {
      const { type } = results[i];
      votes.up += type === 'Up';
      votes.down += type === 'Down';
    }
    return votes;
  }

  async upVote(id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM comment_vote where comment_id=? and user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [this.id, id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    // hasn't been touched, add it
    if (!results.length) {
      connection = await Model.connect();
      sql =
        'INSERT INTO comment_vote (user_id, comment_id, type) VALUES(?, ?, ?)';

      try {
        await connection.execute(sql, [id, this.id, 'Up']);
      } catch (_) {
        return false;
      } finally {
        await connection.end();
      }

      ++this.upvotes;
      return true;
    }

    const { type } = results[0];

    if (type === 'Up')
      throw new CommentException(
        'Cannot up vote Comment: Comment has already been up voted.'
      );

    // update enum
    connection = await Model.connect();
    sql = 'UPDATE comment_vote set type=? where user_id=? and comment_id=?';

    try {
      await connection.execute(sql, ['Up', id, this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    ++this.upvotes;
    return true;
  }

  async downVote(id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM comment_vote where comment_id=? and user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [this.id, id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    // hasn't been touched, add it
    if (!results.length) {
      connection = await Model.connect();
      sql =
        'INSERT INTO comment_vote (user_id, comment_id, type) VALUES(?, ?, ?)';

      try {
        await connection.execute(sql, [id, this.id, 'Down']);
      } catch (_) {
        return false;
      } finally {
        await connection.end();
      }

      return true;
    }

    const { type } = results[0];

    if (type === 'Down')
      throw new CommentException(
        'Cannot down vote Comment: Comment has already been down voted.'
      );

    // update enum
    connection = await Model.connect();
    sql = 'UPDATE comment_vote set type=? where user_id=? and comment_id=?';

    try {
      await connection.execute(sql, ['Down', id, this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    ++this.downvotes;
    return true;
  }

  async unvote(id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM comment_vote where comment_id=? and user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [this.id, id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    if (!results.length) {
      throw new CommentException(
        'Cannot unvote Comment: Comment must first be up or down voted.'
      );
    }

    const { type } = results[0];

    connection = await Model.connect();
    sql = 'DELETE FROM comment_vote WHERE user_id=? and comment_id=?';

    try {
      await connection.execute(sql, [id, this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    if (type === 'Down') --this.downvotes;
    else --this.upvotes;
    return true;
  }

  static async getUserVotes(user_id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM comment_vote where user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [user_id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    let comments = [];

    for (let i = 0; i < results.length; ++i) {
      const { comment_id } = results[i];
      const comment = await Comment.findById(comment_id);
      comments.push(comment);
    }
    return comments;
  }

  static async isBookmarked(user_id, comment_id) {
    const comments = await Comment.getBookmarkedComments(user_id);
    for (let i = 0; i < comments.length; ++i) {
      if (comments[i].id === comment_id) return true;
    }
    return false;
  }

  async state(id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM comment_vote where comment_id=? and user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [this.id, id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    if (!results.length) return null;

    const { type } = results[0];

    return type;
  }

  getUpvotes() {
    return this.upvotes;
  }

  getDownvotes() {
    return this.downvotes;
  }

  getContent() {
    return this.content;
  }

  setContent(content) {
    this.content = content;
  }

  getUser() {
    return this.user;
  }

  getPost() {
    return this.post;
  }

  getRepliedTo() {
    return this.replyId;
  }
}

module.exports = Comment;
