const { GoogleGenerativeAI } = require('@google/generative-ai');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { filterAvailableRooms } = require('../services/availabilityService');

// ─── Gemini AI Setup ───
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `Bạn là trợ lý Concierge chuyên nghiệp và sang trọng của chuỗi khách sạn boutique "2T Hotel".
Nhiệm vụ và hướng dẫn ứng xử:
1. LUÔN THÂN THIỆN, LỊCH SỰ, CHUYÊN NGHIỆP: Xưng hô lễ phép, chu đáo (ví dụ: "Dạ, 2T Hotel xin chào anh/chị...", "Em có thể giúp gì thêm cho anh/chị ạ?").
2. TRẢ LỜI CHÍNH XÁC DỰA TRÊN DỮ LIỆU: Chỉ tư vấn các khách sạn, địa chỉ, tiện ích và giá cả dựa trên DANH SÁCH KHÁCH SẠN HỆ THỐNG được cung cấp bên dưới. Không được tự ý bịa đặt thông tin khách sạn hoặc dịch vụ không tồn tại.
3. TƯ VẤN ĐẶT PHÒNG THÔNG MINH:
   - Nếu khách tìm phòng, hãy tham khảo DỮ LIỆU PHÒNG TRỐNG HIỆN TẠI để báo loại phòng và giá chính xác nhất.
   - Nếu không tìm thấy phòng trống đúng yêu cầu (ví dụ: hết phòng ở mức giá đó hoặc ở thành phố đó), hãy lịch sự thông báo và chủ động gợi ý khách chọn hạng phòng khác, ngày khác, hoặc giới thiệu khách sạn khác cùng chuỗi.
4. THÔNG TIN CHUNG:
   - Thời gian nhận phòng (Check-in): từ 14:00 | Trả phòng (Check-out): trước 12:00 (nếu khách sạn cụ thể có chính sách riêng, ưu tiên báo theo khách sạn đó).
   - Hỗ trợ thanh toán: VNPay, Ví MoMo, Thẻ quốc tế, hoặc Thanh toán trực tiếp khi nhận phòng (đơn hàng sẽ ở trạng thái Chờ xử lý cho đến khi thanh toán).
5. TRÌNH BÀY ĐẸP MẮT: Sử dụng Markdown (in đậm, danh sách), phân tách rõ ràng và chèn thêm các biểu tượng cảm xúc (emoji) phù hợp để câu trả lời thêm sinh động, dễ đọc.`;

async function getHotelsDirectory() {
  try {
    const hotels = await Hotel.find({ isActive: true })
      .select('name stars address amenities checkInTime checkOutTime policies description avgRating basePrice')
      .lean();
    if (!hotels || hotels.length === 0) return '';
    return hotels.map((h) => {
      const addr = `${h.address?.street || ''}, ${h.address?.city || ''}`;
      const amenities = h.amenities?.length ? h.amenities.join(', ') : 'Không có';
      return `### KHÁCH SẠN: ${h.name}
- Hạng sao: ${h.stars}⭐
- Đánh giá: ${h.avgRating ? `${h.avgRating.toFixed(1)}/5` : 'Chưa có đánh giá'}
- Địa chỉ: ${addr}
- Giờ check-in: ${h.checkInTime || '14:00'} | Giờ check-out: ${h.checkOutTime || '12:00'}
- Tiện ích nổi bật: ${amenities}
- Giá phòng tham khảo chỉ từ: ${h.basePrice ? formatVnd(h.basePrice) : 'Liên hệ'}/đêm
- Mô tả: ${h.description || 'Không có mô tả'}
- Chính sách riêng: ${h.policies || 'Theo chính sách chung của hệ thống'}`;
    }).join('\n---\n');
  } catch (err) {
    return '';
  }
}

