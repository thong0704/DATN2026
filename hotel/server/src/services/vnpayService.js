const crypto = require('crypto');
const qs = require('qs');

const VNP_TMN_CODE = process.env.VNPAY_TMN_CODE || 'CGXZLS0Z';
const VNP_HASH_SECRET = process.env.VNPAY_HASH_SECRET || 'KQINPFAZ2S95FVAWJVIWBHKXNSFYPQXB';
const VNP_URL = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_RETURN_URL = process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/vnpay-return';

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj).sort().forEach((key) => {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  });
  return sorted;
}

function formatDate(date) {
  const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const y = vnDate.getUTCFullYear();
  const m = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(vnDate.getUTCDate()).padStart(2, '0');
  const h = String(vnDate.getUTCHours()).padStart(2, '0');
  const min = String(vnDate.getUTCMinutes()).padStart(2, '0');
  const s = String(vnDate.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}${s}`;
}

exports.createPaymentUrl = ({ amount, bookingCode, bookingId, ipAddr = '127.0.0.1' }) => {
  const date = new Date();
  const createDate = formatDate(date);
  const orderId = createDate + bookingCode.slice(-4);

  let vnpParams = {};
  vnpParams['vnp_Version'] = '2.1.0';
  vnpParams['vnp_Command'] = 'pay';
  vnpParams['vnp_TmnCode'] = VNP_TMN_CODE;
  vnpParams['vnp_Locale'] = 'vn';
  vnpParams['vnp_CurrCode'] = 'VND';
  vnpParams['vnp_TxnRef'] = orderId;
  vnpParams['vnp_OrderInfo'] = 'Thanh toan dat phong ' + bookingCode;
  vnpParams['vnp_OrderType'] = 'other';
  vnpParams['vnp_Amount'] = String(Math.round(amount * 100));
  vnpParams['vnp_ReturnUrl'] = VNP_RETURN_URL;
  vnpParams['vnp_IpAddr'] = ipAddr;
  vnpParams['vnp_CreateDate'] = createDate;

  vnpParams = sortObject(vnpParams);

  const signData = Object.keys(vnpParams).map(key => `${key}=${vnpParams[key]}`).join('&');
  const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnpParams['vnp_SecureHash'] = signed;

  const paymentUrl = VNP_URL + '?' + Object.keys(vnpParams).map(key => `${key}=${vnpParams[key]}`).join('&');
  return { paymentUrl, orderId };
};

exports.verifyReturnUrl = (query) => {
  const vnpParams = { ...query };
  const secureHash = vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];

  const sorted = sortObject(vnpParams);
  const signData = Object.keys(sorted).map(key => `${key}=${sorted[key]}`).join('&');
  const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  if (secureHash === signed) {
    return { isValid: true, responseCode: vnpParams['vnp_ResponseCode'], txnRef: vnpParams['vnp_TxnRef'] };
  }
  return { isValid: false };
};
