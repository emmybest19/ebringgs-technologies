import { useState, type FormEvent } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageLoader } from '@ebringgs/ui';
import {
  useBlogs, useCreateBlog, useUpdateBlog, useDeleteBlog,
  type BlogListItem,
} from '../../services/queries';

type BlogRow = BlogListItem;

const categories = ['Engineering', 'Data Science', 'Career', 'Industry', 'Design'];

function BlogForm({ post, onClose }: {
  post?: BlogRow | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(post?.title || '');
  const [category, setCategory] = useState(post?.category || categories[0]);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(post?.isPublished ?? false);
  const [error, setError] = useState('');

  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();
  const loading = createBlog.isPending || updateBlog.isPending;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      title, slug, category, excerpt, content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isPublished,
      ...(isPublished && !post?.isPublished ? { publishedAt: new Date() } : {}),
    };
    const handlers = {
      onSuccess: () => onClose(),
      onError: () => setError('Failed to save post.'),
    };
    if (post) {
      updateBlog.mutate({ id: post._id, payload }, handlers);
    } else {
      createBlog.mutate(payload, handlers);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{post ? 'Edit post' : 'New blog post'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Post title"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm" />
            {title && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Slug: <span className="font-mono">{slug}</span></p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 outline-none text-sm">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tags (comma-separated)</label>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="React, TypeScript, ..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Excerpt (max 300 chars)</label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} required rows={2} maxLength={300}
              placeholder="Short summary shown in listings..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Content (Markdown)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} required rows={12}
              placeholder="Write your post in Markdown..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm resize-none font-mono" />
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-6 rounded-full transition-colors ${isPublished ? 'bg-teal-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                onClick={() => setIsPublished(v => !v)}>
                <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-1 transition-transform ${isPublished ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{isPublished ? 'Published' : 'Draft'}</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-60">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {post ? 'Save changes' : 'Publish post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBlogs() {
  const { data, isLoading: loading } = useBlogs({ limit: 50 });
  const posts = data?.posts ?? [];
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogRow | null>(null);

  const updateBlog = useUpdateBlog();
  const deleteBlog = useDeleteBlog();

  const deletePost = (id: string) => {
    if (!confirm('Delete this post?')) return;
    deleteBlog.mutate(id, {
      onError: () => toast.error('Failed to delete post.'),
    });
  };

  const togglePublish = (post: BlogRow) => {
    updateBlog.mutate(
      { id: post._id, payload: { isPublished: !post.isPublished } },
      { onError: () => toast.error('Failed to update publish state.') },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog posts</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{posts.length} posts total</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors">
          <Plus size={16} /> New post
        </button>
      </div>

      {loading ? <PageLoader /> : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-180">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Category</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Views</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {posts.map(post => (
                <tr key={post._id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">{post.title}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{post.author.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2.5 py-1 rounded-full">{post.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${post.isPublished ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}>
                      {post.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{post.views.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePublish(post)} title={post.isPublished ? 'Unpublish' : 'Publish'}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
                        {post.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => { setEditing(post); setShowForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950 text-gray-400 dark:text-slate-500 hover:text-teal-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deletePost(post._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 dark:text-slate-500 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showForm && (
        <BlogForm
          post={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
