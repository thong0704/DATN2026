﻿const { GoogleGenerativeAI } = require('@google/generative-ai');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// ─── Gemini AI Setup ───
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `Bạn là trợ lý ảo của hệ thống đặt phòng khách sạn "2T Hotel". Nhiệm vụ:
- Hỗ trợ khách tìm khách sạn theo địa điểm, ngân sách, hạng sao, tiện ích.
- Trả lời câu hỏi về chính sách check-in/check-out, thanh toán, khuyến mãi.
- Nói chuyện thân thiện, ngắn gọn bằng tiếng Việt.
- Khi có dữ liệu khách sạn được cung cấp, hãy tóm tắt gợi ý dựa trên dữ liệu đó.
- Không bịa đặt thông tin khách sạn nếu không có dữ liệu.
- Chính sách mặc định: check-in từ 14:00, check-out trước 12:00.
- Thanh toán hỗ trợ: VNPay, MoMo, thanh toán tại quầy.`;

// ─── Helpers ───
const CITY_ALIASES = {
  hanoi: ['ha noi', 'hn'],
  'ho chi minh': ['ho chi minh', 'sai gon', 'hcm', 'hcmc', 'tp hcm', 'tphcm'],
  danang: ['da nang', 'danang'],
  nhatrang: ['nha trang'],
  dalat: ['da lat', 'dalat'],
  haiphong: ['hai phong'],
  cantho: ['can tho'],
};

function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatVnd(value) {
  if (!value || Number.isNaN(Number(value))) return 'Lien he';
  return `${Number(value).toLocaleString('vi-VN')}d`;
}

function extractBudget(message) {
  const normalized = normalizeText(message);
  const millionMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(trieu|m|million)/);
  if (millionMatch) {
    const val = Number(millionMatch[1].replace(',', '.'));
    if (!Number.isNaN(val)) return Math.round(val * 1000000);
  }

  const thousandMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
  if (thousandMatch) {
    const val = Number(thousandMatch[1].replace(',', '.'));
    if (!Number.isNaN(val)) return Math.round(val * 1000);
  }

  const rawNumberMatch = normalized.match(/\b(\d{6,10})\b/);
  if (rawNumberMatch) return Number(rawNumberMatch[1]);

  return null;
}

function extractStars(message) {
  const normalized = normalizeText(message);
  const gteMatch = normalized.match(/tu\s*([1-5])\s*sao/);
  if (gteMatch) return { minStars: Number(gteMatch[1]) };
  const exactMatch = normalized.match(/([1-5])\s*sao/);
  if (exactMatch) return { exactStars: Number(exactMatch[1]) };
  return {};
}

function extractRoomType(message) {
  const normalized = normalizeText(message);
  if (normalized.includes('vip') || normalized.includes('cao cap')) return 'vip';
  if (normalized.includes('basic') || normalized.includes('co ban')) return 'basic';
  if (normalized.includes('standard') || normalized.includes('thuong')) return 'standard';
  return null;
}

function extractGuests(message) {
  const normalized = normalizeText(message);
  const adultsMatch = normalized.match(/(\d+)\s*(nguoi lon|nguoi|khach)/);
  const childrenMatch = normalized.match(/(\d+)\s*(tre em|tre|be)/);

  const adults = adultsMatch ? Number(adultsMatch[1]) : null;
  const children = childrenMatch ? Number(childrenMatch[1]) : null;

  return {
    adults: Number.isFinite(adults) ? adults : null,
    children: Number.isFinite(children) ? children : null,
  };
}

function extractAmenityKeywords(message) {
  const normalized = normalizeText(message);
  const map = [
    { key: 'ho boi', terms: ['ho boi', 'be boi', 'swimming pool'] },
    { key: 'gym', terms: ['gym', 'phong tap'] },
    { key: 'spa', terms: ['spa'] },
    { key: 'wifi', terms: ['wifi', 'wi-fi'] },
    { key: 'parking', terms: ['parking', 'bai do xe'] },
    { key: 'breakfast', terms: ['breakfast', 'an sang'] },
  ];

  return map
    .filter((entry) => entry.terms.some((term) => normalized.includes(term)))
    .map((entry) => entry.key);
}

async function extractCityFromMessage(message) {
  const normalizedMessage = normalizeText(message);
  const cities = await Hotel.distinct('address.city', { isActive: true });
  const normalizedCities = cities
    .filter(Boolean)
    .map((city) => ({ original: city, normalized: normalizeText(city) }))
    .sort((a, b) => b.normalized.length - a.normalized.length);

  const match = normalizedCities.find((city) => normalizedMessage.includes(city.normalized));
  if (match) return match.original;

  for (const city of normalizedCities) {
    const compactCity = city.normalized.replace(/\s+/g, '');
    const aliases = CITY_ALIASES[compactCity] || [];
    if (aliases.some((alias) => normalizedMessage.includes(alias))) {
      return city.original;
    }
  }

  return null;
}

