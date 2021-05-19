const Model = require('./Model');
const UserException = require('./../exceptions/UserException');
const AuthException = require('../exceptions/AuthException');

class User extends Model {
  constructor(
    id,
    username,
    email,
    password,
    avatar = null,
    createdAt = null,
    editedAt = null,
    deletedAt = null
  ) {
    super(id);
    this.username = username;
    this.email = email;
    this.password = password;
    this.avatar = avatar;
    this.createdAt = createdAt;
    this.editedAt = editedAt;
    this.deletedAt = deletedAt;
  }

  static async logIn(email, password) {
    if (!email) throw new AuthException('Cannot log in: Missing email.');
    if (!password) throw new AuthException('Cannot log in: Missing password.');

    // grab user
    const user = await User.findByEmail(email);

    if (!user || user.password != password) return null;

    // check if deleted
    if (user.deletedAt)
      throw new AuthException('Cannot log in: User has been deleted.');

    return user;
  }

  static async create(username, email, password) {
    // validate
    if (!username)
      throw new UserException('Cannot create User: Missing username.');

    if (!email) throw new UserException('Cannot create User: Missing email.');

    if (!password)
      throw new UserException('Cannot create User: Missing password.');

    const connection = await Model.connect();
    const sql = `INSERT INTO user (username, email, password) VALUES (?, ?, ?)`;
    let results;

    try {
      [results] = await connection.execute(sql, [username, email, password]);
    } catch (e) {
      let msg;
      if (e.message.includes('email')) msg = 'Duplicate email.';
      else msg = 'Duplicate username.';
      throw new UserException('Cannot create User: ' + msg);
    } finally {
      await connection.end();
    }
    if (!results) return null;

    const { insertId, avatar, created_at, edited_at, deleted_at } = results;

    return new User(
      insertId,
      username,
      email,
      password,
      avatar,
      created_at,
      edited_at,
      deleted_at
    );
  }

  static async findById(id) {
    const connection = await Model.connect();
    const sql = `SELECT * FROM user where id = ?`;
    let results;

    try {
      [results] = await connection.execute(sql, [id]);
    } catch (_) {
    } finally {
      await connection.end();
    }

    if (!results.length) return null;

    const {
      username,
      email,
      password,
      avatar,
      created_at,
      edited_at,
      deleted_at,
    } = results[0];

    return new User(
      id,
      username,
      email,
      password,
      avatar,
      created_at,
      edited_at,
      deleted_at
    );
  }

  static async findAll() {
    const connection = await Model.connect();
    const sql = 'SELECT * FROM user';
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
        username,
        email,
        password,
        avatar,
        created_at,
        edited_at,
        deleted_at,
      } = results[i];
      ret.push(
        new User(
          id,
          username,
          email,
          password,
          avatar,
          created_at,
          edited_at,
          deleted_at
        )
      );
    }
    return ret;
  }

  static async findByEmail(userEmail) {
    const connection = await Model.connect();
    const sql = `SELECT * FROM \`user\` WHERE \`email\` = ?`;
    let results;

    try {
      [results] = await connection.execute(sql, [userEmail]);
    } catch (_) {
    } finally {
      await connection.end();
    }

    if (!results.length) return null;

    const {
      id,
      username,
      email,
      password,
      avatar,
      created_at,
      edited_at,
      deleted_at,
    } = results[0];

    return new User(
      id,
      username,
      email,
      password,
      avatar,
      created_at,
      edited_at,
      deleted_at
    );
  }

  static async findByUsername(username) {
    const connection = await Model.connect();
    const sql = `SELECT * FROM \`user\` WHERE \`username\` = ?`;
    let results;

    try {
      [results] = await connection.execute(sql, [username]);
    } catch (_) {
    } finally {
      await connection.end();
    }

    if (!results.length) return null;

    const {
      id,
      email,
      password,
      avatar,
      created_at,
      edited_at,
      deleted_at,
    } = results[0];

    return new User(
      id,
      username,
      email,
      password,
      avatar,
      created_at,
      edited_at,
      deleted_at
    );
  }

  async save() {
    // validate
    if (!this.username)
      throw new UserException('Cannot update User: Missing username.');

    if (!this.email)
      throw new UserException('Cannot update User: Missing email.');

    const connection = await Model.connect();
    const sql =
      'UPDATE user SET username=?, email=?, password=?, avatar=?, edited_at=NOW() where id=?';
    try {
      await connection.execute(sql, [
        this.username,
        this.email,
        this.password,
        this.avatar,
        this.id,
      ]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }
    return true;
  }

  async remove() {
    const connection = await Model.connect();
    const sql = 'UPDATE user SET deleted_at=NOW() where id=?';
    try {
      await connection.execute(sql, [this.id]);
    } catch (_) {
      return false;
    } finally {
      await connection.end();
    }
    return true;
  }

  getUsername() {
    return this.username;
  }

  setUsername(u) {
    this.username = u;
  }

  setEmail(e) {
    this.email = e;
  }

  setPassword(p) {
    this.password = p;
  }

  getEmail() {
    return this.email;
  }

  getAvatar() {
    return this.avatar;
  }

  setAvatar(a) {
    this.avatar = a;
  }
}

module.exports = User;
