const Request = require('../../src/router/Request');
const AuthController = require('../../src/controllers/AuthController');
const SessionManager = require('../../src/auth/SessionManager');
const JsonResponse = require('../../src/router/JsonResponse');
const TestHelper = require('../TestHelper');

const sessionManager = new SessionManager();

class ControllerTestHelper extends TestHelper {
	static getSession(sessionId = null) {
		return sessionId ? sessionManager.get(sessionId) : sessionManager.createSession();
	}

	static stopSession() {
		return sessionManager.stopCleanUp();
	}

	static async logIn(email, password, session) {
		const request = new Request('POST', '/auth/login', { email, password });
		const controller = new AuthController(
			request,
			new JsonResponse(),
			session,
		);

		await controller.doAction();
	}
}

module.exports = ControllerTestHelper;
