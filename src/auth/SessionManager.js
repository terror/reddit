const crypto = require('crypto');
const Session = require('./Session');

class SessionManager {
	constructor() {
		this.sessions = [];
		this.cleanUp = setInterval(this.cleanUpSessions, 1000);
	}

	stopCleanUp() {
		process.nextTick(clearInterval, this.cleanUp);
	}

	getSession(httpRequest) {
		let session;
		const cookies = SessionManager.getCookies(httpRequest);

		if (cookies.sessionId) {
			session = this.get(cookies.sessionId);
		}

		if (session) {
			session.refresh();
		}
		else {
			session = this.createSession();
		}

		return session;
	}

	get(sessionId) {
		return this.sessions.find((session) => session.getId() === sessionId);
	}

	cleanUpSessions() {
		this.sessions = this.sessions?.filter((session) => !session.isExpired());
	}

	createSession() {
		const sessionId = crypto.randomBytes(2).toString('hex');
		const session = new Session(sessionId);

		this.sessions.push(session);

		return session;
	}

	static getCookies(httpRequest) {
		if (!httpRequest.headers.cookie) {
			return {};
		}

		return httpRequest.headers.cookie.split('; ').reduce((accumulator, parameter) => {
			const [key, value] = parameter.split('=');
			accumulator[key] = value;
			return accumulator;
		}, {});
	}
}

module.exports = SessionManager;
