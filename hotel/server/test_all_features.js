const mongoose = require('mongoose');
const http = require('http');
const axios = require('axios');
const app = require('./src/app');
const User = require('./src/models/User');
const Booking = require('./src/models/Booking');
const Review = require('./src/models/Review');
require('dotenv').config();

const PORT = 5656;
const server = http.createServer(app);
const baseUrl = `http://localhost:${PORT}`;

async function runAllTests() {
  console.log('======================================================');
  console.log('   BẮT ĐẦU KIỂM TRA TOÀN BỘ CHỨC NĂNG HỆ THỐNG API    ');
  console.log('======================================================\n');

  // 1. Kết nối MongoDB
  try {
    console.log('🔄 Đang kết nối tới MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Kết nối MongoDB thành công!');
  } catch (err) {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  }

  // 2. Thiết lập dữ liệu kiểm thử (Test Data)
  console.log('🔄 Đang dọn dẹp và chuẩn bị dữ liệu kiểm thử...');
  const testEmail = 'customer@test.com';
  const testPassword = 'customer123';

  // Xóa dữ liệu kiểm thử cũ nếu có
  await User.deleteMany({ email: testEmail });
  await Booking.deleteMany({ guestInfo: { name: 'Customer Test', email: testEmail } });
  
  // Tạo tài khoản Customer mới phục vụ kiểm thử
  const customerUser = await User.create({
    name: 'Customer Test',
    email: testEmail,
    password: testPassword,
    phone: '0987654321',
    isEmailVerified: true,
    role: 'customer'
  });
  console.log(`✅ Đã tạo tài khoản khách hàng kiểm thử: ${testEmail}`);

  // Tìm tài khoản Admin có sẵn trong DB
  const adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    console.error('❌ Không tìm thấy tài khoản Admin nào trong hệ thống! Vui lòng chạy npm run seed trước.');
    await mongoose.disconnect();
    process.exit(1);
  }
  const adminEmail = adminUser.email;
  console.log(`✅ Tìm thấy tài khoản Admin trong DB: ${adminEmail}`);

  // 3. Khởi động Server
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✅ Khởi động Server thành công trên cổng ${PORT}!\n`);

  const results = [];
  function logResult(feature, passed, details = '') {
    const status = passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`${status} ${feature}`);
    if (details) console.log(`   👉 Chi tiết: ${details}`);
    results.push({ feature, passed, details });
  }

  try {
    // ----------------------------------------------------
    // Chức năng 1: Health check
    // ----------------------------------------------------
    try {
      const res = await axios.get(`${baseUrl}/health`);
      logResult('Health Check /health', res.status === 200, `Uptime: ${res.data.uptime}`);
    } catch (e) {
      logResult('Health Check /health', false, e.message);
    }

    // ----------------------------------------------------
    // Chức năng 2: Đăng nhập khách hàng
    // ----------------------------------------------------
    let customerToken = '';
    try {
      const res = await axios.post(`${baseUrl}/api/v1/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      customerToken = res.data.data.accessToken;
      logResult('Đăng nhập khách hàng (Customer Login)', !!customerToken, 'Lấy token thành công');
    } catch (e) {
      logResult('Đăng nhập khách hàng (Customer Login)', false, e.message);
    }

    // ----------------------------------------------------
    // Chức năng 3: Đăng nhập quản trị viên (Admin Login)
    // ----------------------------------------------------
    let adminToken = '';
    try {
      const res = await axios.post(`${baseUrl}/api/v1/auth/login`, {
        email: adminEmail,
        password: 'admin123'
      });
      adminToken = res.data.data.accessToken;
      logResult('Đăng nhập Admin (Admin Login)', !!adminToken, 'Lấy token admin thành công');
    } catch (e) {
      logResult('Đăng nhập Admin (Admin Login)', false, e.message);
    }

    // ----------------------------------------------------
    // Chức năng 4: Lấy danh sách khách sạn (Public)
    // ----------------------------------------------------
    let testHotel = null;
    try {
      const res = await axios.get(`${baseUrl}/api/v1/hotels`);
      const hotels = res.data.data.hotels;
      testHotel = hotels && hotels[0];
      logResult('Lấy danh sách khách sạn', res.status === 200 && hotels.length > 0, `Tìm thấy ${hotels.length} khách sạn. Khách sạn đầu tiên: ${testHotel ? testHotel.name : 'N/A'}`);
    } catch (e) {
      logResult('Lấy danh sách khách sạn', false, e.message);
    }

    // ----------------------------------------------------
    // Chức năng 5: Lấy thông tin chi tiết khách sạn (Slug)
    // ----------------------------------------------------
    if (testHotel) {
      try {
        const res = await axios.get(`${baseUrl}/api/v1/hotels/${testHotel.slug}`);
        logResult(`Chi tiết khách sạn (${testHotel.slug})`, res.status === 200 && res.data.data.hotel.name === testHotel.name);
      } catch (e) {
        logResult(`Chi tiết khách sạn (${testHotel.slug})`, false, e.message);
      }
    }

    // ----------------------------------------------------
    // Chức năng 6: Lấy phòng trống theo điều kiện (Public)
    // ----------------------------------------------------
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 2); // ở 2 đêm
    const checkInStr = today.toISOString().split('T')[0];
    const checkOutStr = tomorrow.toISOString().split('T')[0];

    let testRoom = null;
    if (testHotel) {
      try {
        const res = await axios.get(`${baseUrl}/api/v1/rooms/available`, {
          params: {
            hotelId: testHotel._id,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            adults: 1,
            children: 0
          }
        });
        const rooms = res.data.data.rooms;
        testRoom = rooms && rooms[0];
        logResult('Kiểm tra và tìm phòng trống (Available Rooms)', res.status === 200 && rooms.length > 0, `Tìm thấy ${rooms.length} phòng trống. Phòng chọn thử: ${testRoom ? testRoom.roomNumber : 'N/A'}`);
      } catch (e) {
        logResult('Kiểm tra và tìm phòng trống (Available Rooms)', false, e.message);
      }
    }

    // ----------------------------------------------------
    // Chức năng 7: Tính giá dự kiến (Dynamic Pricing Quote)
    // ----------------------------------------------------
    if (testRoom) {
      try {
        const res = await axios.get(`${baseUrl}/api/v1/rooms/quote`, {
          params: {
            roomId: testRoom._id,
            checkIn: checkInStr,
            checkOut: checkOutStr
          }
        });
        logResult('Tính giá dự phòng (Room Price Quote)', res.status === 200 && res.data.data.roomTotal > 0, `Tổng tiền ước tính: ${res.data.data.roomTotal.toLocaleString()} VND cho ${res.data.data.nights} đêm`);
      } catch (e) {
        logResult('Tính giá dự phòng (Room Price Quote)', false, e.message);
      }
    }

    // ----------------------------------------------------
    // Chức năng 8: Tạo đơn đặt phòng mới (Customer Booking)
    // ----------------------------------------------------
    let createdBooking = null;
    if (testRoom && customerToken) {
      try {
        const res = await axios.post(`${baseUrl}/api/v1/bookings`, {
          roomId: testRoom._id,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          guests: { adults: 1, children: 0 },
          guestInfo: {
            name: 'Customer Test',
            email: testEmail,
            phone: '0987654321',
            idCard: '123456789'
          }
        }, {
          headers: { Authorization: `Bearer ${customerToken}` }
        });
        createdBooking = res.data.data.booking;
        logResult('Tạo đơn đặt phòng (Create Booking)', res.status === 201 && !!createdBooking, `Mã đơn đặt phòng: ${createdBooking ? createdBooking.bookingCode : 'N/A'}`);
      } catch (e) {
        logResult('Tạo đơn đặt phòng (Create Booking)', false, e.response ? JSON.stringify(e.response.data) : e.message);
      }
    }

    // ----------------------------------------------------
    // Chức năng 9: Tạo cổng thanh toán (Payment Intent)
    // ----------------------------------------------------
    if (createdBooking && customerToken) {
      try {
        const res = await axios.post(`${baseUrl}/api/v1/payments/create-intent`, {
          bookingId: createdBooking._id,
          method: 'cash' // Dùng hình thức thanh toán tiền mặt để dễ mô phỏng
        }, {
          headers: { Authorization: `Bearer ${customerToken}` }
        });
        logResult('Tạo yêu cầu thanh toán (Create Payment Intent)', res.status === 200 && res.data.status === 'success', `Phương thức: cash, Số tiền: ${res.data.data.amount.toLocaleString()} VND`);
      } catch (e) {
        logResult('Tạo yêu cầu thanh toán (Create Payment Intent)', false, e.response ? JSON.stringify(e.response.data) : e.message);
      }
    }

    // ----------------------------------------------------
    // Chức năng 10: Xem lịch sử đặt phòng cá nhân (My Bookings)
    // ----------------------------------------------------
    if (customerToken) {
      try {
        const res = await axios.get(`${baseUrl}/api/v1/bookings/my-bookings`, {
          headers: { Authorization: `Bearer ${customerToken}` }
        });
        const myBookings = res.data.data.bookings;
        logResult('Xem lịch sử đặt phòng (My Bookings)', res.status === 200 && myBookings.length > 0, `Đã tìm thấy ${myBookings.length} đơn đặt phòng của tôi.`);
      } catch (e) {
        logResult('Xem lịch sử đặt phòng (My Bookings)', false, e.message);
      }
    }

    // ----------------------------------------------------
    // Chức năng 11: Đăng đánh giá khách sạn (Write Review)
    // ----------------------------------------------------
    if (testHotel && createdBooking && customerToken) {
      try {
        // Cập nhật trạng thái Booking thành checked_out trực tiếp trong DB để được phép đánh giá
        await Booking.findByIdAndUpdate(createdBooking._id, { status: 'checked_out' });

        const res = await axios.post(`${baseUrl}/api/v1/reviews`, {
          hotel: testHotel._id,
          room: testRoom._id,
          booking: createdBooking._id,
          rating: 5,
          title: 'Tuyệt vời',
          comment: 'Khách sạn rất đẹp, phục vụ tận tình, sẽ quay lại lần sau!',
          cleanliness: 5,
          service: 5,
          location: 5,
          value: 5
        }, {
          headers: { Authorization: `Bearer ${customerToken}` }
        });
        logResult('Đăng đánh giá khách sạn (Submit Review)', res.status === 201 && res.data.status === 'success');
      } catch (e) {
        logResult('Đăng đánh giá khách sạn (Submit Review)', false, e.response ? JSON.stringify(e.response.data) : e.message);
      }
    }

    // ----------------------------------------------------
    // Chức năng 12: Xem thống kê tổng quan của Admin (Admin Dashboard)
    // ----------------------------------------------------
    if (adminToken) {
      try {
        const res = await axios.get(`${baseUrl}/api/v1/admin/dashboard`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        logResult('Trang tổng quan Admin (Admin Dashboard)', res.status === 200 && !!res.data.data, `Tổng số khách sạn: ${res.data.data.stats?.hotels || 0}, Đơn đặt phòng: ${res.data.data.stats?.bookings || 0}`);
      } catch (e) {
        logResult('Trang tổng quan Admin (Admin Dashboard)', false, e.message);
      }
    }

    // ----------------------------------------------------
    // Chức năng 13: Thống kê doanh thu theo thời gian (Revenue Analytics)
    // ----------------------------------------------------
    if (adminToken) {
      try {
        const res = await axios.get(`${baseUrl}/api/v1/admin/analytics/revenue?period=month`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        logResult('Thống kê doanh thu (Revenue Analytics)', res.status === 200 && Array.isArray(res.data.data.revenue));
      } catch (e) {
        logResult('Thống kê doanh thu (Revenue Analytics)', false, e.message);
      }
    }

    // ----------------------------------------------------
    // Chức năng 14: Lấy file hóa đơn PDF (Invoice PDF)
    // ----------------------------------------------------
    if (createdBooking && customerToken) {
      try {
        const res = await axios.get(`${baseUrl}/api/v1/bookings/${createdBooking._id}/invoice`, {
          headers: { Authorization: `Bearer ${customerToken}` },
          responseType: 'arraybuffer'
        });
        logResult('Tải hóa đơn PDF (Invoice PDF)', res.status === 200 && res.headers['content-type'] === 'application/pdf', `Hóa đơn PDF nhận được dung lượng ${res.data.byteLength} bytes`);
      } catch (e) {
        logResult('Tải hóa đơn PDF (Invoice PDF)', false, e.message);
      }
    }

    // ----------------------------------------------------
    // Chức năng 15: Xuất báo cáo Excel của Admin (Excel Export)
    // ----------------------------------------------------
    if (adminToken) {
      try {
        const res = await axios.get(`${baseUrl}/api/v1/admin/reports/export?type=excel`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          responseType: 'arraybuffer'
        });
        logResult('Xuất báo cáo Excel (Excel Report Export)', res.status === 200 && res.data.byteLength > 0, `File Excel nhận được dung lượng ${res.data.byteLength} bytes`);
      } catch (e) {
        logResult('Xuất báo cáo Excel (Excel Report Export)', false, e.message);
      }
    }

  } catch (globalError) {
    console.error('❌ Lỗi hệ thống trong lúc test:', globalError.message);
  } finally {
    // 4. Dọn dẹp dữ liệu sau kiểm thử
    console.log('\n🔄 Đang dọn dẹp dữ liệu kiểm thử...');
    try {
      if (testEmail) {
        const user = await User.findOne({ email: testEmail });
        if (user) {
          await Booking.deleteMany({ customer: user._id });
          await Review.deleteMany({ customer: user._id });
          await User.findByIdAndDelete(user._id);
        }
      }
      console.log('✅ Đã dọn dẹp dữ liệu kiểm thử hoàn tất!');
    } catch (cleanupError) {
      console.error('⚠️ Lỗi khi dọn dẹp dữ liệu kiểm thử:', cleanupError.message);
    }

    // Đóng server
    server.close();
    await mongoose.disconnect();
    console.log('✅ Đã đóng server và ngắt kết nối DB.');

    // 5. Kết quả tổng kết
    console.log('\n======================================================');
    console.log('                 TỔNG KẾT KIỂM THỬ                    ');
    console.log('======================================================');
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    console.log(`Tổng số chức năng test: ${total}`);
    console.log(`Đạt yêu cầu (Passed) : ${passed}`);
    console.log(`Không đạt (Failed)   : ${failed}`);
    console.log('======================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAllTests();
