import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import Blog from '../models/Blog.model';
import { AppError } from '../middleware/error.middleware';
import { sendPushToRole } from '../utils/pushNotification';

export const listPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, tag, page = '1', limit = '10' } = req.query as Record<string, string>;
    const query: Record<string, unknown> = { isPublished: true };
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (tag) query.tags = tag;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [posts, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name avatar')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-content'),
      Blog.countDocuments(query),
    ]);

    res.json({
      status: 'success',
      data: { posts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

export const getPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await Blog.findOneAndUpdate(
      { slug: req.params.slug, isPublished: true },
      { $inc: { views: 1 } },
      { new: true },
    ).populate('author', 'name avatar bio');
    if (!post) return next(new AppError('Post not found.', 404));
    res.json({ status: 'success', data: { post } });
  } catch (err) { next(err); }
};

export const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const post = await Blog.create({ ...req.body, author: req.user!.userId });

    // Notify all students about the new blog post
    if (post.isPublished) {
      sendPushToRole('student', {
        title: 'New Blog Post',
        body: `"${post.title}" — check it out!`,
        url: `/blog/${post.slug}`,
        tag: 'blog-new',
      }).catch(() => {});
    }

    res.status(201).json({ status: 'success', data: { post } });
  } catch (err) { next(err); }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!post) return next(new AppError('Post not found.', 404));
    res.json({ status: 'success', data: { post } });
  } catch (err) { next(err); }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};