// ─── Helpers ───
function extractDates(message) {
  const normalized = normalizeText(message);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDate = now.getDate();

  let checkIn = null;
  let checkOut = null;

  // Helper to construct a Date object for a day of a month
  const getDateObj = (day, month = null, year = null) => {
    let y = year || currentYear;
    let m = month !== null ? month - 1 : currentMonth; // month is 1-indexed in input
    let d = day;

    let date = new Date(y, m, d, 14, 0, 0, 0); // Check-in at 14:00
    if (month === null && year === null) {
      // If only day is provided, and it has already passed, assume next month
      if (date < now) {
        date.setMonth(date.getMonth() + 1);
      }
    }
    return date;
  };

  // 1. Check relative dates
  if (normalized.includes('hom nay')) {
    checkIn = new Date(currentYear, currentMonth, currentDate, 14, 0, 0, 0);
    checkOut = new Date(currentYear, currentMonth, currentDate + 1, 12, 0, 0, 0);
    return { checkIn, checkOut };
  }
  if (normalized.includes('hom mai') || normalized.includes('ngay mai')) {
    checkIn = new Date(currentYear, currentMonth, currentDate + 1, 14, 0, 0, 0);
    checkOut = new Date(currentYear, currentMonth, currentDate + 2, 12, 0, 0, 0);
    return { checkIn, checkOut };
  }
  if (normalized.includes('ngay kia') || normalized.includes('ngay mot')) {
    checkIn = new Date(currentYear, currentMonth, currentDate + 2, 14, 0, 0, 0);
    checkOut = new Date(currentYear, currentMonth, currentDate + 3, 12, 0, 0, 0);
    return { checkIn, checkOut };
  }

  // 2. Patterns
  // Pattern 2.1: "tu ngày D1/M1 den ngày D2/M2" or "từ D1/M1 đến D2/M2"
  const rangeSlashRegex = /(?:tu\s+)?(?:ngay\s+)?(\d{1,2})[\/\-](\d{1,2})(?:\s+[dđ]en\s+|\s*(?:-|va)\s+)(?:ngay\s+)?(\d{1,2})[\/\-](\d{1,2})/;
  const matchSlash = normalized.match(rangeSlashRegex);
  if (matchSlash) {
    const d1 = parseInt(matchSlash[1], 10);
    const m1 = parseInt(matchSlash[2], 10);
    const d2 = parseInt(matchSlash[3], 10);
    const m2 = parseInt(matchSlash[4], 10);
    checkIn = getDateObj(d1, m1);
    checkOut = getDateObj(d2, m2);
    checkOut.setHours(12, 0, 0, 0);
    return { checkIn, checkOut };
  }

  // Pattern 2.2: "tu ngày D1 den ngày D2 thang M" or "từ D1 đến D2 tháng M"
  const rangeMonthRegex = /(?:tu\s+)?(?:ngay\s+)?(\d{1,2})\s*(?:[dđ]en|va|-)\s*(?:ngay\s+)?(\d{1,2})\s+(?:thang|thg|\/)\s*(\d{1,2})/;
  const matchRangeMonth = normalized.match(rangeMonthRegex);
  if (matchRangeMonth) {
    const d1 = parseInt(matchRangeMonth[1], 10);
    const d2 = parseInt(matchRangeMonth[2], 10);
    const m = parseInt(matchRangeMonth[3], 10);
    checkIn = getDateObj(d1, m);
    checkOut = getDateObj(d2, m);
    checkOut.setHours(12, 0, 0, 0);
    return { checkIn, checkOut };
  }

  // Pattern 2.3: "tu ngay D1 den ngay D2" / "tu D1 den D2" / "ngay D1 den D2"
  const rangePlainRegex = /(?:tu\s+)?(?:ngay\s+)?(\d{1,2})\s+[dđ]en\s+(?:ngay\s+)?(\d{1,2})/;
  const matchRangePlain = normalized.match(rangePlainRegex);
  if (matchRangePlain) {
    const d1 = parseInt(matchRangePlain[1], 10);
    const d2 = parseInt(matchRangePlain[2], 10);
    checkIn = getDateObj(d1);
    checkOut = getDateObj(d2);
    if (checkOut < checkIn) {
      checkOut.setMonth(checkOut.getMonth() + 1);
    }
    checkOut.setHours(12, 0, 0, 0);
    return { checkIn, checkOut };
  }

  // Pattern 2.4: "ngay D1 va D2" / "ngay D1, D2" (Stays on day D1 and day D2, checking out on D2 + 1)
  const checkInAndOutRegex = /(?:ngay\s+)?(\d{1,2})\s*(?:va|,|-)\s*(\d{1,2})/;
  const matchAnd = normalized.match(checkInAndOutRegex);
  if (matchAnd) {
    const d1 = parseInt(matchAnd[1], 10);
    const d2 = parseInt(matchAnd[2], 10);
    if (d2 > d1 && d2 - d1 <= 5) {
      checkIn = getDateObj(d1);
      checkOut = getDateObj(d2 + 1);
      if (checkOut < checkIn) {
        checkOut.setMonth(checkOut.getMonth() + 1);
      }
      checkOut.setHours(12, 0, 0, 0);
      return { checkIn, checkOut };
    } else if (d2 > d1) {
      checkIn = getDateObj(d1);
      checkOut = getDateObj(d2);
      if (checkOut < checkIn) {
        checkOut.setMonth(checkOut.getMonth() + 1);
      }
      checkOut.setHours(12, 0, 0, 0);
      return { checkIn, checkOut };
    }
  }

  // Pattern 2.5: single day "ngay D/M" or "ngày D tháng M"
  const singleDayMonthRegex = /(?:ngay\s+)?(\d{1,2})[\/\-](?:\s*)(\d{1,2})|(?:ngay\s+)?(\d{1,2})\s+thang\s+(\d{1,2})/;
  const matchSingleMonth = normalized.match(singleDayMonthRegex);
  if (matchSingleMonth) {
    const d = parseInt(matchSingleMonth[1] || matchSingleMonth[3], 10);
    const m = parseInt(matchSingleMonth[2] || matchSingleMonth[4], 10);
    checkIn = getDateObj(d, m);
    checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 1);
    checkOut.setHours(12, 0, 0, 0);
    return { checkIn, checkOut };
  }

  // Pattern 2.6: single day "ngay D"
  const singleDayRegex = /(?:ngay\s+)(\d{1,2})/;
  const matchSingle = normalized.match(singleDayRegex);
  if (matchSingle) {
    const d = parseInt(matchSingle[1], 10);
    checkIn = getDateObj(d);
    checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 1);
    checkOut.setHours(12, 0, 0, 0);
    return { checkIn, checkOut };
  }

  return { checkIn: null, checkOut: null };
}

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
  const rating = item.hotel.avgRating ? ` | Đánh giá ${item.hotel.avgRating.toFixed(1)}/5` : '';
  const roomTypes = [...item.roomTypes].join(', ');
  return `🏢 **${item.hotel.name}** (${city})\n   - Hạng: ${stars} sao ⭐\n   - Giá chỉ từ: **${formatVnd(item.minPrice)}**/đêm\n   - Số phòng trống: ${item.availableRooms} phòng\n   - Loại phòng: ${roomTypes}${rating}`;
}

