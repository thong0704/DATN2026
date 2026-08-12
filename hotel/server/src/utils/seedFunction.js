const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const logger = require('./logger');

const AMENITIES_ALL = ['wifi', 'pool', 'gym', 'spa', 'parking', 'restaurant', 'bar', 'airport_shuttle', 'laundry', 'concierge'];

const HOTEL_IMAGES = [
  [ 
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=800&fit=crop',
  ],
  [ 
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=1200&h=800&fit=crop',
  ],
  [ 
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&h=800&fit=crop',
  ],
  [ 
    'https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=800&fit=crop',
  ],
  [ 
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=1200&h=800&fit=crop',
  ],
  [ 
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&h=800&fit=crop',
  ],
  [ 
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=800&fit=crop',
  ],
  [ 
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=800&fit=crop',
  ],
  [ 
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&h=800&fit=crop',
  ],
  [ 
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=800&fit=crop',
  ],
];

const ROOM_IMAGES = {
  basic: [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1000&h=700&fit=crop',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000&h=700&fit=crop',
  ],
  standard: [
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1000&h=700&fit=crop',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000&h=700&fit=crop',
  ],
  vip: [
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1000&h=700&fit=crop',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1000&h=700&fit=crop',
  ],
};

const HOTEL_LIST = [
  { city: 'Hà Nội',    province: 'Hà Nội',        street: '58 Lý Thường Kiệt',       coords: [105.8412, 21.0245], stars: 5, amenities: [0,1,2,3,4,5,6,7,8,9] },
  { city: 'TP.HCM',    province: 'TP. Hồ Chí Minh', street: '19 Nguyễn Huệ',          coords: [106.7009, 10.7769], stars: 5, amenities: [0,1,2,3,4,5,6,7,8,9] },
  { city: 'Đà Nẵng',   province: 'Đà Nẵng',        street: '24 Trần Phú',             coords: [108.2208, 16.0471], stars: 4, amenities: [0,1,2,3,4,5,6,7] },
  { city: 'Nha Trang',  province: 'Khánh Hòa',      street: '66 Trần Phú',             coords: [109.1967, 12.2388], stars: 4, amenities: [0,1,2,3,4,5,6,7] },
  { city: 'Đà Lạt',    province: 'Lâm Đồng',        street: '7 Trần Hưng Đạo',        coords: [108.4417, 11.9465], stars: 4, amenities: [0,2,3,4,5,8,9] },
  { city: 'Hội An',    province: 'Quảng Nam',        street: '18 Cửa Đại',             coords: [108.3257, 15.8801], stars: 4, amenities: [0,1,2,3,4,5,6] },
  { city: 'Huế',       province: 'Thừa Thiên Huế',  street: '5 Hùng Vương',           coords: [107.5905, 16.4637], stars: 4, amenities: [0,2,4,5,8,9] },
  { city: 'Phú Quốc',  province: 'Kiên Giang',       street: 'Bãi Trường, Dương Tơ',  coords: [103.9740, 10.2897], stars: 5, amenities: [0,1,2,3,4,5,6,7,8,9] },
  { city: 'Cần Thơ',   province: 'Cần Thơ',          street: '2 Hai Bà Trưng',         coords: [105.7469, 10.0341], stars: 3, amenities: [0,4,5,8] },
  { city: 'Hạ Long',   province: 'Quảng Ninh',       street: '12 Hạ Long',             coords: [107.0680, 20.9101], stars: 5, amenities: [0,1,2,3,4,5,6,7,9] },
];

const ROOM_TEMPLATES = [
  { roomNumber: '101', type: 'basic',    floor: 1, adults: 2, children: 1, bedType: 'Single', size: 20, price: 600000  },
  { roomNumber: '201', type: 'basic',    floor: 2, adults: 2, children: 1, bedType: 'Twin',   size: 22, price: 700000  },
  { roomNumber: '301', type: 'standard', floor: 3, adults: 2, children: 1, bedType: 'Queen',  size: 30, price: 1200000 },
  { roomNumber: '401', type: 'standard', floor: 4, adults: 2, children: 2, bedType: 'Queen',  size: 35, price: 1500000 },
  { roomNumber: '501', type: 'vip',      floor: 5, adults: 3, children: 2, bedType: 'King',   size: 55, price: 3500000 },
];

module.exports = async function seedDatabase() {
  await Promise.all([
    User.deleteMany({ role: { $ne: 'admin' } }),
    Hotel.deleteMany({}),
    Room.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
  ]);

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin 2T Hotel',
      email: 'admin@2thotel.vn',
      password: 'admin123',
      role: 'admin',
      isEmailVerified: true,
      phone: '0900000001',
    });
  }

  const hotels = [];
  for (let idx = 0; idx < HOTEL_LIST.length; idx++) {
    const h = HOTEL_LIST[idx];
    const name = `2T Hotel ${h.city}`;
    const amenities = h.amenities.map((i) => AMENITIES_ALL[i]);
    const imgs = HOTEL_IMAGES[idx];
    const hotel = await Hotel.create({
      name,
      description: `${name} – khách sạn ${h.stars} sao tọa lạc tại trung tâm ${h.city}, mang đến trải nghiệm lưu trú đẳng cấp với không gian sang trọng và dịch vụ tận tâm. Địa điểm lý tưởng để khám phá vẻ đẹp của ${h.city}.`,
      chain: '2T Hotel Group',
      stars: h.stars,
      address: { street: h.street, city: h.city, province: h.province, country: 'Vietnam' },
      location: { type: 'Point', coordinates: h.coords },
      images: [
        { url: imgs[0], public_id: '' },
        { url: imgs[1], public_id: '' },
        { url: imgs[2], public_id: '' },
      ],
      amenities,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      policies: 'Nhận phòng từ 14:00. Trả phòng trước 12:00. Không hút thuốc trong phòng. Thú cưng không được phép.',
      ownerId: admin._id,
      managerId: admin._id,
      isActive: true,
      basePrice: ROOM_TEMPLATES[0].price,
    });
    hotels.push(hotel);
  }

  let totalRooms = 0;
  for (const hotel of hotels) {
    const starBonus = hotel.stars >= 5 ? 1.3 : hotel.stars === 4 ? 1.1 : 1.0;
    let minPrice = Infinity;
    for (const tpl of ROOM_TEMPLATES) {
      const price = Math.round(tpl.price * starBonus / 1000) * 1000;
      await Room.create({
        hotel: hotel._id,
        roomNumber: tpl.roomNumber,
        type: tpl.type,
        floor: tpl.floor,
        capacity: { adults: tpl.adults, children: tpl.children },
        bedType: tpl.bedType,
        size: tpl.size,
        pricePerNight: price,
        weekendPrice: Math.round(price * 1.2 / 1000) * 1000,
        amenities: ['wifi', 'tv', 'air_conditioning', 'minibar', 'safe'],
        images: [
          { url: ROOM_IMAGES[tpl.type][0], public_id: '' },
          { url: ROOM_IMAGES[tpl.type][1], public_id: '' },
        ],
        status: 'available',
        isActive: true,
      });
      if (price < minPrice) minPrice = price;
      totalRooms++;
    }
    hotel.basePrice = minPrice;
    await hotel.save();
  }

  return { hotelsCount: hotels.length, roomsCount: totalRooms, adminEmail: admin.email };
};
