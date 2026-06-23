const stripe = require('../config/stripe');



const KEY = process.env.STRIPE_SECRET_KEY || '';
const PLACEHOLDER_PATTERNS = [/placeholder/i, /dummy/i, /_dev\b/i, /xxx/i, /\*+/, /your[-_]?key/i];
const MOCK_MODE = !KEY || PLACEHOLDER_PATTERNS.some((re) => re.test(KEY));

exports.MOCK_MODE = MOCK_MODE;





exports.createPaymentIntent = ({ amount, currency = 'vnd', metadata = {} }) => {
  if (MOCK_MODE) {
    const id = `pi_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return Promise.resolve({
      id,
      client_secret: `${id}_secret_mock`,
      amount: Math.round(amount),
      currency,
      status: 'requires_payment_method',
      metadata,
    });
  }
  return stripe.paymentIntents.create({
    amount: Math.round(amount),
    currency,
    automatic_payment_methods: { enabled: true },
    metadata,
  });
};

exports.retrievePaymentIntent = (id) => {
  if (MOCK_MODE || id.startsWith('pi_mock_')) {
    return Promise.resolve({ id, status: 'succeeded', latest_charge: `ch_mock_${id}` });
  }
  return stripe.paymentIntents.retrieve(id);
};

exports.refund = ({ paymentIntentId, amount, reason }) => {
  if (MOCK_MODE || (paymentIntentId && paymentIntentId.startsWith('pi_mock_'))) {
    return Promise.resolve({
      id: `re_mock_${Date.now()}`,
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount) : undefined,
      status: 'succeeded',
      reason: reason || 'requested_by_customer',
    });
  }
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount) : undefined,
    reason: reason || 'requested_by_customer',
  });
};

exports.constructWebhookEvent = (rawBody, signature) =>
  stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
