const Post = require('../../src/models/Post');
const Comment = require('../../src/models/Comment');
const {
	generateUser,
	generatePost,
	generateComment,
	truncateDatabase,
} = require('../TestHelper');

beforeEach(async () => {
	await truncateDatabase();
});

test('Post was bookmarked successfully.', async () => {
	const user = await generateUser();
	const post = await generatePost();

	expect((await Post.getBookmarkedPosts(user.getId())).length).toBe(0);
	expect(await post.bookmark(user.getId())).toBe(true);

	const bookmarkedPosts = await Post.getBookmarkedPosts(user.getId());

	expect(bookmarkedPosts.length).toBe(1);
	expect(bookmarkedPosts[0].getId()).toBe(post.getId());
});

test('Post was unbookmarked successfully.', async () => {
	const user = await generateUser();
	const post = await generatePost();

	expect(await post.bookmark(user.getId())).toBe(true);

	let bookmarkedPosts = await Post.getBookmarkedPosts(user.getId());

	expect(bookmarkedPosts.length).toBe(1);
	expect(await post.unbookmark(user.getId())).toBe(true);

	bookmarkedPosts = await Post.getBookmarkedPosts(user.getId());

	expect((await Post.getBookmarkedPosts(user.getId())).length).toBe(0);
});

test('Post was bookmarked by multiple users.', async () => {
	const numberOfUsers = Math.floor(Math.random() * 20) + 5;
	const post = await generatePost();
	const users = [];
	const postIsBookmarked = [];

	for (let i = 0; i < numberOfUsers; i++) {
		const user = await generateUser();

		users.push(user);
		postIsBookmarked[i] = false;

		if (Math.random() < 0.5) {
			await post.bookmark(user.getId());
			postIsBookmarked[i] = true;

			if (Math.random() < 0.25) {
				await post.unbookmark(user.getId());
				postIsBookmarked[i] = false;
			}
		}
	}

	for (let i = 0; i < numberOfUsers; i++) {
		const bookmarkedPosts = await Post.getBookmarkedPosts(users[i].getId());

		if (postIsBookmarked[i]) {
			expect(bookmarkedPosts.length).toBe(1);
			expect(bookmarkedPosts[0].getId()).toBe(post.getId());
		}
		else {
			expect(bookmarkedPosts.length).toBe(0);
		}
	}
});

test('Post was not bookmarked twice by the same user.', async () => {
	const user = await generateUser();
	const post = await generatePost();

	await post.bookmark(user.getId());

	await expect(post.bookmark(user.getId())).rejects.toMatchObject({
		name: 'PostException',
		message: 'Cannot bookmark Post: Post has already been bookmarked.',
	});
});

test('Post was not unbookmarked twice by the same user.', async () => {
	const user = await generateUser();
	const post = await generatePost();

	await post.bookmark(user.getId());
	await post.unbookmark(user.getId());

	await expect(post.unbookmark(user.getId())).rejects.toMatchObject({
		name: 'PostException',
		message: 'Cannot unbookmark Post: Post has not been bookmarked.',
	});
});

test('Post was not unbookmarked before being bookmarked.', async () => {
	const user = await generateUser();
	const post = await generatePost();

	await expect(post.unbookmark(user.getId())).rejects.toMatchObject({
		name: 'PostException',
		message: 'Cannot unbookmark Post: Post has not been bookmarked.',
	});
});

test('Comment was bookmarked successfully.', async () => {
	const user = await generateUser();
	const comment = await generateComment();

	expect((await Comment.getBookmarkedComments(user.getId())).length).toBe(0);
	expect(await comment.bookmark(user.getId())).toBe(true);

	const bookmarkedComments = await Comment.getBookmarkedComments(user.getId());

	expect(bookmarkedComments.length).toBe(1);
	expect(bookmarkedComments[0].getId()).toBe(comment.getId());
});

test('Comment was unbookmarked successfully.', async () => {
	const user = await generateUser();
	const comment = await generateComment();

	expect(await comment.bookmark(user.getId())).toBe(true);

	let bookmarkedComments = await Comment.getBookmarkedComments(user.getId());

	expect(bookmarkedComments.length).toBe(1);
	expect(await comment.unbookmark(user.getId())).toBe(true);

	bookmarkedComments = await Comment.getBookmarkedComments(user.getId());

	expect((await Comment.getBookmarkedComments(user.getId())).length).toBe(0);
});

test('Comment was bookmarked by multiple users.', async () => {
	const numberOfUsers = Math.floor(Math.random() * 20) + 5;
	const comment = await generateComment();
	const users = [];
	const commentIsBookmarked = [];

	for (let i = 0; i < numberOfUsers; i++) {
		const user = await generateUser();

		users.push(user);
		commentIsBookmarked[i] = false;

		if (Math.random() < 0.5) {
			await comment.bookmark(user.getId());
			commentIsBookmarked[i] = true;

			if (Math.random() < 0.25) {
				await comment.unbookmark(user.getId());
				commentIsBookmarked[i] = false;
			}
		}
	}

	for (let i = 0; i < numberOfUsers; i++) {
		const bookmarkedComments = await Comment.getBookmarkedComments(users[i].getId());

		if (commentIsBookmarked[i]) {
			expect(bookmarkedComments.length).toBe(1);
			expect(bookmarkedComments[0].getId()).toBe(comment.getId());
		}
		else {
			expect(bookmarkedComments.length).toBe(0);
		}
	}
});

test('Comment was not bookmarked twice by the same user.', async () => {
	const user = await generateUser();
	const comment = await generateComment();

	await comment.bookmark(user.getId());

	await expect(comment.bookmark(user.getId())).rejects.toMatchObject({
		name: 'CommentException',
		message: 'Cannot bookmark Comment: Comment has already been bookmarked.',
	});
});

test('Comment was not unbookmarked twice by the same user.', async () => {
	const user = await generateUser();
	const comment = await generateComment();

	await comment.bookmark(user.getId());
	await comment.unbookmark(user.getId());

	await expect(comment.unbookmark(user.getId())).rejects.toMatchObject({
		name: 'CommentException',
		message: 'Cannot unbookmark Comment: Comment has not been bookmarked.',
	});
});

test('Comment was not unbookmarked before being bookmarked.', async () => {
	const user = await generateUser();
	const comment = await generateComment();

	await expect(comment.unbookmark(user.getId())).rejects.toMatchObject({
		name: 'CommentException',
		message: 'Cannot unbookmark Comment: Comment has not been bookmarked.',
	});
});

afterAll(async () => {
	await truncateDatabase();
});
