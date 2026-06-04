const Article = require('../models/Article');
const ContactMessage = require('../models/ContactMessage');
const SiteBanner = require('../models/SiteBanner');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ----- Articles -----
exports.listArticles = catchAsync(async (req, res) => {
  const filter = { isPublished: true };
  if (req.query.tag) filter.tags = req.query.tag;
  const articles = await Article.find(filter).sort('-createdAt').limit(Number(req.query.limit) || 20);
  res.json({ status: 'success', data: { articles } });
});

exports.getArticle = catchAsync(async (req, res) => {
  const article = await Article.findOneAndUpdate(
    { slug: req.params.slug, isPublished: true },
    { $inc: { views: 1 } },
    { new: true }
  );
  if (!article) throw new AppError('Bài viết không tồn tại', 404);
  res.json({ status: 'success', data: { article } });
});

exports.createArticle = catchAsync(async (req, res) => {
  const article = await Article.create({ ...req.body, authorId: req.user._id });
  res.status(201).json({ status: 'success', data: { article } });
});

exports.updateArticle = catchAsync(async (req, res) => {
  const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!article) throw new AppError('Không tìm thấy', 404);
  res.json({ status: 'success', data: { article } });
});

exports.deleteArticle = catchAsync(async (req, res) => {
  const article = await Article.findByIdAndDelete(req.params.id);
  if (!article) throw new AppError('Không tìm thấy', 404);
  res.json({ status: 'success', message: 'Đã xoá' });
});

exports.listAllArticlesAdmin = catchAsync(async (req, res) => {
  const articles = await Article.find().sort('-createdAt');
  res.json({ status: 'success', data: { articles } });
});

exports.uploadArticleCover = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('Chưa chọn ảnh', 400);
  let url = req.file.path || req.file.secure_url || '';
  if (url && !/^https?:\/\//i.test(url)) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const rel = url.replace(/\\/g, '/').split('/uploads/').pop();
    url = `${baseUrl}/uploads/${rel}`;
  }
  res.json({ status: 'success', data: { url, public_id: req.file.filename || req.file.public_id || '' } });
});

// ----- Contact -----
exports.createContact = catchAsync(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) throw new AppError('Thiếu thông tin bắt buộc', 400);
  const msg = await ContactMessage.create({ name, email, phone, subject, message });
  res.status(201).json({ status: 'success', message: 'Đã gửi liên hệ, chúng tôi sẽ phản hồi sớm', data: { id: msg._id } });
});

exports.listContacts = catchAsync(async (req, res) => {
  const messages = await ContactMessage.find().sort('-createdAt');
  res.json({ status: 'success', data: { messages } });
});

exports.markContactRead = catchAsync(async (req, res) => {
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!msg) throw new AppError('Không tìm thấy', 404);
  res.json({ status: 'success', data: { message: msg } });
});

exports.deleteContact = catchAsync(async (req, res) => {
  const msg = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!msg) throw new AppError('Không tìm thấy', 404);
  res.json({ status: 'success', message: 'Đã xoá' });
});

// ----- Site Banners -----
exports.listBanners = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.active !== undefined) filter.isActive = req.query.active === 'true';
  const banners = await SiteBanner.find(filter).sort('order');
  res.json({ status: 'success', data: { banners } });
});

exports.listPublicBanners = catchAsync(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.type) filter.type = req.query.type;
  const banners = await SiteBanner.find(filter).sort('order');
  res.json({ status: 'success', data: { banners } });
});

exports.createBanner = catchAsync(async (req, res) => {
  const { type, title, subtitle, image, link, order, isActive } = req.body;
  if (!type || !title || !image) throw new AppError('Thiếu thông tin bắt buộc (type, title, image)', 400);
  const banner = await SiteBanner.create({ type, title, subtitle, image, link, order, isActive });
  res.status(201).json({ status: 'success', data: { banner } });
});

exports.updateBanner = catchAsync(async (req, res) => {
  const banner = await SiteBanner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!banner) throw new AppError('Không tìm thấy', 404);
  res.json({ status: 'success', data: { banner } });
});

exports.deleteBanner = catchAsync(async (req, res) => {
  const banner = await SiteBanner.findByIdAndDelete(req.params.id);
  if (!banner) throw new AppError('Không tìm thấy', 404);
  res.json({ status: 'success', message: 'Đã xoá' });
});

exports.uploadBannerImage = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('Chưa chọn ảnh', 400);
  let url = req.file.path || req.file.secure_url || '';
  if (url && !/^https?:\/\//i.test(url)) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const rel = url.replace(/\\/g, '/').split('/uploads/').pop();
    url = `${baseUrl}/uploads/${rel}`;
  }
  res.json({ status: 'success', data: { url, public_id: req.file.filename || req.file.public_id || '' } });
});
