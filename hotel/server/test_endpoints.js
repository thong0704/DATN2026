const mongoose = require('mongoose');
const http = require('http');
const app = require('./src/app');
require('dotenv').config();

const PORT = 5555;
const server = http.createServer(app);

async function runTests() {
  console.log('Bắt đầu quy trình kiểm tra API tự động...');
  
  // 1. Kiểm tra kết nối MongoDB
  try {
    console.log('1. Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Kết nối DB thành công!');
  } catch (err) {
    console.error('❌ Lỗi kết nối DB. Chắc chắn rằng MongoDB đang chạy trên máy của bạn:', err.message);
    process.exit(1);
  }

  // 2. Khởi động Server
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✅ Khởi động Server thành công trên port ${PORT}!`);

  const baseUrl = `http://localhost:${PORT}`;
  let passed = 0;
  let failed = 0;

  async function testEndpoint(name, url, expectedStatus = 200) {
    return new Promise((resolve) => {
      http.get(`${baseUrl}${url}`, (res) => {
        if (res.statusCode === expectedStatus || (expectedStatus === 200 && res.statusCode < 400)) {
          console.log(`✅ [PASS] ${name} (${url}) -> HTTP ${res.statusCode}`);
          passed++;
        } else {
          console.error(`❌ [FAIL] ${name} (${url}) -> Expected ${expectedStatus}, got HTTP ${res.statusCode}`);
          failed++;
        }
        resolve();
      }).on('error', (err) => {
        console.error(`❌ [FAIL] ${name} (${url}) -> Lỗi hệ thống:`, err.message);
        failed++;
        resolve();
      });
    });
  }

  // 3. Gọi một số API cơ bản
  console.log('\nTiến hành gọi thử các API:');
  await testEndpoint('Health Check', '/health');
  await testEndpoint('Lấy danh sách khách sạn', '/api/v1/hotels');
  await testEndpoint('Lấy danh sách bài viết', '/api/v1/articles');
  await testEndpoint('Lấy danh sách phòng (nếu có)', '/api/v1/rooms?hotel=any');
  // API không hợp lệ để test 404
  await testEndpoint('Test route không tồn tại (404)', '/api/v1/invalid-route', 404);

  console.log('\n--- TỔNG KẾT ---');
  console.log(`Passed: ${passed}, Failed: ${failed}`);

  // Đóng kết nối để thoát script
  server.close();
  await mongoose.disconnect();
  console.log('Đã đóng server và kết nối DB an toàn.');
}

runTests();
