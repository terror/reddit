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

test('Post was upvoted successfully.', async () => {
	const user = await generateUser();
	let post = await generatePost();

	expect(await post.upVote(user.getId())).toBe(true);

	post = await Post.findById(post.getId());

	expect(post.getUpvotes()).toBe(1);
	expect(post.getDownvotes()).toBe(0);
});

test('Post was downvoted successfully.', async () => {
	const user = await generateUser();
	let post = await generatePost();

	expect(await post.downVote(user.getId())).toBe(true);

	post = await Post.findById(post.getId());

	expect(post.getUpvotes()).toBe(0);
	expect(post.getDownvotes()).toBe(1);
});

test('Post was upvoted then downvoted.', async () => {
	const user = await generateUser();
	let post = await generatePost();

	expect(await post.upVote(user.getId())).toBe(true);

	post = await Post.findById(post.getId());

	expect(post.getUpvotes()).toBe(1);
	expect(post.getDownvotes()).toBe(0);

	expect(await post.downVote(user.getId())).toBe(true);

	post = await Post.findById(post.getId());

	expect(post.getUpvotes()).toBe(0);
	expect(post.getDownvotes()).toBe(1);
});

test('Post was downvoted then upvoted.', async () => {
	const user = await generateUser();
	let post = await generatePost();

	expect(await post.downVote(user.getId())).toBe(true);

	post = await Post.findById(post.getId());

	expect(post.getUpvotes()).toBe(0);
	expect(post.getDownvotes()).toBe(1);

	expect(await post.upVote(user.getId())).toBe(true);

	post = await Post.findById(post.getId());

	expect(post.getUpvotes()).toBe(1);
	expect(post.getDownvotes()).toBe(0);
});

test('Post was upvoted then unvoted.', async () => {
	const user = await generateUser();
	let post = await generatePost();

	expect(await post.upVote(user.getId())).toBe(true);

	post = await Post.findById(post.getId());

	expect(post.getUpvotes()).toBe(1);
	expect(post.getDownvotes()).toBe(0);

	expect(await post.unvote(user.getId())).toBe(true);

	post = await Post.findById(post.getId());

	expect(post.getUpvotes()).toBe(0);
	expect(post.getDownvotes()).toBe(0);
});

test('Post was downvoted then unvoted.', async () => {
	const user = await generateUser();
	let post = await generatePost();

	expect(await post.downVote(user.getId())).toBe(true);

	post = await Post.findById(post.getId());

	expect(post.getUpvotes()).toBe(0);
	expect(post.getDownvotes()).toBe(1);

	expect(await post.unvote(user.getId())).toBe(true);

	post = await Post.findById(post.getId());

	expect(post.getUpvotes()).toBe(0);
	expect(post.getDownvotes()).toBe(0);
});

test('Post was voted on by multiple users.', async () => {
	const numberOfUsers = Math.floor(Math.random() * 20) + 5;
	let post = await generatePost();
	let upvotes = 0;
	let downvotes = 0;

	for (let i = 0; i < numberOfUsers; i++) {
		const user = await generateUser();

		if (Math.random() < 0.5) {
			await post.upVote(user.getId());
			upvotes++;

			if (Math.random() < 0.25) {
				await post.unvote(user.getId());
				upvotes--;
			}
		}
		else {
			await post.downVote(user.getId());
			downvotes++;

			if (Math.random() < 0.25) {
				await post.unvote(user.getId());
				downvotes--;
			}
		}
	}

	post = await Post.findById(post.getId());

	expect(post.getUpvotes()).toBe(upvotes);
	expect(post.getDownvotes()).toBe(downvotes);
});

test('Post was not up voted twice by the same user.', async () => {
	const user = await generateUser();
	const post = await generatePost();

	await post.upVote(user.getId());

	await expect(post.upVote(user.getId())).rejects.toMatchObject({
		name: 'PostException',
		message: 'Cannot up vote Post: Post has already been up voted.',
	});
});

test('Post was not down voted twice by the same user.', async () => {
	const user = await generateUser();
	const post = await generatePost();

	await post.downVote(user.getId());

	await expect(post.downVote(user.getId())).rejects.toMatchObject({
		name: 'PostException',
		message: 'Cannot down vote Post: Post has already been down voted.',
	});
});

test('Post was not unvoted twice by the same user.', async () => {
	const user = await generateUser();
	const post = await generatePost();

	await post.downVote(user.getId());
	await post.unvote(user.getId());

	await expect(post.unvote(user.getId())).rejects.toMatchObject({
		name: 'PostException',
		message: 'Cannot unvote Post: Post must first be up or down voted.',
	});
});

test('Post was not unvoted before being voted on.', async () => {
	const user = await generateUser();
	const post = await generatePost();

	await expect(post.unvote(user.getId())).rejects.toMatchObject({
		name: 'PostException',
		message: 'Cannot unvote Post: Post must first be up or down voted.',
	});
});

