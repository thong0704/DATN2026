import { formatCurrency, tAmenity } from '../utils/format';

export default function RoomCard({ room, onSelect, selected }) {
  const img = room.images?.[0]?.url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop';
  
  const hasDynamicPricing = room.dynamicPricing && room.dynamicPricing.averagePrice !== room.pricePerNight;
  const displayPrice = room.dynamicPricing ? room.dynamicPricing.averagePrice : room.pricePerNight;
  const activeLabels = room.dynamicPricing?.perNight
    ? [...new Set(room.dynamicPricing.perNight.map(d => d.label).filter(Boolean))]
    : [];

  return (
    <div className={`card overflow-hidden flex flex-col md:flex-row group transition-all duration-300 hover:shadow-xl hover:border-brand-200 ${selected ? 'ring-2 ring-brand-600 shadow-glow bg-brand-50/20' : ''}`}>
      <div className="md:w-56 h-44 md:h-auto overflow-hidden flex-shrink-0">
        <img src={img} alt={room.roomNumber} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
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
            <span key={a} className="badge bg-gray-100 text-gray-700">{tAmenity(a)}</span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="text-xs text-gray-500">
              {room.dynamicPricing ? 'Giá TB / đêm' : 'Giá thường / đêm'}
            </p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-bold text-brand-700">{formatCurrency(displayPrice)}</p>
              {hasDynamicPricing && (
                <p className="text-xs text-gray-400 line-through">{formatCurrency(room.pricePerNight)}</p>
              )}
            </div>
            {activeLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {activeLabels.map((lbl, idx) => (
                  <span key={idx} className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase leading-none border ${
                    lbl === 'Cuối tuần' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    lbl === 'Mùa cao điểm' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    🎉 {lbl}
                  </span>
                ))}
              </div>
            ) : room.weekendPrice > 0 ? (
              <p className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5 mt-1 inline-block font-semibold">
                📅 Cuối tuần: {formatCurrency(room.weekendPrice)}
              </p>
            ) : null}
          </div>
          {onSelect && (
            <button onClick={() => onSelect(room)} className={`btn font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 ${
              selected 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 scale-[1.02] hover:scale-[1.04]' 
                : 'btn-primary'
            }`}>
              {selected ? '✓ Đã chọn' : 'Chọn phòng'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
