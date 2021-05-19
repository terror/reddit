const Database = require('../database/Database');

class Model {
  constructor(id) {
    this.id = id;
  }

  static connect() {
    return Database.connect();
  }

  getId() {
    return this.id;
  }

  getCreatedAt() {
    return this.createdAt;
  }

  getEditedAt() {
    return this.editedAt;
  }

  getDeletedAt() {
    return this.deletedAt;
  }

  setId(id) {
    this.id = id;
    return this;
  }

  setCreatedAt(createdAt) {
    this.createdAt = createdAt;
    return this;
  }

  setEditedAt(editedAt) {
    this.editedAt = editedAt;
    return this;
  }

  setDeletedAt(deletedAt) {
    this.deletedAt = deletedAt;
    return this;
  }
}

module.exports = Model;
