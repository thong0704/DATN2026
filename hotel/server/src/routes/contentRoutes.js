const express = require('express');
const ctrl = require('../controllers/contentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { makeUploader } = require('../middlewares/upload');

const router = express.Router();
const upload = makeUploader('hotel/articles');
const uploadBanner = makeUploader('hotel/banners');


router.get('/articles', ctrl.listArticles);
router.get('/articles/:slug', ctrl.getArticle);

router.post('/contact', ctrl.createContact);

router.get('/banners', ctrl.listPublicBanners);


router.use(protect);
router.get('/admin/articles', restrictTo('admin', 'manager'), ctrl.listAllArticlesAdmin);
router.post('/articles', restrictTo('admin', 'manager'), ctrl.createArticle);
router.post('/articles/upload-cover', restrictTo('admin', 'manager'), upload.single('cover'), ctrl.uploadArticleCover);
router.put('/articles/:id', restrictTo('admin', 'manager'), ctrl.updateArticle);
router.delete('/articles/:id', restrictTo('admin', 'manager'), ctrl.deleteArticle);

router.get('/admin/banners', restrictTo('admin', 'manager'), ctrl.listBanners);
router.post('/banners', restrictTo('admin', 'manager'), ctrl.createBanner);
router.post('/banners/upload-image', restrictTo('admin', 'manager'), uploadBanner.single('image'), ctrl.uploadBannerImage);
router.put('/banners/:id', restrictTo('admin', 'manager'), ctrl.updateBanner);
router.delete('/banners/:id', restrictTo('admin', 'manager'), ctrl.deleteBanner);

router.get('/contact', restrictTo('admin', 'manager', 'staff'), ctrl.listContacts);
router.put('/contact/:id/read', restrictTo('admin', 'manager', 'staff'), ctrl.markContactRead);
router.delete('/contact/:id', restrictTo('admin', 'manager', 'staff'), ctrl.deleteContact);

module.exports = router;
