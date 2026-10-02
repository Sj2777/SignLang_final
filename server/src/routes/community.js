import { Router } from 'express';
import Post from '../models/Post.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function authorName(author) {
  if (author.accountType === 'individual') return author.profile?.fullName || 'HandSpeak member';
  if (author.accountType === 'organization') return author.profile?.organizationName || 'HandSpeak organization';
  return 'HandSpeak member';
}

function serializePost(post) {
  return {
    ...post,
    author: {
      id: post.author._id,
      name: authorName(post.author),
      accountType: post.author.accountType,
    },
  };
}

router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'accountType profile')
      .lean();
    return res.json({ posts: posts.map(serializePost) });
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 500) {
      return res.status(400).json({ message: 'Write a message between 1 and 500 characters.' });
    }
    const post = await Post.create({ author: req.user.id, message });
    const populatedPost = await post.populate('author', 'accountType profile');
    return res.status(201).json({ post: serializePost(populatedPost.toObject()) });
  } catch (error) {
    return next(error);
  }
});

export default router;
