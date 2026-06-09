const crypto = require('crypto');
const axios = require('axios');

const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
const MOMO_RETURN_URL = process.env.MOMO_RETURN_URL || 'http://localhost:5173/payment/momo-return';
const MOMO_IPN_URL = process.env.MOMO_IPN_URL || 'http://localhost:5000/api/v1/payments/momo-ipn';

exports.createPaymentUrl = async ({ amount, bookingCode, bookingId }) => {
  const orderId = `${MOMO_PARTNER_CODE}${Date.now()}`;
  const requestId = orderId;
  const orderInfo = `Thanh toan dat phong ${bookingCode}`;
  const redirectUrl = MOMO_RETURN_URL;
  const ipnUrl = MOMO_IPN_URL;
  const requestType = 'payWithMethod';
  const extraData = Buffer.from(JSON.stringify({ bookingId })).toString('base64');

  // MoMo requires amount to be integer (VND)
  amount = Math.round(Number(amount));

  // Create signature
  const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

  const requestBody = {
    partnerCode: MOMO_PARTNER_CODE,
    partnerName: 'Hotel Booking',
    storeId: 'HotelBooking',
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
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

/**
 * MoMo Refund API
 * @param {Object} params
 * @param {string} params.orderId - Original MoMo orderId
 * @param {number} params.amount - Refund amount
 * @param {string} params.transId - MoMo transId from IPN
 * @param {string} params.description - Refund reason
 */
exports.refund = async ({ orderId, amount, transId, description }) => {
  // MoMo requires amount to be integer (VND)
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
