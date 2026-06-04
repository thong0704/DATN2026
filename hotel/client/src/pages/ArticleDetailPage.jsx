import { useParams, Link } from 'react-router-dom';
import { useGetArticleQuery } from '../features/content/contentApi';
import Spinner from '../components/Spinner';
import { formatDate } from '../utils/format';

export default function ArticleDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, isError } = useGetArticleQuery(slug);
  const a = data?.data?.article;

  if (isLoading) return <Spinner className="py-16" />;
  if (isError || !a) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Bài viết không tồn tại.</p>
        <Link to="/articles" className="btn-outline mt-4 inline-block">← Quay lại</Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/articles" className="text-sm text-brand-700">← Tất cả bài viết</Link>
      <h1 className="text-3xl md:text-4xl font-bold mt-3">{a.title}</h1>
      <p className="text-sm text-gray-500 mt-2">{formatDate(a.createdAt)} · {a.views || 0} lượt xem</p>
      {a.coverImage && <img src={a.coverImage} alt="" className="w-full rounded-xl my-6" />}
      {a.summary && <p className="text-lg text-gray-700 italic mb-6">{a.summary}</p>}
      {a.couponCode && (
        <div className="card p-4 mb-6 bg-emerald-50 border-emerald-200">
          <p className="text-sm text-emerald-700">Sử dụng mã sau khi đặt phòng để được giảm giá:</p>
          <p className="text-2xl font-mono font-bold text-emerald-800 mt-1">{a.couponCode}</p>
        </div>
      )}
      <div className="prose max-w-none whitespace-pre-wrap leading-relaxed text-gray-800">{a.content}</div>
    </article>
  );
}
