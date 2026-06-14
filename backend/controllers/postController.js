const Post = require('../models/Post');
const cloudinary = require('../config/cloudinary');

// Helper: extract Cloudinary public_id from a secure URL for deletion
const getCloudinaryPublicId = (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('http')) return null;
  // Example URL: https://res.cloudinary.com/<cloud>/image/upload/v123456/connecthub-posts/filename.jpg
  try {
    const parts = imageUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    // Everything after version segment (v123456/) is the public_id
    const afterUpload = parts.slice(uploadIndex + 1);
    // Skip the version segment if present (starts with 'v' followed by digits)
    const start = /^v\d+$/.test(afterUpload[0]) ? 1 : 0;
    const publicIdWithExt = afterUpload.slice(start).join('/');
    // Remove file extension
    return publicIdWithExt.replace(/\.[^/.]+$/, '');
  } catch (e) {
    return null;
  }
};

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private
 */
const createPost = async (req, res, next) => {
  const { text, category } = req.body;
  const file = req.file;

  try {
    // 1. Validation: Post must contain at least text, image, or poll
    if (!text && !file && !req.body.poll) {
      res.status(400);
      return next(new Error('Post must contain text, an image, or a poll'));
    }

    // 2. Set image URL from Cloudinary if file was uploaded
    // multer-storage-cloudinary stores the full HTTPS URL in req.file.path
    let imagePath = '';
    if (file) {
      imagePath = file.path; // Full Cloudinary secure URL e.g. https://res.cloudinary.com/...
    }

    // 3. Parse poll data if present
    let pollData = null;
    if (req.body.poll) {
      try {
        const parsed = JSON.parse(req.body.poll);
        if (parsed && parsed.options && parsed.options.length >= 2) {
          pollData = {
            question: parsed.question ? parsed.question.trim() : '',
            options: parsed.options.map(opt => ({ text: opt.trim(), votes: [] })),
            expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
          };
        }
      } catch (err) {
        console.error("Failed to parse poll data:", err);
      }
    }

    // 4. Create post object using current request user details
    const newPost = await Post.create({
      userId: req.user._id,
      username: req.user.username,
      text: text ? text.trim() : '',
      image: imagePath,
      category: category || 'General',
      likes: [],
      comments: [],
      poll: pollData,
    });

    res.status(201).json(newPost);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated posts (newest first)
 * @route   GET /api/posts
 * @access  Public
 */
const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { category, search, sort } = req.query;

    // 1. Build Filter
    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { text: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    // 2. Fetch and Sort
    let posts;
    let totalPosts;

    if (sort === 'likes') {
      // Sort by likes array size descending
      posts = await Post.aggregate([
        { $match: filter },
        { $addFields: { likesCount: { $size: '$likes' } } },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);
      const totalResult = await Post.aggregate([
        { $match: filter },
        { $count: 'count' }
      ]);
      totalPosts = totalResult[0]?.count || 0;
    } else if (sort === 'comments') {
      // Sort by comments array size descending
      posts = await Post.aggregate([
        { $match: filter },
        { $addFields: { commentsCount: { $size: '$comments' } } },
        { $sort: { commentsCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);
      const totalResult = await Post.aggregate([
        { $match: filter },
        { $count: 'count' }
      ]);
      totalPosts = totalResult[0]?.count || 0;
    } else {
      // Default: sort by newest first (latest)
      posts = await Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      totalPosts = await Post.countDocuments(filter);
    }

    const hasMore = skip + posts.length < totalPosts;

    res.status(200).json({
      posts,
      currentPage: page,
      hasMore,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle like / unlike on a post
 * @route   POST /api/posts/:id/like
 * @access  Private
 */
const likePost = async (req, res, next) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    // Check if the user has already liked this post
    const alreadyLikedIndex = post.likes.findIndex(
      (like) => like.userId.toString() === req.user._id.toString()
    );

    if (alreadyLikedIndex > -1) {
      // User already liked it: remove the like (unlike)
      post.likes.splice(alreadyLikedIndex, 1);
    } else {
      // User hasn't liked it yet: push new like
      post.likes.push({
        userId: req.user._id,
        username: req.user.username,
      });
    }

    await post.save();

    res.status(200).json(post.likes);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Comment on a post
 * @route   POST /api/posts/:id/comment
 * @access  Private
 */
const commentPost = async (req, res, next) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    // Validation: Comment cannot be empty
    if (!text || !text.trim()) {
      res.status(400);
      return next(new Error('Comment cannot be empty'));
    }

    const post = await Post.findById(id);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    // Push new comment
    post.comments.push({
      userId: req.user._id,
      username: req.user.username,
      text: text.trim(),
      createdAt: new Date(),
    });

    await post.save();

    res.status(201).json(post.comments);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reply to a comment on a post
 * @route   POST /api/posts/:id/comment/:commentId/reply
 * @access  Private
 */
const replyCommentPost = async (req, res, next) => {
  const { id, commentId } = req.params;
  const { text } = req.body;

  try {
    if (!text || !text.trim()) {
      res.status(400);
      return next(new Error('Reply cannot be empty'));
    }

    const post = await Post.findById(id);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found'));
    }

    comment.replies.push({
      userId: req.user._id,
      username: req.user.username,
      text: text.trim(),
      createdAt: new Date(),
    });

    await post.save();

    res.status(201).json(post.comments);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a post
 * @route   PUT /api/posts/:id
 * @access  Private
 */
const updatePost = async (req, res, next) => {
  const { id } = req.params;
  const { text, removeImage, category } = req.body;
  const file = req.file;

  try {
    // 1. Find post
    const post = await Post.findById(id);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    // 2. Authorize
    if (post.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to edit this post'));
    }

    // 3. Validation: post cannot be empty
    const willHaveText = text !== undefined ? text.trim() : post.text;
    const willHaveImage = file ? true : (removeImage === 'true' ? false : !!post.image);

    if (!willHaveText && !willHaveImage) {
      res.status(400);
      return next(new Error('Post must contain text or an image'));
    }

    // 4. Update text and category if provided
    if (text !== undefined) {
      post.text = text.trim();
    }
    if (category !== undefined) {
      post.category = category;
    }

    // 5. Handle image changes — delete old Cloudinary image if removing or replacing
    if (removeImage === 'true' || file) {
      if (post.image) {
        const publicId = getCloudinaryPublicId(post.image);
        if (publicId) {
          cloudinary.uploader.destroy(publicId).catch((err) =>
            console.error(`[Cloudinary Clean Error] Failed to delete old image: ${err.message}`)
          );
        }
        post.image = '';
      }
    }

    if (file) {
      post.image = file.path; // Full Cloudinary secure URL
    }

    // 6. Save and return
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a post
 * @route   DELETE /api/posts/:id
 * @access  Private
 */
const deletePost = async (req, res, next) => {
  const { id } = req.params;

  try {
    // 1. Find post
    const post = await Post.findById(id);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    // 2. Authorize creator
    if (post.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to delete this post'));
    }

    // 3. File Cleanup — delete image from Cloudinary if it exists
    if (post.image) {
      const publicId = getCloudinaryPublicId(post.image);
      if (publicId) {
        cloudinary.uploader.destroy(publicId).catch((err) =>
          console.error(`[Cloudinary Clean Error] Failed to delete image: ${err.message}`)
        );
      }
    }

    // 4. Delete from database
    await post.deleteOne();

    res.status(200).json({ message: 'Post deleted successfully', postId: id });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle promote / unpromote on a post
 * @route   PUT /api/posts/:id/promote
 * @access  Private
 */
const promotePost = async (req, res, next) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    // Authorize owner
    if (post.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to promote this post'));
    }

    post.isPromoted = !post.isPromoted;
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Vote in a poll (supports vote swapping)
 * @route   POST /api/posts/:id/vote
 * @access  Private
 */
const votePoll = async (req, res, next) => {
  const { id } = req.params;
  const { optionId } = req.body;

  try {
    const post = await Post.findById(id);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    if (!post.poll) {
      res.status(400);
      return next(new Error('Post is not a poll'));
    }

    // Check if the poll is expired
    if (post.poll.expiresAt && new Date(post.poll.expiresAt) < new Date()) {
      res.status(400);
      return next(new Error('Poll has expired'));
    }

    // Support vote swapping: remove user's vote from all options
    post.poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter(v => v.toString() !== req.user._id.toString());
    });

    // Find the option to vote for
    const option = post.poll.options.id(optionId);
    if (!option) {
      res.status(404);
      return next(new Error('Poll option not found'));
    }

    // Register user's new vote
    option.votes.push(req.user._id);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getPosts,
  likePost,
  commentPost,
  replyCommentPost,
  updatePost,
  deletePost,
  promotePost,
  votePoll,
};
