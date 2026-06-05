import { formatCurrency } from '../utils/format';

export default function RoomCard({ room, onSelect, selected }) {
  const img = room.images?.[0]?.url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop';
  return (
    <div className={`card overflow-hidden flex flex-col md:flex-row ${selected ? 'ring-2 ring-brand-600' : ''}`}>
      <img src={img} alt={room.roomNumber} className="md:w-56 h-44 md:h-auto object-cover" />
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold capitalize">{room.type} · Phòng {room.roomNumber}</h3>
          <span className="text-sm text-gray-500">{room.size}m² · {room.bedType}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Sức chứa: {room.capacity?.adults} người lớn · {room.capacity?.children} trẻ em
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {(room.amenities || []).slice(0, 5).map((a) => (
            <span key={a} className="badge bg-gray-100 text-gray-700">{a}</span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="text-xs text-gray-500">Giá / đêm</p>
            <p className="text-xl font-bold text-brand-700">{formatCurrency(room.pricePerNight)}</p>
          </div>
          {onSelect && (
            <button onClick={() => onSelect(room)} className="btn-primary">
              {selected ? 'Đã chọn' : 'Chọn phòng'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
