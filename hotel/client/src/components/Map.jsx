import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function Map({ lat, lng, hotelName, address, zoom = 15 }) {
  if (!lat || !lng || (lat === 0 && lng === 0)) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-slate-50 border border-dashed border-gray-200 rounded-2xl text-slate-400">
        <div className="text-center">
          <span className="text-3xl block mb-2">📍</span>
          <p className="font-medium text-sm">Chưa có thông tin bản đồ cho khách sạn này</p>
        </div>
      </div>
    );
  }

  const position = [lat, lng];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        key={`${lat}-${lng}`}
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={customIcon}>
          <Popup>
            <div className="text-sm p-1 font-sans">
              <strong className="text-slate-900 block font-bold mb-1">{hotelName}</strong>
              <span className="text-slate-500 block text-xs mb-2">{address}</span>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address + ', Vietnam')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-xl transition-colors w-full text-center mt-1 no-underline"
              >
                🚗 Chỉ đường (Google Maps)
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
