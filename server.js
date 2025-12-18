/* --- GENEL AYARLAR --- */
const express = require('express');
const fs = require('fs');
const path = require('path');

// YENİ EKLENEN MODÜL: KDS Logic
const kdsLogic = require('./kds_logic');

// --- YENİ EKLENEN: MySQL Veritabanı Bağlantısı ---
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'kds_projesi',
    port: 3306 
});

db.connect(err => {
    if (err) {
        console.error('########################################');
        console.error('❌ KRİTİK HATA: MySQL bağlantısı kurulamadı!');
        console.error('Hata Detayı:', err.message); 
        console.error('########################################');
    } else {
        console.log('✅ MySQL veritabanına başarıyla bağlandı (ID: ' + db.threadId + ')');
    }
});
// ----------------------------------------------------

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Gelen tüm istekleri konsola yazdıran yardımcı kod
app.use((req, res, next) => {
    console.log('İstek geldi:', req.method, req.path);
    next();
});

// --- GLOBAL YARDIMCI FONKSİYONLAR ---
const getNum = (value) => parseFloat(value) || 0;

function toSVGId(text) {
    if (!text) return '';
    text = text.trim();
    return text
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'i')
        .replace(/Ş/g, 's')
        .replace(/ş/g, 's')
        .replace(/Ç/g, 'c')
        .replace(/ç/g, 'c')
        .replace(/Ğ/g, 'g')
        .replace(/ğ/g, 'g')
        .replace(/Ü/g, 'u')
        .replace(/ü/g, 'u')
        .replace(/Ö/g, 'o')
        .replace(/ö/g, 'o')
        .replace(/ /g, '_')
        .toLowerCase();
}
// ------------------------------------------------------------------

// --- DİNAMİK KRİTER LİSTESİ (SABİT TANIMLAMA) ---
const KDS_CRITERIA_MAP = {
    muhendislik_fakulte_sayisi: { name: "Müh. Fakülte Sayısı", category: "insan_kaynaklari", defaultWeight: 15 },
    teknopark_sayisi: { name: "Teknopark Sayısı", category: "insan_kaynaklari", defaultWeight: 20 },
    beyin_gocu_endeksi: { name: "Beyin Göçü Endeksi", category: "insan_kaynaklari", defaultWeight: -10 }, // Negatif etki varsayıldı
    liman_var_mi: { name: "Liman Varlığı (Boolean)", category: "lojistik_yasam_kalitesi", defaultWeight: 50 },
    yol_kalite_skoru: { name: "Yol Kalite Skoru (1-10)", category: "lojistik_yasam_kalitesi", defaultWeight: 5 },
    ortalama_metrekare_kira: { name: "Ort. Kira (m²/TL)", category: "pazar_ve_maliyet", defaultWeight: -0.5 }, 
    tesvik_derecesi: { name: "Teşvik Derecesi (1-6)", category: "pazar_ve_maliyet", defaultWeight: 10 },
    startup_sayisi: { name: "Startup Sayısı", category: "pazar_ve_maliyet", defaultWeight: 0.1 },
    osb_sayisi: { name: "OSB Sayısı", category: "pazar_ve_maliyet", defaultWeight: 5 }
};

// --- DİNAMİK KRİTER AĞIRLIKLARINI ÇEKEN FONKSİYON ---
function getDynamicWeights(callback) {
    const sql = "SELECT kriter_adi, agirlik FROM kriterler";
    db.query(sql, (err, results) => {
        let dynamicWeights = {};
        
        // Önce varsayılanları yükle
        Object.keys(KDS_CRITERIA_MAP).forEach(key => {
            dynamicWeights[key] = KDS_CRITERIA_MAP[key].defaultWeight;
        });

        if (!err && results && results.length > 0) {
            // Sonra veritabanındakilerle üzerine yaz
            results.forEach(row => {
                if (dynamicWeights.hasOwnProperty(row.kriter_adi)) {
                    dynamicWeights[row.kriter_adi] = getNum(row.agirlik); 
                }
            });
        }
        callback(dynamicWeights);
    });
}