test('Comment was upvoted successfully.', async () => {
	const user = await generateUser();
	let comment = await generateComment();

	expect(await comment.upVote(user.getId())).toBe(true);

	comment = await Comment.findById(comment.getId());

	expect(comment.getUpvotes()).toBe(1);
	expect(comment.getDownvotes()).toBe(0);
});

test('Comment was downvoted successfully.', async () => {
	const user = await generateUser();
	let comment = await generateComment();

	expect(await comment.downVote(user.getId())).toBe(true);

	comment = await Comment.findById(comment.getId());

	expect(comment.getUpvotes()).toBe(0);
	expect(comment.getDownvotes()).toBe(1);
});

test('Comment was upvoted then downvoted.', async () => {
	const user = await generateUser();
	let comment = await generateComment();

	expect(await comment.upVote(user.getId())).toBe(true);

	comment = await Comment.findById(comment.getId());

	expect(comment.getUpvotes()).toBe(1);
	expect(comment.getDownvotes()).toBe(0);

	expect(await comment.downVote(user.getId())).toBe(true);

	comment = await Comment.findById(comment.getId());

	expect(comment.getUpvotes()).toBe(0);
	expect(comment.getDownvotes()).toBe(1);
});

test('Comment was downvoted then upvoted.', async () => {
	const user = await generateUser();
	let comment = await generateComment();

	expect(await comment.downVote(user.getId())).toBe(true);

	comment = await Comment.findById(comment.getId());

	expect(comment.getUpvotes()).toBe(0);
	expect(comment.getDownvotes()).toBe(1);

	expect(await comment.upVote(user.getId())).toBe(true);

	comment = await Comment.findById(comment.getId());

	expect(comment.getUpvotes()).toBe(1);
	expect(comment.getDownvotes()).toBe(0);
});

test('Comment was upvoted then unvoted.', async () => {
	const user = await generateUser();
	let comment = await generateComment();

	expect(await comment.upVote(user.getId())).toBe(true);

	comment = await Comment.findById(comment.getId());

	expect(comment.getUpvotes()).toBe(1);
	expect(comment.getDownvotes()).toBe(0);

	expect(await comment.unvote(user.getId())).toBe(true);

	comment = await Comment.findById(comment.getId());

	expect(comment.getUpvotes()).toBe(0);
	expect(comment.getDownvotes()).toBe(0);
});

test('Comment was downvoted then unvoted.', async () => {
	const user = await generateUser();
	let comment = await generateComment();

	expect(await comment.downVote(user.getId())).toBe(true);

	comment = await Comment.findById(comment.getId());

	expect(comment.getUpvotes()).toBe(0);
	expect(comment.getDownvotes()).toBe(1);

	expect(await comment.unvote(user.getId())).toBe(true);

	comment = await Comment.findById(comment.getId());

	expect(comment.getUpvotes()).toBe(0);
	expect(comment.getDownvotes()).toBe(0);
});

test('Comment was voted on by multiple users.', async () => {
	const numberOfUsers = Math.floor(Math.random() * 20) + 5;
	let comment = await generateComment();
	let upvotes = 0;
	let downvotes = 0;

	for (let i = 0; i < numberOfUsers; i++) {
		const user = await generateUser();

		if (Math.random() < 0.5) {
			await comment.upVote(user.getId());
			upvotes++;

			if (Math.random() < 0.25) {
				await comment.unvote(user.getId());
				upvotes--;
			}
		}
		else {
			await comment.downVote(user.getId());
			downvotes++;

			if (Math.random() < 0.25) {
				await comment.unvote(user.getId());
				downvotes--;
			}
		}
	}

	comment = await Comment.findById(comment.getId());

	expect(comment.getUpvotes()).toBe(upvotes);
	expect(comment.getDownvotes()).toBe(downvotes);
});

test('Comment was not up voted twice by the same user.', async () => {
	const user = await generateUser();
	const comment = await generateComment();

	await comment.upVote(user.getId());

	await expect(comment.upVote(user.getId())).rejects.toMatchObject({
		name: 'CommentException',
		message: 'Cannot up vote Comment: Comment has already been up voted.',
	});
});

test('Comment was not down voted twice by the same user.', async () => {
	const user = await generateUser();
	const comment = await generateComment();

	await comment.downVote(user.getId());

	await expect(comment.downVote(user.getId())).rejects.toMatchObject({
		name: 'CommentException',
		message: 'Cannot down vote Comment: Comment has already been down voted.',
	});
});

test('Comment was not unvoted twice by the same user.', async () => {
	const user = await generateUser();
	const comment = await generateComment();

	await comment.downVote(user.getId());
	await comment.unvote(user.getId());

	await expect(comment.unvote(user.getId())).rejects.toMatchObject({
		name: 'CommentException',
		message: 'Cannot unvote Comment: Comment must first be up or down voted.',
	});
});

test('Comment was not unvoted before being voted on.', async () => {
	const user = await generateUser();
	const comment = await generateComment();

	await expect(comment.unvote(user.getId())).rejects.toMatchObject({
		name: 'CommentException',
		message: 'Cannot unvote Comment: Comment must first be up or down voted.',
	});
});

afterAll(async () => {
	await truncateDatabase();
});
