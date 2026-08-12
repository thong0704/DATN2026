const crypto = require('crypto');
const axios = require('axios');

const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
const MOMO_RETURN_URL = (process.env.MOMO_RETURN_URL && !process.env.MOMO_RETURN_URL.includes('localhost'))
  ? process.env.MOMO_RETURN_URL
  : (process.env.CLIENT_URL ? `${process.env.CLIENT_URL.replace(/\/$/, '')}/payment/momo-return` : 'http://localhost:5173/payment/momo-return');
const MOMO_IPN_URL = process.env.MOMO_IPN_URL || 'http://localhost:5000/api/v1/payments/momo-ipn';

exports.createPaymentUrl = async ({ amount, bookingCode, bookingId, redirectUrl }) => {
  const orderId = `${MOMO_PARTNER_CODE}${Date.now()}`;
  const requestId = orderId;
  const orderInfo = `Thanh toan dat phong ${bookingCode}`;
  const redirectUrlToUse = redirectUrl || MOMO_RETURN_URL;
  console.log('[MoMo] createPaymentUrl - redirectUrl:', redirectUrl, 'MOMO_RETURN_URL:', MOMO_RETURN_URL, 'final:', redirectUrlToUse);
  const ipnUrl = MOMO_IPN_URL;
  const requestType = 'payWithMethod';
  const extraData = Buffer.from(JSON.stringify({ bookingId })).toString('base64');

  
  amount = Math.round(Number(amount));

  
  const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrlToUse}&requestId=${requestId}&requestType=${requestType}`;
  const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

  const requestBody = {
    partnerCode: MOMO_PARTNER_CODE,
    partnerName: 'Hotel Booking',
    storeId: 'HotelBooking',
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl: redirectUrlToUse,
    ipnUrl,
    lang: 'vi',
    requestType,
    autoCapture: true,
    extraData,
    signature,
  };

  try {
    const { data } = await axios.post(MOMO_ENDPOINT, requestBody);
    if (data.resultCode === 0) {
      return { paymentUrl: data.payUrl, orderId };
    }
    throw new Error(data.message || 'MoMo create payment failed');
  } catch (err) {
    throw new Error(err.message || 'Cannot connect to MoMo');
  }
};

exports.verifyIpn = (body) => {
  const {
    partnerCode, orderId, requestId, amount, orderInfo,
    orderType, transId, resultCode, message, payType,
    responseTime, extraData, signature,
  } = body;

  const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
  const expectedSig = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

  if (expectedSig !== signature) {
    return { isValid: false };
  }
  return { isValid: true, resultCode, orderId, extraData, transId };
};

const MOMO_REFUND_ENDPOINT = process.env.MOMO_REFUND_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/refund';









exports.refund = async ({ orderId, amount, transId, description }) => {
  
  amount = Math.round(Number(amount));
  const refundRequestId = `${MOMO_PARTNER_CODE}RF${Date.now()}`;
  const refundOrderId = `${MOMO_PARTNER_CODE}RF${Date.now()}`;

  const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&description=${description || 'Hoan tien'}&orderId=${refundOrderId}&partnerCode=${MOMO_PARTNER_CODE}&requestId=${refundRequestId}&transId=${transId}`;
  const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

  const requestBody = {
    partnerCode: MOMO_PARTNER_CODE,
    orderId: refundOrderId,
    requestId: refundRequestId,
    amount,
    transId,
    lang: 'vi',
    description: description || 'Hoan tien',
    signature,
  };

  try {
    const { data } = await axios.post(MOMO_REFUND_ENDPOINT, requestBody);
    if (data.resultCode === 0) {
      return { success: true, refundId: data.transId || refundRequestId, data };
    }
    throw new Error(data.message || `MoMo refund failed: code ${data.resultCode}`);
  } catch (err) {
    if (err.response) throw new Error(`MoMo refund error: ${err.response.data?.message || err.message}`);
    throw err;
  }
};

exports.queryTransaction = async (orderId) => {
  const MOMO_QUERY_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/query';
  const requestId = `REQ_${orderId}`;
  
  const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&orderId=${orderId}&partnerCode=${MOMO_PARTNER_CODE}&requestId=${requestId}`;
  const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

  const requestBody = {
    partnerCode: MOMO_PARTNER_CODE,
    requestId,
    orderId,
    signature,
  };

  try {
    const { data } = await axios.post(MOMO_QUERY_ENDPOINT, requestBody);
    return data;
  } catch (err) {
    console.log('Error querying MoMo transaction:', err.message);
    return null;
  }
};