// --- VERİ ÇEKME YARDIMCI FONKSİYONU ---
function fetchProvinceData(callback) {
    const sql = "SELECT * FROM iller";
    db.query(sql, (mysqlErr, results) => {
        if (mysqlErr || !results || results.length === 0) {
            console.warn("MySQL'den il verileri çekilemedi, JSON yedeği kullanılıyor.");
            const dbPath = path.join(__dirname, 'database', 'provinces.json');
            fs.readFile(dbPath, 'utf8', (err, fileData) => {
                if (err) return callback(new Error('JSON Veritabanı okunamadı.'), null);
                callback(null, JSON.parse(fileData));
            });
        } else {
            const formattedData = results.map(row => ({
                id: toSVGId(row.il_adi), // Harita ID'si
                ad: row.il_adi,          // Orijinal il adı
                demografi: {
                    toplam_nufus: getNum(row.toplam_nufus),
                    nufus_artis_hizi: getNum(row.nufus_artis_hizi),
                    ortalama_hane_geliri: getNum(row.ortalama_hane_geliri)
                },
                insan_kaynaklari: {
                    muhendislik_fakulte_sayisi: getNum(row.muhendislik_fakulte_sayisi),
                    universite_ogrenci_sayisi: getNum(row.universite_ogrenci_sayisi),
                    teknopark_sayisi: getNum(row.teknopark_sayisi),
                    beyin_gocu_endeksi: getNum(row.beyin_gocu_endeksi),
                    yabanci_dil_orani: getNum(row.yabanci_dil_orani)
                },
                lojistik_yasam_kalitesi: {
                    havalimani_tipi: row.havalimani_tipi, 
                    liman_var_mi: getNum(row.liman_var_mi),
                    yol_kalite_skoru: getNum(row.yol_kalite_skoru),
                    hastane_yatak_kapasitesi: getNum(row.hastane_yatak_kapasitesi),
                    yesil_alan_orani: getNum(row.yesil_alan_orani)
                },
                pazar_ve_maliyet: {
                    osb_sayisi: getNum(row.osb_sayisi),
                    tesvik_derecesi: getNum(row.tesvik_derecesi),
                    ortalama_metrekare_kira: getNum(row.ortalama_metrekare_kira),
                    startup_sayisi: getNum(row.startup_sayisi),
                    ihracat_hacmi_milyon_usd: getNum(row.ihracat_hacmi_milyon_usd),
                    yabanci_yatirim_endeksi: getNum(row.yabanci_yatirim_endeksi), 
                    kamu_tesvik_skoru: getNum(row.kamu_tesvik_skoru)
                },
                genel_cazibe_puani: getNum(row.genel_cazibe_puani)
            }));
            callback(null, formattedData);
        }
    });
}
// --------------------------------------------------------------------------------------


