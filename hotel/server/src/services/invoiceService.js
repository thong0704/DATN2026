const PDFDocument = require('pdfkit');
const fs = require('fs');

const fontPath = 'C:\\Windows\\Fonts\\arial.ttf';
const boldFontPath = 'C:\\Windows\\Fonts\\arialbd.ttf';
const hasArial = fs.existsSync(fontPath);
const hasArialBold = fs.existsSync(boldFontPath);

function applyFont(doc, isBold = false) {
  if (isBold && hasArialBold) {
    doc.font(boldFontPath);
  } else if (hasArial) {
    doc.font(fontPath);
  }
}

/**
 * Streams an invoice PDF to the provided Express response.
 */
function streamInvoicePdf(res, { booking, hotel, room, user }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${booking.bookingCode}.pdf"`);
  doc.pipe(res);

  drawInvoiceContent(doc, { booking, hotel, room, user });

  doc.end();
}

function generateInvoicePdfBuffer({ booking, hotel, room, user }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', err => reject(err));

    drawInvoiceContent(doc, { booking, hotel, room, user });

    doc.end();
  });
}

function drawInvoiceContent(doc, { booking, hotel, room, user }) {
  // Title
  applyFont(doc, true);
  doc.fontSize(22).fillColor('#0f766e').text('HOÁ ĐƠN THANH TOÁN', { align: 'center' });
  doc.moveDown();
  
  applyFont(doc, false);
  doc.fillColor('#000').fontSize(11);

  doc.text(`Mã hoá đơn: ${booking.bookingCode}`);
  doc.text(`Ngày lập: ${new Date(booking.createdAt).toLocaleString('vi-VN')}`);
  doc.moveDown();

  // Customer Section
  applyFont(doc, true);
  doc.fontSize(13).text('Khách hàng', { underline: true });
  applyFont(doc, false);
  doc.fontSize(11).text(`Tên khách hàng: ${user?.name || booking.guestInfo?.name || ''}`);
  doc.text(`Email: ${user?.email || booking.guestInfo?.email || ''}`);
  doc.text(`Số điện thoại: ${booking.guestInfo?.phone || ''}`);
  doc.moveDown();

  // Hotel & Room Section
  applyFont(doc, true);
  doc.fontSize(13).text('Khách sạn & Phòng nghỉ', { underline: true });
  applyFont(doc, false);
  doc.fontSize(11).text(`Khách sạn: ${hotel?.name || ''}`);
  doc.text(`Địa chỉ: ${[hotel?.address?.street, hotel?.address?.city].filter(Boolean).join(', ')}`);
  
  if (booking.rooms && booking.rooms.length > 0) {
    const roomDetails = booking.rooms.map(r => {
      const roomNum = r.room?.roomNumber || r.roomNumber || '';
      const roomType = r.room?.type || r.roomType || '';
      return roomNum ? `${roomNum} (${roomType})` : '';
    }).filter(Boolean).join(', ');
    doc.text(`Phòng nghỉ: ${roomDetails}`);
  } else {
    doc.text(`Phòng nghỉ: ${room?.roomNumber || ''} (${room?.type || ''})`);
  }
  doc.moveDown();

  // Stay Section
  applyFont(doc, true);
  doc.fontSize(13).text('Thông tin lưu trú', { underline: true });
  applyFont(doc, false);
  doc.fontSize(11).text(`Ngày nhận phòng:  ${new Date(booking.checkIn).toLocaleDateString('vi-VN')}`);
  doc.text(`Ngày trả phòng:   ${new Date(booking.checkOut).toLocaleDateString('vi-VN')}`);
  doc.text(`Số đêm lưu trú:   ${booking.nights} đêm`);
  doc.text(`Số khách:         ${booking.guests?.adults || 1} người lớn, ${booking.guests?.children || 0} trẻ em`);
  doc.moveDown();

  // Pricing Section
  applyFont(doc, true);
  doc.fontSize(13).text('Chi tiết thanh toán', { underline: true });
  applyFont(doc, false);
  const p = booking.pricing || {};
  doc.fontSize(11).text(`Tiền phòng:     ${(p.roomTotal || 0).toLocaleString('vi-VN')} VND`);
  doc.text(`Dịch vụ đi kèm:  ${(p.servicesTotal || 0).toLocaleString('vi-VN')} VND`);
  doc.text(`Thuế (VAT):     ${(p.tax || 0).toLocaleString('vi-VN')} VND`);
  doc.text(`Giảm giá:      -${(p.discount || 0).toLocaleString('vi-VN')} VND`);
  doc.moveDown(0.5);
  
  applyFont(doc, true);
  doc.fontSize(13).fillColor('#0f766e').text(`TỔNG CỘNG: ${(p.total || 0).toLocaleString('vi-VN')} VND`);
  doc.fillColor('#000');

  // PAID stamp if paid
  if (booking.paymentStatus === 'paid') {
    doc.save();
    doc.rotate(15, { origin: [450, 90] });
    doc.rect(385, 70, 130, 40).lineWidth(3).strokeColor('#22c55e').stroke();
    applyFont(doc, true);
    doc.fontSize(11).fillColor('#22c55e').text('ĐÃ THANH TOÁN', 385, 83, { align: 'center', width: 130 });
    doc.restore();
  }

  doc.moveDown(2);
  applyFont(doc, false);
  doc.fontSize(10).fillColor('#666').text('Cảm ơn quý khách đã tin tưởng và lựa chọn 2T Hotel!', { align: 'center' });
}

module.exports = { streamInvoicePdf, generateInvoicePdfBuffer };
