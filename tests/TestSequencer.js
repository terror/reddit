const Sequencer = require('@jest/test-sequencer').default;
const path = require('path');

class TestSequencer extends Sequencer {
	sort(tests) {
		const orderPath = [
			path.join(__dirname, './models/auth.test.js'),
			path.join(__dirname, './models/user.test.js'),
			path.join(__dirname, './models/category.test.js'),
			path.join(__dirname, './models/post.test.js'),
			path.join(__dirname, './models/comment.test.js'),
			path.join(__dirname, './models/bookmark.test.js'),
			path.join(__dirname, './models/vote.test.js'),
			path.join(__dirname, './controllers/auth.test.js'),
			path.join(__dirname, './controllers/user.test.js'),
			path.join(__dirname, './controllers/category.test.js'),
			path.join(__dirname, './controllers/post.test.js'),
			path.join(__dirname, './controllers/comment.test.js'),
			path.join(__dirname, './controllers/bookmark.test.js'),
			path.join(__dirname, './controllers/vote.test.js'),
			path.join(__dirname, './router/auth.test.js'),
			path.join(__dirname, './router/user.test.js'),
			path.join(__dirname, './router/category.test.js'),
			path.join(__dirname, './router/post.test.js'),
			path.join(__dirname, './router/comment.test.js'),
			path.join(__dirname, './router/bookmark.test.js'),
			path.join(__dirname, './router/vote.test.js'),
			path.join(__dirname, './http/auth.test.js'),
			path.join(__dirname, './http/user.test.js'),
			path.join(__dirname, './http/category.test.js'),
			path.join(__dirname, './http/post.test.js'),
			path.join(__dirname, './http/comment.test.js'),
			path.join(__dirname, './http/bookmark.test.js'),
			path.join(__dirname, './http/vote.test.js'),
			path.join(__dirname, './browser/auth.test.js'),
			path.join(__dirname, './browser/user.test.js'),
			path.join(__dirname, './browser/category.test.js'),
			path.join(__dirname, './browser/post.test.js'),
			path.join(__dirname, './browser/comment.test.js'),
			path.join(__dirname, './browser/bookmark.test.js'),
			path.join(__dirname, './browser/vote.test.js'),
		];

		return tests.sort((testA, testB) => {
			const indexA = orderPath.indexOf(testA.path);
			const indexB = orderPath.indexOf(testB.path);

			if (indexA === indexB) return 0; // do not swap when tests both not specify in order.

			if (indexA === -1) return 1;
			if (indexB === -1) return -1;

			return indexA < indexB ? -1 : 1;
		});
	}
}

module.exports = TestSequencer;