// --- VERİ GÜNCELLEME API'Sİ ---
app.post('/api/update-province', (req, res) => {
    // KRİTİK DÜZELTME: provinceName'i app.js'ten alıyoruz
    const { provinceId, provinceName, data } = req.body; 
    
    if (!provinceId || !provinceName || !data) {
        return res.status(400).json({ success: false, message: 'Eksik bilgi gönderildi (provinceId, provinceName, data).' });
    }

    const ilAdi = provinceName; // Orijinal Türkçe il adı
    
    // Frontend'den gelen hiyerarşik veriyi düzleştiriyoruz.
    const updateData = {
        muhendislik_fakulte_sayisi: getNum(data.insan_kaynaklari.muhendislik_fakulte_sayisi),
        universite_ogrenci_sayisi: getNum(data.insan_kaynaklari.universite_ogrenci_sayisi),
        teknopark_sayisi: getNum(data.insan_kaynaklari.teknopark_sayisi),
        beyin_gocu_endeksi: getNum(data.insan_kaynaklari.beyin_gocu_endeksi),
        yabanci_dil_orani: getNum(data.insan_kaynaklari.yabanci_dil_orani),
        
        havalimani_tipi: data.lojistik_yasam_kalitesi.havalimani_tipi,
        liman_var_mi: data.lojistik_yasam_kalitesi.liman_var_mi === true || data.lojistik_yasam_kalitesi.liman_var_mi === 'true' ? 1 : 0, 
        yol_kalite_skoru: getNum(data.lojistik_yasam_kalitesi.yol_kalite_skoru),
        hastane_yatak_kapasitesi: getNum(data.lojistik_yasam_kalitesi.hastane_yatak_kapasitesi),
        yesil_alan_orani: getNum(data.lojistik_yasam_kalitesi.yesil_alan_orani),
        
        osb_sayisi: getNum(data.pazar_ve_maliyet.osb_sayisi),
        tesvik_derecesi: getNum(data.pazar_ve_maliyet.tesvik_derecesi),
        ortalama_metrekare_kira: getNum(data.pazar_ve_maliyet.ortalama_metrekare_kira),
        startup_sayisi: getNum(data.pazar_ve_maliyet.startup_sayisi),
        ihracat_hacmi_milyon_usd: getNum(data.pazar_ve_maliyet.ihracat_hacmi_milyon_usd),
        // Bu iki sütun formda yok, güvenli veri ataması
        yabanci_yatirim_endeksi: 0, 
        kamu_tesvik_skoru: 0,
        
        toplam_nufus: getNum(data.demografi.toplam_nufus),
        nufus_artis_hizi: getNum(data.demografi.nufus_artis_hizi),
        ortalama_hane_geliri: getNum(data.demografi.ortalama_hane_geliri)
    };
    
    // UPDATE Sorgusu
    const sql = `UPDATE iller SET ? WHERE il_adi = ?`; 
    
    db.query(sql, [updateData, ilAdi], (mysqlErr, result) => {
        if (!mysqlErr && result && result.affectedRows > 0) {
             console.log(`Veritabanı güncellendi: ${ilAdi} (MySQL)`);
             return res.json({ success: true, message: `${ilAdi} başarıyla güncellendi (MySQL).` });
        } 
        
        // Eğer MySQL güncelleme başarısız olursa (hata veya kayıt yoksa), ekleme veya JSON yedeğini dene
        function attemptJsonWrite() {
             const dbPath = path.join(__dirname, 'database', 'provinces.json');

             fs.readFile(dbPath, 'utf8', (err, fileData) => {
                 if (err) {
                     console.error("JSON okuma hatası:", err);
                     return res.status(500).json({ success: false, message: 'Veritabanı okunamadı (Yedek Hata).' });
                 }

                 let provinces = JSON.parse(fileData);
                 const provinceIndex = provinces.findIndex(p => p.id === provinceId);

                 if (provinceIndex === -1) {
                     // Eksik veriyi JSON'a ekle
                     const newProvince = { 
                         id: provinceId, 
                         ad: ilAdi, 
                         insan_kaynaklari: data.insan_kaynaklari,
                         lojistik_yasam_kalitesi: data.lojistik_yasam_kalitesi,
                         pazar_ve_maliyet: data.pazar_ve_maliyet,
                         demografi: data.demografi,
                     };
                     provinces.push(newProvince);
                 } else {
                     // Var olan veriyi JSON'da güncelle
                     provinces[provinceIndex].insan_kaynaklari = data.insan_kaynaklari;
                     provinces[provinceIndex].lojistik_yasam_kalitesi = data.lojistik_yasam_kalitesi;
                     provinces[provinceIndex].pazar_ve_maliyet = data.pazar_ve_maliyet;
                     provinces[provinceIndex].demografi = data.demografi;
                 }
                 
                 fs.writeFile(dbPath, JSON.stringify(provinces, null, 2), 'utf8', (err) => {
                      if (err) {
                          console.error("JSON yazma hatası:", err);
                          return res.status(500).json({ success: false, message: 'Veritabanı yazılamadı (Yedek Hata).' });
                      }
                      console.log(`Veritabanı JSON yedeği güncellendi: ${ilAdi}`);
                      res.json({ success: true, message: `${ilAdi} başarıyla güncellendi (JSON Yedek).` });
                 });
             });
        }

        // MySQL'de güncelleme başarısızsa (kayıt yoksa veya hata varsa)
        if (!mysqlErr && result.affectedRows === 0) {
             console.warn(`MySQL: ${ilAdi} bulunamadı, yeni il olarak ekleniyor.`);
             
             // KRİTİK DÜZELTME 2: Güvenli INSERT yapısı kullan
             const insertData = { ...updateData, il_adi: ilAdi };
             const insertSql = `INSERT INTO iller SET ?`; 
             
             db.query(insertSql, insertData, (insertErr) => {
                 if(insertErr) {
                      console.error("MySQL ekleme hatası:", insertErr);
                      return attemptJsonWrite(); 
                 }
                 return res.json({ success: true, message: `${ilAdi} başarıyla eklendi (MySQL).` });
             });

        } else if (mysqlErr) {
            // Ciddi bir MySQL bağlantı hatası varsa JSON yedeğini dene
            console.error("MySQL kritik hata:", mysqlErr.message);
            return attemptJsonWrite();
        }
    });
});

