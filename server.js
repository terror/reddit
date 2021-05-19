const { parse } = require('querystring');
const http = require('http');
const fs = require('fs');
const App = require('./src/App');
const SessionManager = require('./src/auth/SessionManager');

const sessionManager = new SessionManager();

/**
 * If the request is a POST or a PUT, that means the client
 * wants to send some data to the server. This data is found
 * in the request body. This function will extract the data
 * from the request body, provided that the data is either in
 * x-www-form-urlencoded format or JSON format.
 * @param {Object} httpRequest
 * @returns {Object} The parsed HTTP request body.
 */
const getRequestBody = async (httpRequest) => new Promise((resolve, reject) => {
	const chunks = [];

	httpRequest.on('data', (chunk) => chunks.push(chunk));
	httpRequest.on('error', (err) => reject(err));
	httpRequest.on('end', () => {
		const contentType = httpRequest.headers['content-type'];
		const body = chunks.join('');
		let result;

		switch (contentType) {
			case 'application/x-www-form-urlencoded':
				result = parse(body);
				break;
			case 'application/json':
				result = JSON.parse(body);
				break;
			default:
				result = '';
		}

		resolve(result);
	});
});

/**
 * A static file is a file that the client requests for
 * directly. This is anything with a valid file extension.
 * Within the context of the web, this is usually .html,
 * .css, .js, and any image/video/audio file types.
 * @param {string} url
 * @param {Object} response
 */
const serveStaticFile = (url, response) => {
	/**
	 * The browser automatically requests for favicon.ico which is
	 * the little icon that appears in the in the browser tab. For
	 * now we can ignore this.
	 */
	if (url.match(/.*favicon\.ico/)) {
		return response.end();
	}

	const filePath = `.${url}`;

	fs.readFile(filePath, (error, content) => {
		if (error) {
			response.writeHead(500);
			return response.end(`${error}`);
		}

		return response.end(content, 'utf-8');
	});
};

/**
 * Create an HTTP server, and whenever a request is made,
 * instantiate a new App object. The App object will take care
 * of handling the request, performing the correct CRUD operation
 * and sending the response back to the client.
 * @param {Object} request
 * @param {Object} response
 */
const server = http.createServer(async (request, response) => {
	if (request.url.match(/.*\..*/)) {
		return serveStaticFile(request.url, response);
	}

	request.body = await getRequestBody(request);

	const session = sessionManager.getSession(request);
	const app = new App(request, response, session);
	await app.handleRequest();
	await app.sendResponse();
});

/**
 * If there is a problem with the request, send back an error.
 */
server.on('clientError', (err, socket) => {
	socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

/**
 * Start the HTTP server and listen for requests on port 8000.
 */
server.listen(8000, () => {
	console.log('Listening on port 8000...');
});