function detectIntent(message) {
  const normalized = normalizeText(message);
  if (/\b(xin chao|chao|hello|hi|hey)\b/.test(normalized)) return 'greeting';
  if (/thanh toan|vnpay|momo|tra tien/.test(normalized)) return 'payment';
  if (/check in|check-in|check out|check-out|gio nhan|gio tra/.test(normalized)) return 'policy';
  if (/khuyen mai|coupon|giam gia/.test(normalized)) return 'promotion';
  return 'search';
}

function computeAmenityScore(hotelAmenities = [], requested = []) {
  if (!requested.length) return 1;
  const normalized = hotelAmenities.map((a) => normalizeText(a));
  const matched = requested.filter((key) => normalized.some((a) => a.includes(key))).length;
  return matched / requested.length;
}

function buildHotelLine(item) {
  const city = item.hotel.address?.city || 'N/A';
  const stars = item.hotel.stars || 0;
  const rating = item.hotel.avgRating ? ` | danh gia ${item.hotel.avgRating.toFixed(1)}/5` : '';
  const roomTypes = [...item.roomTypes].join(', ');
  return `- ${item.hotel.name} (${city}) | ${stars} sao | tu ${formatVnd(item.minPrice)}/dem | ${item.availableRooms} phong trong | loai: ${roomTypes}${rating}`;
}

function buildSearchSummary(criteria, budgetRelaxed) {
  const parts = [];
  if (criteria.city) parts.push(`dia diem ${criteria.city}`);
  if (criteria.budget) parts.push(`ngan sach ~${formatVnd(criteria.budget)}/dem`);
  if (criteria.exactStars) parts.push(`${criteria.exactStars} sao`);
  if (criteria.minStars) parts.push(`tu ${criteria.minStars} sao`);
  if (criteria.roomType) parts.push(`phong ${criteria.roomType}`);
  if (criteria.guests?.adults) parts.push(`${criteria.guests.adults} nguoi lon`);
  if (criteria.guests?.children) parts.push(`${criteria.guests.children} tre em`);
  if (criteria.amenityKeywords?.length) parts.push(`tien ich: ${criteria.amenityKeywords.join(', ')}`);
  const firstLine = parts.length ? `Tieu chi: ${parts.join(' | ')}.` : 'Tieu chi: tim theo du lieu hien co.';
  if (!budgetRelaxed) return firstLine;
  return `${firstLine} Hien khong co phong trong dung ngan sach, minh da mo rong de goi y muc gan nhat.`;
}

async function searchHotelsReply(message, history = []) {
  const recentUserTexts = history
    .filter((m) => m.role === 'user' && typeof m.content === 'string')
    .slice(-4)
    .map((m) => m.content.trim())
    .filter(Boolean);
  const analysisText = [...recentUserTexts, message].join(' ');

  const budget = extractBudget(analysisText);
  const roomType = extractRoomType(analysisText);
  const amenityKeywords = extractAmenityKeywords(analysisText);
  const city = await extractCityFromMessage(analysisText);
  const { minStars, exactStars } = extractStars(analysisText);
  const guests = extractGuests(analysisText);

  const criteria = { budget, roomType, amenityKeywords, city, minStars, exactStars, guests };

  const hotelQuery = { isActive: true };
  if (city) hotelQuery['address.city'] = city;
  if (typeof exactStars === 'number') hotelQuery.stars = exactStars;
  if (typeof minStars === 'number') hotelQuery.stars = { $gte: minStars };

  const hotels = await Hotel.find(hotelQuery)
    .select('name stars avgRating amenities address checkInTime checkOutTime')
    .limit(40)
    .lean();

  if (!hotels.length) {
    return 'Hien chua tim thay khach san phu hop khu vuc ban tim. Ban thu doi dia diem hoac muc sao nhe.';
  }

  const roomQuery = {
    hotel: { $in: hotels.map((h) => h._id) },
    isActive: true,
    status: 'available',
  };
  if (roomType) roomQuery.type = roomType;
  if (budget) roomQuery.pricePerNight = { $lte: Math.round(budget * 1.35) };
  if (guests.adults) roomQuery['capacity.adults'] = { $gte: guests.adults };
  if (guests.children !== null) roomQuery['capacity.children'] = { $gte: guests.children };

  let rooms = await Room.find(roomQuery)
    .select('hotel type pricePerNight status')
    .lean();
  let budgetRelaxed = false;

  if (!rooms.length && budget) {
    const relaxedQuery = { ...roomQuery };
    delete relaxedQuery.pricePerNight;
    rooms = await Room.find(relaxedQuery)
      .select('hotel type pricePerNight status')
      .lean();
    budgetRelaxed = rooms.length > 0;
  }

  if (!rooms.length) {
    return 'Hien khong co phong trong dung bo loc ban vua chon. Ban thu tang ngan sach hoac bo dieu kien loai phong de minh tim lai nhe.';
  }

  const hotelMap = new Map(hotels.map((hotel) => [String(hotel._id), hotel]));
  const agg = new Map();

  rooms.forEach((room) => {
    const key = String(room.hotel);
    const hotel = hotelMap.get(key);
    if (!hotel) return;

    if (!agg.has(key)) {
      agg.set(key, {
        hotel,
        minPrice: room.pricePerNight,
        availableRooms: 0,
        roomTypes: new Set(),
        amenityScore: computeAmenityScore(hotel.amenities, amenityKeywords),
        score: 0,
      });
    }

    const entry = agg.get(key);
    entry.availableRooms += 1;
    entry.minPrice = Math.min(entry.minPrice, room.pricePerNight || 0);
    entry.roomTypes.add(room.type);
  });

  agg.forEach((entry) => {
    let score = 0;
    if (budget && entry.minPrice > 0) {
      const gap = Math.abs(entry.minPrice - budget) / budget;
      score += Math.max(0, 40 - (gap * 40));
    } else {
      score += 10;
    }
    score += (entry.hotel.avgRating || 0) * 8;
    score += (entry.hotel.stars || 0) * 4;
    score += Math.min(entry.availableRooms, 10);
    score += entry.amenityScore * 20;
    if (amenityKeywords.length && entry.amenityScore === 0) score -= 25;
    entry.score = score;
  });

  const ranked = [...agg.values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.minPrice !== b.minPrice) return a.minPrice - b.minPrice;
      return (b.hotel.avgRating || 0) - (a.hotel.avgRating || 0);
    })
    .slice(0, 5);

  const lines = ranked.map(buildHotelLine).join('\n');
  const summary = [
    city ? `Goi y khach san tai ${city}:` : 'Goi y khach san phu hop:',
    buildSearchSummary(criteria, budgetRelaxed),
    '',
    lines,
    '',
    'Ban co the gui them ngay nhan/tra phong va so nguoi de minh loc sat hon.',
  ];

  return summary.join('\n');
}

