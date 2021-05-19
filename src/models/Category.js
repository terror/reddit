const Model = require('./Model');
const User = require('./User');
const CategoryException = require('../exceptions/CategoryException');

class Category extends Model {
  constructor(
    id,
    createdBy,
    title,
    description,
    createdAt = null,
    editedAt = null,
    deletedAt = null,
    user = null
  ) {
    super(id);
    this.createdBy = createdBy;
    this.title = title;
    this.description = description;
    this.createdAt = createdAt;
    this.editedAt = editedAt;
    this.deletedAt = deletedAt;
    this.user = user;
  }

  static async create(id, title, description) {
    // validate
    if (!title)
      throw new CategoryException('Cannot create Category: Missing title.');

    if (!id)
      throw new CategoryException('Cannot create Category: Missing userId.');

    if (!description)
      throw new CategoryException(
        'Cannot create Category: Missing description.'
      );

    // check for existing user
    const user = await User.findById(id);
    if (!user)
      throw new CategoryException(
        `Cannot create Category: User does not exist with ID ${id}.`
      );

    // check for duplicate title
    if ((await Category.findByTitle(title)) !== null)
      throw new CategoryException('Cannot create Category: Duplicate title.');

    const connection = await Model.connect();
    const sql = `INSERT INTO category (user_id, title, description) VALUES (?, ?, ?)`;
    let results;

    try {
      [results] = await connection.execute(sql, [id, title, description]);
    } catch (e) {
      throw new CategoryException(e.message);
    } finally {
      await connection.end();
    }
    if (!results) return null;

    const { insertId, created_at, edited_at, deleted_at } = results;

    return new Category(
      insertId,
      id,
      title,
      description,
      created_at,
      edited_at,
      deleted_at,
      user
    );
  }

  static async findById(id) {
    const connection = await Model.connect();
    const sql = `SELECT * FROM category where id = ?`;
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
      title,
      description,
      created_at,
      edited_at,
      deleted_at,
    } = results[0];

    const user = await User.findById(user_id);

    return new Category(
      id,
      user_id,
      title,
      description,
      created_at,
      edited_at,
      deleted_at,
      user
    );
  }

  static async findByTitle(title) {
    const connection = await Model.connect();
    const sql = `SELECT * FROM category where title = ?`;
    let results;

    try {
      [results] = await connection.execute(sql, [title]);
    } catch (_) {
    } finally {
      await connection.end();
    }

    if (!results.length) return null;

    const {
      id,
      user_id,
      description,
      created_at,
      edited_at,
      deleted_at,
    } = results[0];

    const user = await User.findById(user_id);

    return new Category(
      id,
      user_id,
      title,
      description,
      created_at,
      edited_at,
      deleted_at,
      user
    );
  }

  static async findAll() {
    const connection = await Model.connect();
    const sql = 'SELECT * FROM category';
    let results;

    try {
      [results] = await connection.execute(sql);
    } catch (_) {
    } finally {
      await connection.end();
    }

    if (!results.length) return [];

    let ret = [];
    for (let i = 0; i < results.length; ++i) {
      const {
        id,
        user_id,
        title,
        description,
        created_at,
        edited_at,
        deleted_at,
      } = results[i];

      const user = await User.findById(user_id);

      ret.push(
        new Category(
          id,
          user_id,
          title,
          description,
          created_at,
          edited_at,
          deleted_at,
          user
        )
      );
    }
    return ret;
  }

  async save() {
    // validate
    if (!this.title)
      throw new CategoryException('Cannot update Category: Missing title.');

    const connection = await Model.connect();
    const sql =
      'UPDATE category SET title=?, description=?, edited_at=NOW() where id=?';
    try {
      await connection.execute(sql, [this.title, this.description, this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }
    return true;
  }

  async remove() {
    const connection = await Model.connect();
    const sql = 'UPDATE category SET deleted_at=NOW() where id=?';
    try {
      await connection.execute(sql, [this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }
    return true;
  }

  getTitle() {
    return this.title;
  }

  setTitle(t) {
    this.title = t;
  }

  getDescription() {
    return this.description;
  }

  setDescription(d) {
    this.description = d;
  }

  getUser() {
    return this.user;
  }
}

module.exports = Category;
