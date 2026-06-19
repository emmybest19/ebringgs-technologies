import { Link, useSearchParams } from 'react-router-dom';
import { Search, Calendar, Eye, Tag, BookOpen } from 'lucide-react';
import { useBlogs, type BlogListItem } from '../services/queries';
import { PageLoader, EmptyState } from '@ebringgs/ui';

const allCategories = ['All', 'Engineering', 'Data Science', 'Career', 'Industry', 'Design'];

function PostCard({ post }: { post: BlogListItem }) {
  const catColors: Record<string, string> = {
    Engineering: 'text-teal-600 bg-teal-50',
    'Data Science': 'text-emerald-600 bg-emerald-50',
    Career: 'text-amber-600 bg-amber-50',
    Industry: 'text-purple-600 bg-purple-50',
    Design: 'text-pink-600 bg-pink-50',
  };
  const colorClass = catColors[post.category] || 'text-gray-600 bg-gray-100';

  return (
    <Link to={`/blog/${post.slug}`} className="card-hover-border group block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-teal-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="h-44 bg-linear-to-br from-slate-100 to-teal-100 flex items-center justify-center">
        <BookOpen size={36} className="text-teal-200" />
      </div>
      <div className="p-6">
        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${colorClass}`}>{post.category}</span>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors line-clamp-2">{post.title}</h3>
        <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-5">{post.excerpt}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.slice(0, 3).map(t => (
            <span key={t} className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              <Tag size={10} />{t}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1.5 font-medium text-gray-500">{post.author.name}</div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            <span className="flex items-center gap-1"><Eye size={12} /> {post.views.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const { data, isLoading: loading } = useBlogs({ search, category, page, limit: 6 });
  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const totalPages = Math.ceil(total / 6);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-linear-to-br from-slate-900 to-teal-950 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Blog & Insights</h1>
          <p className="text-slate-300 text-lg mb-8">Engineering, data, career advice, and industry perspectives.</p>
          <div className="relative max-w-xl mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              defaultValue={search}
              onKeyDown={e => { if (e.key === 'Enter') setFilter('search', (e.target as HTMLInputElement).value); }}
              placeholder="Search articles..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-gray-900 text-sm outline-none focus:ring-2 focus:ring-teal-400 shadow-lg"
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setFilter('category', cat === 'All' ? '' : cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                (cat === 'All' && !category) || cat === category
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-600'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? <PageLoader /> : posts.length === 0 ? (
          <EmptyState icon={BookOpen} title="No articles found" description="Try a different search or category." />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {posts.map(p => <PostCard key={p._id} post={p} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setFilter('page', String(p))}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      p === page ? 'bg-teal-600 text-white' : 'border border-gray-200 text-gray-600 hover:border-teal-300'
                    }`}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
