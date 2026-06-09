import { Link } from 'react-router-dom';
import { useListArticlesQuery } from '../features/content/contentApi';
import Spinner from '../components/Spinner';
import { formatDate } from '../utils/format';

export default function ArticlesPage() {
  const { data, isLoading } = useListArticlesQuery();
  const articles = data?.data?.articles || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-in-up">
      <h1 className="text-3xl font-bold mb-2">Khuyến mãi & Bài viết</h1>
      <p className="text-gray-600 mb-8">Cập nhật ưu đãi mới nhất, mẹo du lịch và mã giảm giá hấp dẫn.</p>

      {isLoading ? <Spinner className="py-16" /> : articles.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">Chưa có bài viết nào.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((a) => (
            <Link key={a._id} to={`/articles/${a.slug}`} className="card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
              {a.coverImage ? (
                <img src={a.coverImage} alt={a.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-brand-100 to-brand-200" />
              )}
              <div className="p-4">
                <p className="text-xs text-gray-500">{formatDate(a.createdAt)}</p>
                <h3 className="font-semibold text-lg mt-1 line-clamp-2">{a.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.summary}</p>
                {a.couponCode && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono">
                    {a.couponCode}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