async function generateReply(message, history = []) {
  const intent = detectIntent(message);

  // Gather DB context for search-related queries
  let dbContext = '';
  if (intent === 'search') {
    try {
      dbContext = await searchHotelsReply(message, history);
    } catch (_) {
      dbContext = '';
    }
  }

  // Build Gemini conversation
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const chatHistory = history
      .filter((m) => m.role && m.content)
      .slice(-10)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const userPrompt = dbContext
      ? `${SYSTEM_PROMPT}\n\nDữ liệu khách sạn tìm được từ hệ thống:\n${dbContext}\n\nTin nhắn khách hàng: ${message}\n\nHãy trả lời dựa trên dữ liệu trên, trình bày gọn đẹp bằng tiếng Việt.`
      : `${SYSTEM_PROMPT}\n\nTin nhắn khách hàng: ${message}\n\nHãy trả lời bằng tiếng Việt, thân thiện và ngắn gọn.`;

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(userPrompt);
    const response = result.response;
    const text = response.text();

    if (text && text.trim().length > 0) {
      return text.trim();
    }
  } catch (err) {
    console.error('[Chatbot] Gemini error:', err.message);
  }

  // Fallback to local responses if Gemini fails
  if (intent === 'greeting') {
    return 'Xin chào! Mình là trợ lý 2T Hotel. Bạn cần tìm khách sạn ở đâu và tầm ngân sách bao nhiêu mỗi đêm?';
  }
  if (intent === 'payment') {
    return '2T Hotel hiện hỗ trợ thanh toán qua VNPay, MoMo hoặc thanh toán tại quầy. Nếu bạn cần, mình có thể hướng dẫn từng bước đặt phòng.';
  }
  if (intent === 'policy') {
    return 'Chính sách mặc định: check-in từ 14:00 và check-out trước 12:00. Một số khách sạn có thể linh động, mình có thể kiểm tra theo tên khách sạn cụ thể cho bạn.';
  }
  if (intent === 'promotion') {
    return 'Hệ thống có áp dụng coupon tùy theo từng thời điểm. Bạn có thể vào trang thanh toán để nhập mã, hoặc gửi mã coupon cho mình để kiểm tra nhanh.';
  }
  if (dbContext) return dbContext;
  return 'Mình có thể hỗ trợ tìm khách sạn theo địa điểm, ngân sách, hạng sao và tiện ích. Bạn cho mình biết nhu cầu cụ thể nhé!';
}

exports.chat = catchAsync(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new AppError('Vui lòng nhập tin nhắn', 400);
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    // Fallback without AI
    const intent = detectIntent(message);
    let reply = 'Mình có thể hỗ trợ tìm khách sạn theo địa điểm, ngân sách, hạng sao và tiện ích. Bạn cho mình biết nhu cầu cụ thể nhé!';
    if (intent === 'search') {
      try { reply = await searchHotelsReply(message.trim(), Array.isArray(history) ? history : []); } catch (_) {}
    } else if (intent === 'greeting') {
      reply = 'Xin chào! Mình là trợ lý 2T Hotel. Bạn cần tìm khách sạn ở đâu?';
    }
    return res.json({ status: 'success', data: { reply } });
  }

  let reply;
  try {
    reply = await generateReply(message.trim(), Array.isArray(history) ? history : []);
  } catch (_error) {
    reply = 'Hệ thống đang bận. Bạn thử mô tả lại nhu cầu ngắn gọn: địa điểm, ngân sách, số người.';
  }

  res.json({
    status: 'success',
    data: { reply },
  });
});