import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, Tag, Clock } from 'lucide-react';
import { useBlogPost } from '../services/queries';
import { PageLoader } from '../components/ui/LoadingSpinner';

function renderContent(content: string) {
  // Very simple markdown-like renderer
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let i = 0;
  let keyCounter = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      elements.push(<h2 key={keyCounter++} className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={keyCounter++} className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">{line.slice(4)}</h3>);
    } else if (line.startsWith('```')) {
      const lang = line.slice(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={keyCounter++} className="my-5 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
          {lang && <div className="bg-gray-800 text-gray-400 text-xs px-4 py-2 font-mono">{lang}</div>}
          <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm font-mono leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
    } else if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={keyCounter++} className="my-4 space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-gray-600 dark:text-slate-400">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.trim() === '') {
      // skip blank lines
    } else {
      elements.push(<p key={keyCounter++} className="text-gray-600 dark:text-slate-400 leading-relaxed my-3">{line}</p>);
    }
    i++;
  }
  return elements;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading: loading } = useBlogPost(slug);

  if (loading) return <PageLoader />;
  if (!post) return <div className="py-24 text-center text-gray-500 dark:text-slate-400">Post not found.</div>;

  const readTime = Math.max(1, Math.round(post.content.split(' ').length / 200));

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-teal-950 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to blog
          </Link>
          <span className="inline-block text-xs font-semibold text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full mb-4">{post.category}</span>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">{post.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-8">
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="flex items-center gap-1.5"><Eye size={14} /> {post.views.toLocaleString()} views</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> {readTime} min read</span>
          </div>
          {/* Author */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center font-bold shrink-0">
              {post.author.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{post.author.name}</p>
              <p className="text-xs text-slate-400">{post.author.bio}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <div className="prose-like">
          {renderContent(post.content)}
        </div>

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Link key={tag} to={`/blog?tag=${tag}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-sm rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                <Tag size={12} /> {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Back */}
        <div className="mt-10">
          <Link to="/blog" className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-400 hover:border-teal-300 hover:text-teal-600 transition-colors">
            <ArrowLeft size={15} /> All articles
          </Link>
        </div>
      </article>
    </div>
  );
}
