const express = require('express');
const router = express.Router();
const provinceController = require('../controllers/provinceController');

// --- GET İSTEKLERİ ---
// Bütün illeri listeler
router.get('/provinces', provinceController.getProvinces);

// Kriter listesini ve ağırlıklarını getirir
router.get('/kriterler', provinceController.getKriterler);

// Bento Grid için il analiz verilerini getirir
router.get('/city-analysis', provinceController.getCityAnalysis);

// Türkiye Zaman Tüneli (Kronoloji) verilerini getirir - YENİ EKLENDİ
router.get('/kronoloji', provinceController.getTimeline);

// Harita üzerindeki akıllı öneriyi hesaplar
router.get('/recommendation', provinceController.getRecommendation);

// Yönetici raporlarını (Tematik) getirir
router.get('/report/:reportType', provinceController.getReport);

// --- POST İSTEKLERİ ---
// İl verilerini günceller (MySQL + JSON Yedek)
router.post('/update-province', provinceController.updateProvince);

// Kriter ağırlıklarını veritabanında günceller
router.post('/kriterler/update', provinceController.updateKriterler);

// Kişiselleştirilmiş (3'lü kart) öneri yapar
router.post('/custom-recommend', provinceController.getCustomRecommend);

module.exports = router;