function buildSearchSummary(criteria, budgetRelaxed) {
  const parts = [];
  if (criteria.city) parts.push(`Địa điểm: **${criteria.city}**`);
  if (criteria.checkIn && criteria.checkOut) {
    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };
    parts.push(`Ngày: **${formatDate(criteria.checkIn)} - ${formatDate(criteria.checkOut)}**`);
  }
  if (criteria.budget) parts.push(`Ngân sách: ~**${formatVnd(criteria.budget)}**/đêm`);
  if (criteria.exactStars) parts.push(`Hạng sao: **${criteria.exactStars}⭐**`);
  if (criteria.minStars) parts.push(`Hạng sao từ: **${criteria.minStars}⭐**`);
  if (criteria.roomType) parts.push(`Hạng phòng: **${criteria.roomType.toUpperCase()}**`);
  
  const guestParts = [];
  if (criteria.guests?.adults) guestParts.push(`${criteria.guests.adults} người lớn`);
  if (criteria.guests?.children) guestParts.push(`${criteria.guests.children} trẻ em`);
  if (guestParts.length) parts.push(`Số khách: **${guestParts.join(', ')}**`);

  if (criteria.amenityKeywords?.length) parts.push(`Tiện ích: **${criteria.amenityKeywords.join(', ')}**`);
  
  const firstLine = parts.length ? `🔍 **Tiêu chí tìm kiếm:** ${parts.join(' | ')}.` : '🔍 **Tiêu chí:** Tìm kiếm phòng trống hiện có.';
  if (!budgetRelaxed) return firstLine;
  return `${firstLine}\n⚠️ *Hiện không có phòng đúng ngân sách, hệ thống đã đề xuất mức giá gần nhất.*`;
}

