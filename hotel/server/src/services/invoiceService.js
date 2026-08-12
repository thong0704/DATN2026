const PDFDocument = require('pdfkit');
const fs = require('fs');

const fontPath = 'C:\\Windows\\Fonts\\arial.ttf';
const boldFontPath = 'C:\\Windows\\Fonts\\arialbd.ttf';
const hasArial = fs.existsSync(fontPath);
const hasArialBold = fs.existsSync(boldFontPath);

function removeVietnameseTones(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function safeText(str) {
  if (hasArial || hasArialBold) return str || '';
  return removeVietnameseTones(str);
}

function applyFont(doc, isBold = false) {
  if (isBold && hasArialBold) {
    doc.font(boldFontPath);
  } else if (hasArial) {
    doc.font(fontPath);
  }
}

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
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      drawInvoiceContent(doc, { booking, hotel, room, user });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function drawInvoiceContent(doc, { booking, hotel, room, user }) {
  applyFont(doc, true);
  doc.fontSize(22).fillColor('#0f766e').text(safeText('HOÁ ĐƠN THANH TOÁN'), { align: 'center' });
  doc.moveDown();

  applyFont(doc, false);
  doc.fillColor('#000').fontSize(11);

  doc.text(safeText(`Mã hoá đơn: ${booking.bookingCode}`));
  doc.text(safeText(`Ngày lập: ${new Date(booking.createdAt).toLocaleString('vi-VN')}`));
  doc.moveDown();

  applyFont(doc, true);
  doc.fontSize(13).text(safeText('Khách hàng'), { underline: true });
  applyFont(doc, false);
  doc.fontSize(11).text(safeText(`Tên khách hàng: ${user?.name || booking.guestInfo?.name || ''}`));
  doc.text(safeText(`Email: ${user?.email || booking.guestInfo?.email || ''}`));
  doc.text(safeText(`Số điện thoại: ${booking.guestInfo?.phone || ''}`));
  doc.moveDown();

  applyFont(doc, true);
  doc.fontSize(13).text(safeText('Khách sạn & Phòng nghỉ'), { underline: true });
  applyFont(doc, false);
  doc.fontSize(11).text(safeText(`Khách sạn: ${hotel?.name || ''}`));
  doc.text(safeText(`Địa chỉ: ${[hotel?.address?.street, hotel?.address?.city].filter(Boolean).join(', ')}`));

  if (booking.rooms && booking.rooms.length > 0) {
    const roomDetails = booking.rooms.map(r => {
      const roomNum = r.room?.roomNumber || r.roomNumber || '';
      const roomType = r.room?.type || r.roomType || '';
      return roomNum ? `${roomNum} (${roomType})` : '';
    }).filter(Boolean).join(', ');
    doc.text(safeText(`Phòng nghỉ: ${roomDetails}`));
  } else {
    doc.text(safeText(`Phòng nghỉ: ${room?.roomNumber || ''} (${room?.type || ''})`));
  }
  doc.moveDown();

  applyFont(doc, true);
  doc.fontSize(13).text(safeText('Thông tin lưu trú'), { underline: true });
  applyFont(doc, false);
  doc.fontSize(11).text(safeText(`Ngày nhận phòng:  ${new Date(booking.checkIn).toLocaleDateString('vi-VN')}`));
  doc.text(safeText(`Ngày trả phòng:   ${new Date(booking.checkOut).toLocaleDateString('vi-VN')}`));
  doc.text(safeText(`Số đêm lưu trú:   ${booking.nights} đêm`));
  doc.text(safeText(`Số khách:         ${booking.guests?.adults || 1} người lớn, ${booking.guests?.children || 0} trẻ em`));
  doc.moveDown();

  applyFont(doc, true);
  doc.fontSize(13).text(safeText('Chi tiết thanh toán'), { underline: true });
  applyFont(doc, false);
  const p = booking.pricing || {};
  doc.fontSize(11).text(safeText(`Tiền phòng:     ${(p.roomTotal || 0).toLocaleString('vi-VN')} VND`));
  doc.text(safeText(`Dịch vụ đi kèm:  ${(p.servicesTotal || 0).toLocaleString('vi-VN')} VND`));
  doc.text(safeText(`Thuế (VAT):     ${(p.tax || 0).toLocaleString('vi-VN')} VND`));
  doc.text(safeText(`Giảm giá:      -${(p.discount || 0).toLocaleString('vi-VN')} VND`));
  doc.moveDown(0.5);

  applyFont(doc, true);
  doc.fontSize(13).fillColor('#0f766e').text(safeText(`TỔNG CỘNG: ${(p.total || 0).toLocaleString('vi-VN')} VND`));
  doc.fillColor('#000');

  if (booking.paymentStatus === 'paid') {
    doc.save();
    doc.rotate(15, { origin: [450, 90] });
    doc.rect(385, 70, 130, 40).lineWidth(3).strokeColor('#22c55e').stroke();
    applyFont(doc, true);
    doc.fontSize(11).fillColor('#22c55e').text(safeText('ĐÃ THANH TOÁN'), 385, 83, { align: 'center', width: 130 });
    doc.restore();
  }

  doc.moveDown(2);
  applyFont(doc, false);
  doc.fontSize(10).fillColor('#666').text(safeText('Cảm ơn quý khách đã tin tưởng và lựa chọn 2T Hotel!'), { align: 'center' });
}

module.exports = { streamInvoicePdf, generateInvoicePdfBuffer };