// --- YÖNETİCİ RAPORLAMA API'Sİ (Tematik Raporlama) ---
app.get('/api/report/:reportType', (req, res) => {
    const { reportType } = req.params;
    
    fetchProvinceData((error, provinces) => {
        if (error || !provinces) {
            return res.status(500).json({ success: false, message: 'Veri kaynağına ulaşılamadı.' });
        }
        
        const result = kdsLogic.calculateThematicReport(provinces, reportType); 
        res.json({ success: true, data: result.rankedProvinces });
    });
});


// --- AKILLI ÖNERİ API'Sİ (GET - Harita için) ---
app.get('/api/recommendation', (req, res) => {
    
    getDynamicWeights(weights => {
        fetchProvinceData((error, provinces) => {
            if (error || !provinces) {
                return res.status(500).json({ success: false, message: 'Veri kaynağına ulaşılamadı.' });
            }
            
            const result = kdsLogic.calculateSmartScoreAndComment(provinces, weights, 'default');

            res.json({ 
                success: true, 
                bestProvince: result.bestProvince, 
                comment: result.comment,
                allScores: result.rankedProvinces 
            });
        });
    });
});

// --- YENİ EKLENEN: KİŞİSELLEŞTİRİLMİŞ ÖNERİ API'Sİ (POST /api/custom-recommend) ---
// BU KISIM APP.JS'TEKİ YENİ 3'LÜ KART SİSTEMİNİ BESLER
app.post('/api/custom-recommend', (req, res) => {
    const preferences = req.body; 

    if (!preferences || Object.keys(preferences).length === 0) {
        return res.status(400).json({ success: false, message: 'Tercih verisi eksik.' });
    }

    fetchProvinceData((error, provinces) => {
        if (error || !provinces) {
            return res.status(500).json({ success: false, message: 'Veri kaynağına ulaşılamadı.' });
        }
        
        // KDS Logic'teki yeni 3'lü kart fonksiyonunu çağırıyoruz
        const result = kdsLogic.calculateCustomRecommendation(provinces, preferences); 

        res.json({ 
            success: true, 
            rankedProvinces: result.rankedResults.map(r => ({ id: r.id, value: r.score })), 
            topProvincesWithDetails: result.topProvincesWithDetails 
        });
    });
});

// --- DİNAMİK ÖNERİ API'Sİ (Eski uyumluluk için korunuyor) ---
app.post('/api/recommend', (req, res) => {
    const { muhendislik_agirlik, teknopark_agirlik, tesvik_agirlik, kira_agirlik } = req.body;

    fetchProvinceData((error, provinces) => {
        if (error || !provinces) {
            return res.status(500).json({ success: false, message: 'Veri kaynağına ulaşılamadı.' });
        }
        
        let bestProvince = null;
        let maxScore = -Infinity;

        const recommendationData = provinces.map(p => {
            let score = 0;
            try {
                const mah = getNum(muhendislik_agirlik);
                const tah = getNum(teknopark_agirlik);
                const teah = getNum(tesvik_agirlik);
                const kiah = getNum(kira_agirlik);

                score += p.insan_kaynaklari.muhendislik_fakulte_sayisi * mah;
                score += p.insan_kaynaklari.teknopark_sayisi * tah;
                score += p.pazar_ve_maliyet.tesvik_derecesi * teah;

                const kira_value = p.pazar_ve_maliyet.ortalama_metrekare_kira;
                if (kira_value > 0) {
                    score += (100000 - kira_value) * kiah; 
                }
            } catch (e) {
                console.error(`Skor hatası: ${p.ad} - ${e.message}`);
                score = 1;
            }

            if (score > maxScore) {
                maxScore = score;
                bestProvince = { ad: p.ad, score: parseFloat(score.toFixed(2)) };
            }
            return { id: p.id, value: parseFloat(score.toFixed(2)) }; 
        });

        res.json({ success: true, bestProvince: bestProvince, allScores: recommendationData });
    });
});


// --- KRİTER AĞIRLIKLARINI GÜNCELLEME API'Sİ ---
app.post('/api/kriterler/update', (req, res) => {
    const { updates } = req.body; 
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ success: false, message: 'Geçersiz güncelleme verisi.' });
    }

    let completedCount = 0;
    let errorCount = 0;
    
    updates.forEach(item => {
        const updateSql = `UPDATE kriterler SET agirlik = ? WHERE kriter_adi = ?`;
        db.query(updateSql, [item.weight, item.key], (err, result) => {
            if (err) {
                console.error(`Kriter güncelleme hatası:`, err);
                completedCount++;
                errorCount++;
            } else if (result.affectedRows === 0) {
                const insertSql = `INSERT INTO kriterler (kriter_adi, agirlik) VALUES (?, ?)`;
                db.query(insertSql, [item.key, item.weight], (insertErr) => { 
                    completedCount++;
                    if (insertErr) errorCount++;
                    if (completedCount === updates.length) {
                        return res.json({ success: errorCount === 0, message: `${completedCount} kriter işlendi.` });
                    }
                });
            } else {
                completedCount++;
                if (completedCount === updates.length) {
                    return res.json({ success: errorCount === 0, message: `${completedCount} kriter güncellendi.` });
                }
            }
        });
    });
});

