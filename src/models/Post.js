const Category = require('./Category');
const Model = require('./Model');
const User = require('./User');
const PostException = require('../exceptions/PostException');

class Post extends Model {
  constructor(
    id,
    userId,
    categoryId,
    title,
    type,
    content,
    createdAt = null,
    editedAt = null,
    deletedAt = null,
    user = null,
    category = null,
    upvotes = 0,
    downvotes = 0
  ) {
    super(id);
    this.userId = userId;
    this.categoryId = categoryId;
    this.title = title;
    this.type = type;
    this.content = content;
    this.createdAt = createdAt;
    this.editedAt = editedAt;
    this.deletedAt = deletedAt;
    this.user = user;
    this.category = category;
    this.upvotes = upvotes;
    this.downvotes = downvotes;
  }

  static async create(userId, categoryId, title, type, content) {
    // validate
    if (!title) throw new PostException('Cannot create Post: Missing title.');

    if (!type) throw new PostException('Cannot create Post: Missing type.');

    if (!content)
      throw new PostException('Cannot create Post: Missing content.');

    // check for user and category
    const user = await User.findById(userId);
    if (!user)
      throw new PostException(
        `Cannot create Post: User does not exist with ID ${userId}.`
      );

    const category = await Category.findById(categoryId);
    if (!category)
      throw new PostException(
        `Cannot create Post: Category does not exist with ID ${categoryId}.`
      );

    const connection = await Model.connect();
    const sql = `INSERT INTO post (user_id, category_id, title, type, content) VALUES (?, ?, ?, ?, ?)`;
    let results;

    try {
      [results] = await connection.execute(sql, [
        userId,
        categoryId,
        title,
        type,
        content,
      ]);
    } catch (_) {
    } finally {
      await connection.end();
    }
    if (!results) return null;

    const { insertId, created_at, edited_at, deleted_at } = results;

    return new Post(
      insertId,
      userId,
      categoryId,
      title,
      type,
      content,
      created_at,
      edited_at,
      deleted_at,
      user,
      category
    );
  }

  static async findById(id) {
    if (!id) return null;
    const connection = await Model.connect();
    const sql = `SELECT * FROM post where id = ?`;
    let results;

    try {
      [results] = await connection.execute(sql, [id]);
    } catch (_) {
    } finally {
      await connection.end();
    }

    if (!results.length) return null;

    const {
      user_id,
      category_id,
      title,
      type,
      content,
      created_at,
      edited_at,
      deleted_at,
    } = results[0];

    // check for user and category
    const user = await User.findById(user_id);
    if (!user) return null;

    const category = await Category.findById(category_id);
    if (!category) return null;

    // get votes
    const { up, down } = await Post.getVotes(id);

    return new Post(
      id,
      user_id,
      category_id,
      title,
      type,
      content,
      created_at,
      edited_at,
      deleted_at,
      user,
      category,
      up,
      down
    );
  }

  static async findByCategory(category_id) {
    if (!category_id) return null;

    const connection = await Model.connect();
    const sql = `SELECT * FROM post where category_id = ?`;
    let results;

    try {
      [results] = await connection.execute(sql, [category_id]);
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
        title,
        type,
        content,
        created_at,
        edited_at,
        deleted_at,
      } = results[i];

      // check for user and category
      const user = await User.findById(user_id);
      if (!user) return null;

      const category = await Category.findById(id);
      if (!category) return null;

      const { up, down } = await Post.getVotes(id);

      ret.push(
        new Post(
          id,
          user_id,
          category_id,
          title,
          type,
          content,
          created_at,
          edited_at,
          deleted_at,
          user,
          category,
          up,
          down
        )
      );
    }

