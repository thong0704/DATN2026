const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/hotel_booking');
    console.log('Connected to MongoDB');

    const Booking = require('../models/Booking');
    const Payment = require('../models/Payment');
    const paymentService = require('../services/paymentService');

    // Find the last booking created with paymentMethod 'card'
    const booking = await Booking.findOne({ paymentMethod: 'card' }).sort({ createdAt: -1 });
    console.log('Last card booking ID:', booking?._id);
    console.log('Last card booking Code:', booking?.bookingCode);
    console.log('Last card booking Status:', booking?.status);
    console.log('Last card booking PaymentStatus:', booking?.paymentStatus);

    if (!booking) {
      console.log('No card booking found!');
      return;
    }

    // Find the payment intent for this booking
    const payment = await Payment.findOne({ booking: booking._id });
    console.log('Payment Intent ID:', payment?.stripePaymentIntentId);
    console.log('Payment Status:', payment?.status);

    if (!payment) {
      console.log('No payment intent found for this booking!');
      return;
    }

    const intentId = payment.stripePaymentIntentId;

    // Simulate the server's /payments/confirm controller logic
    const intent = await paymentService.retrievePaymentIntent(intentId);
    console.log('Retrieved intent status:', intent.status);

    if (intent.status !== 'succeeded') {
      console.log('FAIL: Stripe intent not succeeded');
      return;
    }

    // Try updating
    const updatedPayment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intentId },
      { status: 'succeeded', paidAt: new Date(), stripeChargeId: intent.latest_charge || '' },
      { new: true }
    );
    console.log('Updated Payment status in DB:', updatedPayment?.status);

    const updatedBooking = await Booking.findByIdAndUpdate(
      booking._id,
      { status: 'paid', paymentStatus: 'paid', paymentId: updatedPayment?._id },
      { new: true }
    );
    console.log('Updated Booking payment status in DB:', updatedBooking?.paymentStatus);
    console.log('SUCCESS!');

  } catch (err) {
    console.error('Test error:', err.stack);
  } finally {
    await mongoose.disconnect();
  }
}

test();
