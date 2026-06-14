const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  { _id: false } // Avoid generating subdocument _id for clean items
);

const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: [true, 'Reply content is required'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
  },
  replies: [replySchema], // Nested replies list (Single level Comment -> Reply only)
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  votes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
});

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    trim: true,
  },
  options: [pollOptionSchema],
  expiresAt: {
    type: Date,
  },
});

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    image: {
      type: String, // Path to local uploads folder (e.g. /uploads/image.png)
    },
    category: {
      type: String,
      enum: ['General', 'Finance', 'Career', 'Education', 'Technology'],
      default: 'General',
    },
    likes: [likeSchema],
    comments: [commentSchema],
    poll: pollSchema,
    isPromoted: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true, // Optimizes paginated find().sort({ createdAt: -1 }) queries
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Post', postSchema);
