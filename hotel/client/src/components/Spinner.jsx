export default function Spinner({ size = 6, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-200 border-t-brand-600 h-${size} w-${size}`}
        style={{ height: size * 4, width: size * 4 }}
      />
    </div>
  );
}
