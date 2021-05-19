const http = require('http');
const TestHelper = require('../TestHelper');

let cookieJar = {};

class HttpTestHelper extends TestHelper {
	static async makeHttpRequest(method, path, data = {}, accept = 'application/json') {
		const options = {
			host: 'localhost',
			port: 8000,
			path,
			method,
			headers: {
				'Content-Type': 'application/json',
				Accept: accept,
				'Content-Length': Buffer.byteLength(JSON.stringify(data)),
				Cookie: HttpTestHelper.getCookieJar(),
			},
		};

		return new Promise((resolve, reject) => {
			let body = '';
			const request = http.request(options, (response) => {
				response.on('data', (chunk) => {
					body += chunk;
				});
				response.on('end', () => resolve([response.statusCode, JSON.parse(body)]));
				HttpTestHelper.setCookieJar(response);
			});

			request.on('error', (err) => reject(err));
			request.write(JSON.stringify(data));
			request.end();
		});
	}

	static getCookie(name) {
		return cookieJar[name] ?? null;
	}

	static getCookieJar() {
		return JSON.stringify(cookieJar)
			.slice(1, -1)
			.replace(/,/g, '; ')
			.replace(/:/g, '=')
			.replace(/["]/g, '');
	}

	static setCookieJar(response) {
		cookieJar = response.headers['set-cookie'].reduce((accumulator, cookie) => {
			const [key, value] = cookie.split('=');
			[accumulator[key]] = value.split(';');
			return accumulator;
		}, {});
	}

	static clearCookieJar() {
		cookieJar = {};
	}

	static async logIn(email, password) {
		await HttpTestHelper.makeHttpRequest('POST', '/auth/login', { email, password });
	}
}

module.exports = HttpTestHelper;