function suggestNextStep(criteria) {
  const hasDates = criteria.checkIn && criteria.checkOut;
  const hasGuests = criteria.guests?.adults;
  
  if (!hasDates && !hasGuests) {
    return '💡 Bạn có thể gửi thêm **ngày nhận/trả phòng** và **số khách** (ví dụ: "ngày 11 và 12, 2 người") để mình lọc chính xác hơn nhé.';
  }
  if (!hasDates) {
    return '💡 Bạn có thể gửi thêm **ngày nhận/trả phòng** (ví dụ: "từ ngày 11 đến ngày 13") để mình lọc chính xác hơn nhé.';
  }
  if (!hasGuests) {
    return '💡 Bạn có thể gửi thêm **số khách** (ví dụ: "cho 2 người lớn và 1 trẻ em") để mình kiểm tra tình trạng phòng trống nhé.';
  }
  return '✨ Tất cả tiêu chí đã đầy đủ! Bạn có thể chọn phòng phù hợp phía trên và click vào liên kết khách sạn để tiến hành đặt phòng nhanh chóng nhé. 😊';
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
  const { checkIn, checkOut } = extractDates(analysisText);

  const criteria = { budget, roomType, amenityKeywords, city, minStars, exactStars, guests, checkIn, checkOut };

  const hotelQuery = { isActive: true };
  if (city) hotelQuery['address.city'] = city;
  if (typeof exactStars === 'number') hotelQuery.stars = exactStars;
  if (typeof minStars === 'number') hotelQuery.stars = { $gte: minStars };

  const hotels = await Hotel.find(hotelQuery)
    .select('name stars avgRating amenities address checkInTime checkOutTime')
    .limit(40)
    .lean();

  if (!hotels.length) {
    return 'Hiện chưa tìm thấy khách sạn phù hợp khu vực bạn tìm. Bạn thử đổi địa điểm hoặc mức sao nhé.';
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

  if (checkIn && checkOut && rooms.length > 0) {
    const availableIds = await filterAvailableRooms({
      roomIds: rooms.map((r) => r._id),
      checkIn,
      checkOut,
    });
    const idSet = new Set(availableIds.map(String));
    rooms = rooms.filter((r) => idSet.has(String(r._id)));
  }

  let budgetRelaxed = false;

  if (!rooms.length && budget) {
    const relaxedQuery = { ...roomQuery };
    delete relaxedQuery.pricePerNight;
    rooms = await Room.find(relaxedQuery)
      .select('hotel type pricePerNight status')
      .lean();
    if (checkIn && checkOut && rooms.length > 0) {
      const availableIds = await filterAvailableRooms({
        roomIds: rooms.map((r) => r._id),
        checkIn,
        checkOut,
      });
      const idSet = new Set(availableIds.map(String));
      rooms = rooms.filter((r) => idSet.has(String(r._id)));
    }
    budgetRelaxed = rooms.length > 0;
  }

  if (!rooms.length) {
    return 'Hiện không có phòng trống đúng bộ lọc bạn vừa chọn. Bạn thử tăng ngân sách hoặc bỏ điều kiện loại phòng để mình tìm lại nhé.';
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
    city ? `🏢 **Gợi ý khách sạn tại ${city}:**` : '🏢 **Gợi ý khách sạn phù hợp:**',
    buildSearchSummary(criteria, budgetRelaxed),
    '',
    lines,
    '',
    suggestNextStep(criteria)
  ];

  return summary.join('\n');
}

async function generateReply(message, history = []) {
  const intent = detectIntent(message);

  // 1. Get static hotel directory
  const directoryContext = await getHotelsDirectory();

  // 2. Get live vacant rooms context if the intent is search
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
    const systemPromptWithContext = `${SYSTEM_PROMPT}

DANH SÁCH KHÁCH SẠN HỆ THỐNG (DỮ LIỆU CHÍNH THỨC):
${directoryContext || 'Chưa có thông tin khách sạn nào được đăng ký.'}

${dbContext ? `DỮ LIỆU PHÒNG TRỐNG HIỆN TẠI (Dành cho việc đặt phòng): \n${dbContext}\n` : ''}`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: systemPromptWithContext
    });

    const chatHistory = history
      .filter((m) => m.role && m.content)
      .slice(-10)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
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