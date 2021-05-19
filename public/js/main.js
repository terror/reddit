const BASE_URL = 'http://localhost:8000';

const makeRequest = async (url, data) => {
  return fetch(url, data).then((response) => response.json());
};

// Elements

const postBookmarkButton = document.getElementById('post-bookmark-button');
const showUserPostBookMarksButton = document.getElementById(
  'show-user-post-bookmarks-button'
);
const commentBookmarkButton = document.getElementsByClassName(
  'comment-bookmark-button'
);
const showUserCommentBookMarksButton = document.getElementById(
  'show-user-comment-bookmarks-button'
);
const postVotesDivs = document.getElementsByClassName('post-votes');
const postUpvoteButtons = document.getElementsByClassName('post-upvote-button');
const postDownvoteButtons = document.getElementsByClassName(
  'post-downvote-button'
);
const postUnvoteButtons = document.getElementsByClassName('post-unvote-button');
const showUserPostVotesButton = document.getElementById(
  'show-user-post-votes-button'
);
const commentVotesDivs = document.getElementsByClassName('comment-votes');
const commentUpvoteButtons = document.getElementsByClassName(
  'comment-upvote-button'
);
const commentDownvoteButtons = document.getElementsByClassName(
  'comment-downvote-button'
);
const commentUnvoteButtons = document.getElementsByClassName(
  'comment-unvote-button'
);
const showUserCommentVotesButton = document.getElementById(
  'show-user-comment-votes-button'
);
const showUserPostsButton = document.getElementById('show-user-posts-button');
const showUserCommentsButton = document.getElementById(
  'show-user-comments-button'
);

// Functions

const bookmarkPost = async (post_id) => {
  if (postBookmarkButton.innerText === 'Unbookmark Post') {
    postBookmarkButton.innerText = 'Bookmark Post';
    await makeRequest(`${BASE_URL}/post/${post_id}/unbookmark`, {
      method: 'GET',
    });
  } else {
    postBookmarkButton.innerText = 'Unbookmark Post';
    await makeRequest(`${BASE_URL}/post/${post_id}/bookmark`, {
      method: 'GET',
    });
  }
};

const bookmarkComment = async (button) => {
  if (button.innerText === 'Unbookmark Comment') {
    button.innerText = 'Bookmark Comment';
    await makeRequest(`${BASE_URL}/comment/${button.value}/unbookmark`, {
      method: 'GET',
    });
  } else {
    button.innerText = 'Unbookmark Comment';
    await makeRequest(`${BASE_URL}/comment/${button.value}/bookmark`, {
      method: 'GET',
    });
  }
};

const upvotePost = async (up, down) => {
  const post_id = up.getAttribute('post-id');
  const state = up.value;
  const votes = document.querySelector(`div[post-id="${post_id}"]`);

  if (state && state === 'Up') {
    try {
      await makeRequest(`${BASE_URL}/post/${post_id}/unvote`, {});
    } catch (e) {
      return;
    } finally {
      votes.innerText = parseInt(votes.innerText) - 1;
      up.value = null;
      down.value = null;
    }
    return;
  }

  try {
    await makeRequest(`${BASE_URL}/post/${post_id}/upvote`, {});
  } catch (e) {
    return;
  } finally {
    if (state && state === 'Down')
      votes.innerText = parseInt(votes.innerText) + 2;
    else votes.innerText = parseInt(votes.innerText) + 1;
    up.value = 'Up';
    down.value = 'Up';
  }
};

const downvotePost = async (up, down) => {
  const post_id = down.getAttribute('post-id');
  const state = down.value;
  const votes = document.querySelector(`div[post-id="${post_id}"]`);

  if (state && state === 'Down') {
    try {
      await makeRequest(`${BASE_URL}/post/${post_id}/unvote`, {});
    } catch (e) {
      return;
    } finally {
      votes.innerText = parseInt(votes.innerText) + 1;
      up.value = null;
      down.value = null;
    }
    return;
  }

  try {
    await makeRequest(`${BASE_URL}/post/${post_id}/downvote`, {});
  } catch (e) {
    return;
  } finally {
    if (state && state === 'Up')
      votes.innerText = parseInt(votes.innerText) - 2;
    else votes.innerText = parseInt(votes.innerText) - 1;
    down.value = 'Down';
    up.value = 'Down';
  }
};

