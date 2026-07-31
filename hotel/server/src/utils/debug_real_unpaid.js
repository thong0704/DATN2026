const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/hotel_booking');
    console.log('Connected to MongoDB');

    const Booking = require('../models/Booking');
    const Payment = require('../models/Payment');
    const paymentService = require('../services/paymentService');

    // Find any booking that is unpaid
    const booking = await Booking.findOne({ paymentStatus: 'unpaid' });
    console.log('Unpaid booking ID:', booking?._id);

    if (!booking) {
      console.log('No unpaid booking found in database!');
      return;
    }

    // Call payment controller logic to create intent
    // We pass method: 'credit_card'
    const intent = await paymentService.createPaymentIntent({
      amount: booking.pricing.total,
      currency: 'vnd',
      metadata: { bookingId: String(booking._id), bookingCode: booking.bookingCode },
    });
    console.log('Stripe Intent created:', intent.id);

    // Create the payment record in DB
    const payment = await Payment.create({
      booking: booking._id,
      user: booking.customer,
      amount: booking.pricing.total,
      currency: 'VND',
      method: 'credit_card',
      stripePaymentIntentId: intent.id,
      status: 'pending',
    });
    console.log('Payment record created in DB:', payment._id);

    // Now call confirm payment endpoint simulation
    const retrievedIntent = await paymentService.retrievePaymentIntent(intent.id);
    console.log('Retrieved intent status:', retrievedIntent.status);

    if (retrievedIntent.status !== 'succeeded') {
      console.log('FAIL: Stripe intent not succeeded');
      return;
    }

    const updatedPayment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: 'succeeded', paidAt: new Date(), stripeChargeId: retrievedIntent.latest_charge || '' },
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