// --- TÜM İL VERİLERİNİ GÖNDEREN API ---
app.get('/api/provinces', (req, res) => {
    fetchProvinceData((error, provinces) => {
        if (error || !provinces) {
             return res.status(500).json({ success: false, message: 'Veri kaynağına ulaşılamadı.' });
        }
        res.json({ success: true, data: provinces });
    });
});


// --- KRİTER AĞIRLIKLARINI ÇEKME API'Sİ ---
app.get('/api/kriterler', (req, res) => {
    const sql = "SELECT kriter_adi, agirlik FROM kriterler";
    db.query(sql, (err, results) => {
        let finalCriteria = { ...KDS_CRITERIA_MAP };
        if (!err && results && results.length > 0) {
            results.forEach(row => {
                if (finalCriteria[row.kriter_adi]) {
                    finalCriteria[row.kriter_adi].defaultWeight = getNum(row.agirlik);
                }
            });
        }
        res.json({ success: true, data: Object.keys(finalCriteria).map(key => ({ 
            key: key, 
            weight: finalCriteria[key].defaultWeight, 
            name: finalCriteria[key].name,
            category: finalCriteria[key].category
        }))});
    });
});

// =========================================================================
// --- YENİ EKLENEN: İL ANALİZ KARNESİ API'Sİ (BENTO GRID İÇİN) ---
// =========================================================================
app.get('/api/city-analysis', (req, res) => {
    const cityName = req.query.il_adi;
    
    if (!cityName) {
        return res.status(400).json({ success: false, message: "İl adı belirtilmedi." });
    }

    // 1. Ana Analiz Sorgusu (2014 ve 2024 kıyaslamalı)
    const queryAnalysis = `
        SELECT i.il_adi, i.ihracat_hacmi_milyon_usd as guncel_ihracat,
               i.liman_var_mi, i.genel_cazibe_puani,
               ROUND(((i.ihracat_hacmi_milyon_usd - ig.ihracat_hacmi_milyon_usd) / ig.ihracat_hacmi_milyon_usd * 100), 1) as on_yillik_buyume_hizi
        FROM iller i 
        JOIN iller_gecmis ig ON i.il_adi = ig.il_adi AND ig.yil = 2014
        WHERE i.il_adi = ?`;

    // 2. Grafik Trend Sorgusu (ZAMAN YOLCULUĞU MODU: Tüm metrikler getiriliyor)
    const queryTrend = `
        SELECT yil, ihracat_hacmi_milyon_usd, toplam_nufus, ortalama_hane_geliri FROM (
            SELECT 2024 as yil, ihracat_hacmi_milyon_usd, toplam_nufus, ortalama_hane_geliri FROM iller WHERE il_adi = ?
            UNION ALL
            SELECT yil, ihracat_hacmi_milyon_usd, toplam_nufus, ortalama_hane_geliri FROM iller_gecmis WHERE il_adi = ?
        ) t ORDER BY yil ASC`;

    // Paralel sorgu çalıştırma (Promise wrapper ile)
    db.promise().query(queryAnalysis, [cityName])
        .then(([analysisResult]) => {
            if (analysisResult.length === 0) {
                throw new Error("İl verisi bulunamadı");
            }
            
            return db.promise().query(queryTrend, [cityName, cityName])
                .then(([trendResult]) => {
                    const data = analysisResult[0];
                    
                    // Dinamik Cazibe Yorumu
                    data.cazibe_yorumu = data.genel_cazibe_puani >= 70 ? "Stratejik Yatırım Bölgesi" : 
                                        (data.genel_cazibe_puani >= 50 ? "Yükselen Ekonomik Merkez" : "Gelişim Potansiyeli");

                    res.json({ 
                        success: true, 
                        data: data, 
                        trendData: trendResult 
                    });
                });
        })
        .catch(err => {
            console.error("Analiz API Hatası:", err.message);
            res.json({ success: false, message: err.message });
        });
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});