const showUserPostVotes = async (user_id) => {
  const div = document.getElementById('user-post-votes-div');

  const table = document.createElement('table');
  table.id = 'user-post-votes';
  const tbody = document.createElement('tbody');

  const res = await makeRequest(`${BASE_URL}/user/${user_id}/postvotes`, {
    headers: {
      Accept: 'application/json',
    },
  });

  for (let i = 0; i < res.payload.length; ++i) {
    const post = res.payload[i];
    const row = tbody.insertRow();

    row.innerText += post.title;
    row.innerText += new Date(post.createdAt).toString();
  }

  table.appendChild(tbody);
  div.appendChild(table);
};

const upvoteComment = async (up, down) => {
  const comment_id = up.getAttribute('comment-id');
  const state = up.value;
  const votes = document.getElementsByClassName('comment-votes')[0];

  if (state && state === 'Up') {
    try {
      await makeRequest(`${BASE_URL}/comment/${comment_id}/unvote`, {});
    } catch (e) {
      return;
    } finally {
      votes.innerText = parseInt(votes.innerText) - 1;
      up.value = null;
      down.value = null;
    }
    return;
  }

  try {
    await makeRequest(`${BASE_URL}/comment/${comment_id}/upvote`, {});
  } catch (e) {
    return;
  } finally {
    if (state && state === 'Down')
      votes.innerText = parseInt(votes.innerText) + 2;
    else votes.innerText = parseInt(votes.innerText) + 1;
    up.value = 'Up';
    down.value = 'Up';
  }
};

const downvoteComment = async (up, down) => {
  const comment_id = down.getAttribute('comment-id');
  const state = down.value;
  const votes = document.getElementsByClassName('comment-votes')[0];

  if (state && state === 'Down') {
    try {
      await makeRequest(`${BASE_URL}/comment/${comment_id}/unvote`, {});
    } catch (e) {
      return;
    } finally {
      votes.innerText = parseInt(votes.innerText) + 1;
      up.value = null;
      down.value = null;
    }
    return;
  }

  try {
    await makeRequest(`${BASE_URL}/comment/${comment_id}/downvote`, {});
  } catch (e) {
    return;
  } finally {
    if (state && state === 'Up')
      votes.innerText = parseInt(votes.innerText) - 2;
    else votes.innerText = parseInt(votes.innerText) - 1;
    down.value = 'Down';
    up.value = 'Down';
  }
};

const showUserCommentVotes = async (user_id) => {
  const div = document.getElementById('user-comment-votes-div');

  const table = document.createElement('table');
  table.id = 'user-comment-votes';
  const tbody = document.createElement('tbody');

  const res = await makeRequest(`${BASE_URL}/user/${user_id}/commentvotes`, {
    headers: {
      Accept: 'application/json',
    },
  });

  for (let i = 0; i < res.payload.length; ++i) {
    const comment = res.payload[i];
    const row = tbody.insertRow();

    row.innerText += comment.content;
    row.innerText += new Date(comment.createdAt).toString();
  }

  table.appendChild(tbody);
  div.appendChild(table);
};

const showUserPosts = async (user_id) => {
  const div = document.getElementById('user-posts-div');

  const table = document.createElement('table');
  table.id = 'user-posts';
  const tbody = document.createElement('tbody');

  const res = await makeRequest(`${BASE_URL}/user/${user_id}/posts`, {
    headers: {
      Accept: 'application/json',
    },
  });

  for (let i = 0; i < res.payload.length; ++i) {
    const post = res.payload[i];
    const row = tbody.insertRow();

    row.innerText += post.title;
    row.innerText += new Date(post.createdAt).toString();
  }

  table.appendChild(tbody);
  div.appendChild(table);
};

const showUserComments = async (user_id) => {
  const div = document.getElementById('user-comments-div');

  const table = document.createElement('table');
  table.id = 'user-comments';
  const tbody = document.createElement('tbody');

  const res = await makeRequest(`${BASE_URL}/user/${user_id}/comments`, {
    headers: {
      Accept: 'application/json',
    },
  });

  for (let i = 0; i < res.payload.length; ++i) {
    const comment = res.payload[i];
    const row = tbody.insertRow();

    row.innerText += comment.content;
    row.innerText += comment.post.title;
    row.innerText += new Date(comment.createdAt).toString();
  }

  table.appendChild(tbody);
  div.appendChild(table);
};

