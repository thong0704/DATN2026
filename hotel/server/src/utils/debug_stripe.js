const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/hotel_booking');
    console.log('Connected to MongoDB');

    // Find any user
    const User = require('../models/User');
    const user = await User.findOne({});
    console.log('Found user:', user?.email);

    if (!user) {
      console.log('No user in database!');
      return;
    }

    // Find any room
    const Room = require('../models/Room');
    const room = await Room.findOne({});
    console.log('Found room ID:', room?._id);

    if (!room) {
      console.log('No room in database!');
      return;
    }

    // Create a mock booking directly in MongoDB for testing payment confirmation
    const Booking = require('../models/Booking');
    const booking = await Booking.create({
      customer: user._id,
      room: room._id,
      hotel: room.hotel,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000),
      guests: { adults: 2, children: 0 },
      guestInfo: { name: user.name || 'Test', email: user.email, phone: user.phone || '090123' },
      pricing: { subtotal: 500000, tax: 40000, discount: 0, total: 540000 },
      paymentMethod: 'card',
      paymentStatus: 'pending',
      status: 'pending'
    });
    console.log('Created booking in DB:', booking._id);

    // Call payment controller logic to create intent
    const paymentService = require('../services/paymentService');
    const Payment = require('../models/Payment');
    
    const intent = await paymentService.createPaymentIntent({
      amount: booking.pricing.total,
      currency: 'vnd',
      metadata: { bookingId: String(booking._id), bookingCode: booking.bookingCode },
    });
    console.log('Stripe Intent created:', intent.id);

    await Payment.create({
      booking: booking._id,
      user: user._id,
      amount: booking.pricing.total,
      currency: 'VND',
      method: 'credit_card',
      stripePaymentIntentId: intent.id,
      status: 'pending',
    });
    console.log('Payment record created');

    // Confirm payment (simulate confirm endpoint)
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
    console.log('Payment status in DB updated to:', updatedPayment.status);

    const updatedBooking = await Booking.findByIdAndUpdate(
      booking._id,
      { status: 'paid', paymentStatus: 'paid', paymentId: updatedPayment._id },
      { new: new Date() }
    );
    console.log('Booking status in DB updated to:', updatedBooking.paymentStatus);
    console.log('TEST COMPLETED SUCCESSFULLY!');

  } catch (err) {
    console.error('Test error:', err.stack);
  } finally {
    await mongoose.disconnect();
  }
}

test();
