import { formatCurrency, tAmenity } from '../utils/format';

export default function RoomCard({ room, onSelect, selected }) {
  const img = room.images?.[0]?.url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop';
  
  const hasDynamicPricing = room.dynamicPricing && room.dynamicPricing.averagePrice !== room.pricePerNight;
  const displayPrice = room.dynamicPricing ? room.dynamicPricing.averagePrice : room.pricePerNight;
  const activeLabels = room.dynamicPricing?.perNight
    ? [...new Set(room.dynamicPricing.perNight.map(d => d.label).filter(Boolean))]
    : [];

  return (
    <div className={`card overflow-hidden flex flex-col md:flex-row group bg-white border border-border transition-all duration-500 ${selected ? 'ring-1 ring-accent border-accent/40 shadow-glow' : ''}`}>
      {/* Media Window */}
      <div className="md:w-64 h-48 md:h-auto overflow-hidden flex-shrink-0 relative">
        <img src={img} alt={room.roomNumber} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
      </div>

      {/* Details Area */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-accent font-mono block mb-1">
                Phòng {room.roomNumber}
              </span>
              <h3 className="font-serif-display font-medium text-xl text-primary capitalize">
                {room.type}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono flex-shrink-0">
              {room.size}m² · {room.bedType}
            </span>
          </div>

          {/* Sức chứa */}
          <p className="text-xs text-slate-500 mt-2 font-light">
            Sức chứa tối đa: {room.capacity?.adults} người lớn · {room.capacity?.children} trẻ em
          </p>

          {/* Tiện nghi */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {(room.amenities || []).slice(0, 5).map((a) => (
              <span key={a} className="badge bg-slate-50 text-slate-500 border border-slate-100/50">
                {tAmenity(a)}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Row: Prices & CTA */}
        <div className="mt-8 flex items-end justify-between border-t border-border/40 pt-4">
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">
              {room.dynamicPricing ? 'Giá trung bình / đêm' : 'Giá phòng / đêm'}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-mono font-semibold text-primary">{formatCurrency(displayPrice)}</p>
              {hasDynamicPricing && (
                <p className="text-xs text-slate-400 line-through font-mono">{formatCurrency(room.pricePerNight)}</p>
              )}
            </div>
            
            {/* Dynamic Pricing Badges */}
            {activeLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {activeLabels.map((lbl, idx) => (
                  <span key={idx} className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase tracking-wider border ${
                    lbl === 'Cuối tuần' ? 'bg-indigo-50 text-indigo-705 border-indigo-150' :
                    lbl === 'Mùa cao điểm' ? 'bg-amber-50 text-amber-705 border-amber-150' :
                    'bg-rose-50 text-rose-705 border-rose-150'
                  }`}>
                    ✦ {lbl}
                  </span>
                ))}
              </div>
            ) : room.weekendPrice > 0 ? (
              <p className="text-[9px] font-mono text-indigo-500 bg-indigo-50/50 border border-indigo-100/50 rounded px-2 py-0.5 mt-1.5 inline-block uppercase tracking-wider font-semibold">
                📅 Cuối tuần: {formatCurrency(room.weekendPrice)}
              </p>
            ) : null}
          </div>

          {/* Button Selector */}
          {onSelect && (
            <button 
              onClick={() => onSelect(room)} 
              className={`rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                selected 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 scale-[1.02] hover:scale-[1.04]' 
                  : 'btn-outline border-accent text-accent hover:bg-accent hover:text-white hover:border-accent'
              }`}
            >
              {selected ? '✓ Đã chọn' : 'Chọn phòng'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
