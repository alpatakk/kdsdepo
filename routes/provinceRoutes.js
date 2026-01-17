const express = require('express');
const router = express.Router();
const provinceController = require('../controllers/provinceController');


// Bütün illeri listeler
router.get('/provinces', provinceController.getProvinces);

// Kriter listesini ve ağırlıklarını getirir
router.get('/kriterler', provinceController.getKriterler);

// Bento Grid için il analiz verilerini getirir
router.get('/city-analysis', provinceController.getCityAnalysis);

// Türkiye Zaman Tüneli (Kronoloji) verilerini getirir 
router.get('/kronoloji', provinceController.getTimeline);

// Harita üzerindeki akıllı öneriyi hesaplar
router.get('/recommendation', provinceController.getRecommendation);

// Yönetici raporlarını (Tematik) getirir
router.get('/report/:reportType', provinceController.getReport);

// ===  SIDEBAR VE GENEL ÖZET VERİLERİNİ GETİRİR  ===
router.get('/summary', provinceController.getSummaryData);


// --- ANALİZ YÖNETİMİ (CRUD İŞLEMLERİ) ---

// [READ] Tüm geçmiş analizleri listeleme
router.get('/analiz', provinceController.listAnalizler);

// [CREATE] Yeni bir analizi belleğe kaydetme
router.post('/analiz', provinceController.saveAnaliz);

// [UPDATE] Mevcut bir analizin durumunu güncelleme 
router.patch('/analiz/:id', provinceController.patchAnaliz);

// [DELETE] Belirli bir analizi sistemden temizleme 
router.delete('/analiz/:id', provinceController.removeAnaliz);


// --- DİĞER POST/GÜNCELLEME İSTEKLERİ ---
// İl verilerini günceller (MySQL + JSON Yedek)
router.post('/update-province', provinceController.updateProvince);

// Kriter ağırlıklarını veritabanında günceller
router.post('/kriterler/update', provinceController.updateKriterler);

// Kişiselleştirilmiş (3'lü kart) öneri yapar
router.post('/custom-recommend', provinceController.getCustomRecommend);

module.exports = router;