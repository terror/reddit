const Request = require('../../src/router/Request');
const Router = require('../../src/router/Router');
const JsonResponse = require('../../src/router/JsonResponse');
const SessionManager = require('../../src/auth/SessionManager');
const TestHelper = require('../TestHelper');

const sessionManager = new SessionManager();

class RouterTestHelper extends TestHelper {
	static getSession(sessionId = null) {
		return sessionId ? sessionManager.get(sessionId) : sessionManager.createSession();
	}

	static stopSession() {
		return sessionManager.stopCleanUp();
	}

	static async logIn(email, password, session) {
		const request = new Request('POST', '/auth/login', { email, password });
		const router = new Router(request, new JsonResponse(), session);

		await router.dispatch();
	}
}

module.exports = RouterTestHelper;
