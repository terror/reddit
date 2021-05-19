const HttpStatusCode = require('../helpers/HttpStatusCode');
const Response = require('./Response');

class JsonResponse extends Response {
	constructor(statusCode, message = '', payload = {}) {
		super(statusCode);

		this.message = message;
		this.payload = payload;

		this.addHeader('Content-Type', 'application/json');
	}

	setResponse(responseParameters) {
		this.statusCode = responseParameters.statusCode ?? HttpStatusCode.OK;
		this.message = responseParameters.message ?? '';
		this.payload = responseParameters.payload ?? {};

		return this;
	}

	getStatusCode() {
		return this.statusCode;
	}

	getMessage() {
		return this.message;
	}

	getPayload() {
		return this.payload;
	}

	toString() {
		return JSON.stringify({
			statusCode: this.statusCode,
			message: this.message,
			payload: this.payload,
		});
	}
}

module.exports = JsonResponse;