const showUserPostBookmarks = async (user_id) => {
  const div = document.getElementById('user-post-bookmarks-div');

  const table = document.createElement('table');
  table.id = 'user-post-bookmarks';
  const tbody = document.createElement('tbody');

  const res = await makeRequest(`${BASE_URL}/user/${user_id}/postbookmarks`, {
    headers: {
      Accept: 'application/json',
    },
  });

  for (let i = 0; i < res.payload.length; ++i) {
    const post = res.payload[i];
    const row = tbody.insertRow();

    row.innerText += post.title;
    row.innerText += new Date(post.createdAt).toString();
    row.innerText += post.user.username;
  }

  table.appendChild(tbody);
  div.appendChild(table);
};

const showUserCommentBookmarks = async (user_id) => {
  const div = document.getElementById('user-comment-bookmarks-div');

  const table = document.createElement('table');
  table.id = 'user-comment-bookmarks';
  const tbody = document.createElement('tbody');

  const res = await makeRequest(
    `${BASE_URL}/user/${user_id}/commentbookmarks`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  for (let i = 0; i < res.payload.length; ++i) {
    const comment = res.payload[i];
    const row = tbody.insertRow();

    row.innerText += comment.content;
    row.innerText += comment.post.title;
    row.innerText += new Date(comment.createdAt).toString();
    row.innerText += comment.user.username;
  }

  table.appendChild(tbody);
  div.appendChild(table);
};

// Event Listeners

if (postBookmarkButton)
  postBookmarkButton.addEventListener('click', async () => {
    await bookmarkPost(postBookmarkButton.value);
  });

if (commentBookmarkButton.length) {
  for (let i = 0; i < commentBookmarkButton.length; ++i) {
    commentBookmarkButton[i].addEventListener('click', async () => {
      await bookmarkComment(commentBookmarkButton[i]);
    });
  }
}

if (showUserPostBookMarksButton)
  showUserPostBookMarksButton.addEventListener('click', async () => {
    await showUserPostBookmarks(showUserPostBookMarksButton.value);
  });

if (showUserCommentBookMarksButton)
  showUserCommentBookMarksButton.addEventListener('click', async () => {
    await showUserCommentBookmarks(showUserCommentBookMarksButton.value);
  });

if (postDownvoteButtons && postUpvoteButtons) {
  for (let i = 0; i < postDownvoteButtons.length; ++i) {
    postDownvoteButtons[i].addEventListener('click', async () => {
      await downvotePost(postDownvoteButtons[i], postUpvoteButtons[i]);
    });
    postUpvoteButtons[i].addEventListener('click', async () => {
      await upvotePost(postUpvoteButtons[i], postDownvoteButtons[i]);
    });
  }
}

if (commentDownvoteButtons && commentUpvoteButtons) {
  for (let i = 0; i < commentDownvoteButtons.length; ++i) {
    commentDownvoteButtons[i].addEventListener('click', async () => {
      await downvoteComment(commentDownvoteButtons[i], commentUpvoteButtons[i]);
    });
    commentUpvoteButtons[i].addEventListener('click', async () => {
      await upvoteComment(commentUpvoteButtons[i], commentDownvoteButtons[i]);
    });
  }
}

if (showUserPostVotesButton)
  showUserPostVotesButton.addEventListener('click', async () => {
    await showUserPostVotes(showUserPostVotesButton.value);
  });

if (showUserPostsButton)
  showUserPostsButton.addEventListener('click', async () => {
    await showUserPosts(showUserPostsButton.value);
  });

if (showUserCommentsButton)
  showUserCommentsButton.addEventListener('click', async () => {
    await showUserComments(showUserCommentsButton.value);
  });

if (showUserCommentVotesButton)
  showUserCommentVotesButton.addEventListener('click', async () => {
    await showUserCommentVotes(showUserCommentVotesButton.value);
  });

if (postVotesDivs) {
  for (let i = 0; i < postVotesDivs.length; ++i) {
    postVotesDivs[i].addEventListener('onload', async () => {
      await loadPostVotes(postVotesDivs[i].value);
    });
  }
}