    return ret;
  }

  static async findByUser(user_id) {
    if (!user_id) return null;

    const connection = await Model.connect();
    const sql = `SELECT * FROM post where user_id = ?`;
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
        category_id,
        title,
        type,
        content,
        created_at,
        edited_at,
        deleted_at,
      } = results[i];

      // check for user and category
      const user = await User.findById(user_id);
      if (!user) return null;

      const category = await Category.findById(category_id);
      if (!category) return null;

      const { up, down } = await Post.getVotes(id);

      ret.push(
        new Post(
          id,
          user_id,
          category_id,
          title,
          type,
          content,
          created_at,
          edited_at,
          deleted_at,
          user,
          category,
          up,
          down
        )
      );
    }

    return ret;
  }

  async save() {
    // validate
    if (!this.content)
      throw new PostException('Cannot update Post: Missing content.');

    if (this.type === 'URL')
      throw new PostException(
        'Cannot update Post: Only text posts are editable.'
      );

    const connection = await Model.connect();
    const sql = 'UPDATE post SET content=?, edited_at=NOW() where id=?';
    try {
      await connection.execute(sql, [this.content, this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }
    return true;
  }

  async remove() {
    const connection = await Model.connect();
    const sql = 'UPDATE post SET deleted_at=NOW() where id=?';
    try {
      await connection.execute(sql, [this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }
    return true;
  }

  static async getBookmarkedPosts(id) {
    const connection = await Model.connect();
    const sql = 'SELECT * FROM bookmarked_post WHERE user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [id]);
    } catch (_) {
    } finally {
      await connection.end();
    }

    let ret = [];
    for (let i = 0; i < results.length; ++i) {
      const { post_id } = results[i];
      ret.push(await Post.findById(post_id));
    }
    return ret;
  }

  static async isBookmarked(user_id, post_id) {
    const posts = await Post.getBookmarkedPosts(user_id);
    for (let i = 0; i < posts.length; ++i) {
      if (posts[i].id === post_id) return true;
    }
    return false;
  }

  async bookmark(id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM bookmarked_post where post_id=? and user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [this.id, id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    if (results.length)
      throw new PostException(
        'Cannot bookmark Post: Post has already been bookmarked.'
      );

    // add row to table
    connection = await Model.connect();
    sql = 'INSERT INTO bookmarked_post (post_id, user_id) VALUES(?, ?)';

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
    let sql = 'SELECT * FROM bookmarked_post where post_id=? and user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [this.id, id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    if (!results.length)
      throw new PostException(
        'Cannot unbookmark Post: Post has not been bookmarked.'
      );

    // remove row from table
    connection = await Model.connect();
    sql = 'DELETE FROM bookmarked_post where post_id=? and user_id=?';

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
    let sql = 'SELECT * FROM post_vote where post_id=?';

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

  static async getUserVotes(user_id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM post_vote where user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [user_id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    // [ { id: 1, upvotes: 1, downvotes: 1 }, ... etc]
    let posts = [];

    for (let i = 0; i < results.length; ++i) {
      const { post_id } = results[i];
      const post = await Post.findById(post_id);
      posts.push(post);
    }

    return posts;
  }

  async upVote(id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM post_vote where post_id=? and user_id=?';

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
      sql = 'INSERT INTO post_vote (user_id, post_id, type) VALUES(?, ?, ?)';

      try {
        await connection.execute(sql, [id, this.id, 'Up']);
      } catch (_) {
        return false;
      } finally {
        await connection.end();
      }

      return true;
    }

    const { type } = results[0];

    if (type === 'Up')
      throw new PostException(
        'Cannot up vote Post: Post has already been up voted.'
      );

    // update enum
    connection = await Model.connect();
    sql = 'UPDATE post_vote set type=? where user_id=? and post_id=?';

    try {
      await connection.execute(sql, ['Up', id, this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    return true;
  }

  async downVote(id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM post_vote where post_id=? and user_id=?';

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
      sql = 'INSERT INTO post_vote (user_id, post_id, type) VALUES(?, ?, ?)';

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
      throw new PostException(
        'Cannot down vote Post: Post has already been down voted.'
      );

    // update enum
    connection = await Model.connect();
    sql = 'UPDATE post_vote set type=? where user_id=? and post_id=?';

    try {
      await connection.execute(sql, ['Down', id, this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    return true;
  }

  async unvote(id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM post_vote where post_id=? and user_id=?';

    let results;
    try {
      [results] = await connection.execute(sql, [this.id, id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    if (!results.length) {
      throw new PostException(
        'Cannot unvote Post: Post must first be up or down voted.'
      );
    }

    const { type } = results[0];

    connection = await Model.connect();
    sql = 'DELETE FROM post_vote WHERE user_id=? and post_id=?';

    try {
      await connection.execute(sql, [id, this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }

    return true;
  }

  async state(id) {
    let connection = await Model.connect();
    let sql = 'SELECT * FROM post_vote where post_id=? and user_id=?';

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

  getTitle() {
    return this.title;
  }

  setTitle(title) {
    this.title = title;
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

  getCategory() {
    return this.category;
  }
}

module.exports = Post;
