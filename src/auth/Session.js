const Cookie = require('./Cookie');

class Session {
  constructor(id, data = {}) {
    this.id = id;
    this.data = data;
    this.cookie = new Cookie('sessionId', id);
  }

  getId() {
    return this.id;
  }

  get(name) {
    return this.data[name] ?? null;
  }

  set(name, value) {
    this.data[name] = value;
  }

  exists(name) {
    return this.get(name) !== null;
  }

  refresh(time = Cookie.DEFAULT_TIME) {
    this.cookie.setExpires(time);
  }

  destroy() {
    this.data = {};
    this.cookie.setExpires();
  }

  getCookie() {
    return this.cookie;
  }

  isExpired() {
    return this.getCookie().getExpires() <= Date.now();
  }
}

module.exports = Session;
