const PDFDocument = require('pdfkit');

/**
 * Streams an invoice PDF to the provided Express response.
 */
function streamInvoicePdf(res, { booking, hotel, room, user }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${booking.bookingCode}.pdf"`);
  doc.pipe(res);

  doc.fontSize(22).fillColor('#0f766e').text('HOTEL BOOKING INVOICE', { align: 'center' });
  doc.moveDown();
  doc.fillColor('#000').fontSize(12);

  doc.text(`Invoice #: ${booking.bookingCode}`);
  doc.text(`Date: ${new Date(booking.createdAt).toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(14).text('Customer', { underline: true });
  doc.fontSize(12).text(`Name: ${user?.name || booking.guestInfo?.name || ''}`);
  doc.text(`Email: ${user?.email || booking.guestInfo?.email || ''}`);
  doc.text(`Phone: ${booking.guestInfo?.phone || ''}`);
  doc.moveDown();

  doc.fontSize(14).text('Hotel & Room', { underline: true });
  doc.fontSize(12).text(`Hotel: ${hotel?.name || ''}`);
  doc.text(`Address: ${[hotel?.address?.street, hotel?.address?.city].filter(Boolean).join(', ')}`);
  doc.text(`Room: ${room?.roomNumber || ''} (${room?.type || ''})`);
  doc.moveDown();

  doc.fontSize(14).text('Stay', { underline: true });
  doc.fontSize(12).text(`Check-in:  ${new Date(booking.checkIn).toDateString()}`);
  doc.text(`Check-out: ${new Date(booking.checkOut).toDateString()}`);
  doc.text(`Nights: ${booking.nights}`);
  doc.text(`Guests: ${booking.guests.adults} adults, ${booking.guests.children} children`);
  doc.moveDown();

  doc.fontSize(14).text('Pricing', { underline: true });
  const p = booking.pricing || {};
  doc.fontSize(12).text(`Room total:     ${(p.roomTotal || 0).toLocaleString()} VND`);
  doc.text(`Services:       ${(p.servicesTotal || 0).toLocaleString()} VND`);
  doc.text(`Tax:            ${(p.tax || 0).toLocaleString()} VND`);
  doc.text(`Discount:      -${(p.discount || 0).toLocaleString()} VND`);
  doc.moveDown(0.5);
  doc.fontSize(14).fillColor('#0f766e').text(`TOTAL: ${(p.total || 0).toLocaleString()} VND`);
  doc.fillColor('#000');

  doc.moveDown(2);
  doc.fontSize(10).fillColor('#666').text('Thank you for booking with us!', { align: 'center' });

  doc.end();
}

module.exports = { streamInvoicePdf };
