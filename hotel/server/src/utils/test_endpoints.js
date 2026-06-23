const axios = require('axios');
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');


dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = require('../app');
const connectDB = require('../config/db');

const PORT = 5055;

(async () => {
  console.log('--- STARTING FUNCTIONAL TESTS ---');
  console.log('1. Connecting to database...');
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB successfully.');
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1);
  }

  const server = http.createServer(app);
  server.listen(PORT, async () => {
    console.log(`2. Test server running on http://localhost:${PORT}`);
    const client = axios.create({ baseURL: `http://localhost:${PORT}` });

    const testRoutes = [
      { name: 'Health check', url: '/health' },
      { name: 'Public Hotels List', url: '/api/v1/hotels?limit=2' },
      { name: 'Public Banners List', url: '/api/v1/banners' },
      { name: 'Public Articles List', url: '/api/v1/articles' }
    ];

    let allPass = true;

    for (const test of testRoutes) {
      try {
        console.log(`⏳ Testing: ${test.name} (${test.url})...`);
        const res = await client.get(test.url);
        if (res.status === 200) {
          console.log(`   🟢 PASSED: Status 200 OK`);
        } else {
          console.log(`   🔴 FAILED: Status ${res.status}`);
          allPass = false;
        }
      } catch (err) {
        console.log(`   🔴 FAILED: ${err.message}`);
        if (err.response) {
          console.log(`      Response status: ${err.response.status}`);
          console.log(`      Response data:`, err.response.data);
        }
        allPass = false;
      }
    }

    console.log('3. Shutting down test server...');
    server.close(() => {
      console.log('✅ Test server stopped.');
      console.log('--- TEST RESULTS ---');
      if (allPass) {
        console.log('🎉 ALL FUNCTIONAL ENDPOINTS ARE RESPONDING CORRECTLY!');
        process.exit(0);
      } else {
        console.log('❌ SOME FUNCTIONAL TESTS FAILED.');
        process.exit(1);
      }
    });
  });
})();
