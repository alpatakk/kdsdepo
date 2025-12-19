const db = require('../db');
const fs = require('fs');
const path = require('path');
const kdsLogic = require('../kds_logic');

// --- GLOBAL YARDIMCI FONKSİYONLAR ---
const getNum = (value) => parseFloat(value) || 0;

function toSVGId(text) {
    if (!text) return '';
    text = text.trim();
    return text
        .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/Ş/g, 's').replace(/ş/g, 's')
        .replace(/Ç/g, 'c').replace(/ç/g, 'c').replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
        .replace(/Ü/g, 'u').replace(/ü/g, 'u').replace(/Ö/g, 'o').replace(/ö/g, 'o')
        .replace(/ /g, '_').toLowerCase();
}

// --- DİNAMİK KRİTER LİSTESİ ---
const KDS_CRITERIA_MAP = {
    muhendislik_fakulte_sayisi: { name: "Müh. Fakülte Sayısı", category: "insan_kaynaklari", defaultWeight: 15 },
    teknopark_sayisi: { name: "Teknopark Sayısı", category: "insan_kaynaklari", defaultWeight: 20 },
    beyin_gocu_endeksi: { name: "Beyin Göçü Endeksi", category: "insan_kaynaklari", defaultWeight: -10 },
    liman_var_mi: { name: "Liman Varlığı (Boolean)", category: "lojistik_yasam_kalitesi", defaultWeight: 50 },
    yol_kalite_skoru: { name: "Yol Kalite Skoru (1-10)", category: "lojistik_yasam_kalitesi", defaultWeight: 5 },
    ortalama_metrekare_kira: { name: "Ort. Kira (m²/TL)", category: "pazar_ve_maliyet", defaultWeight: -0.5 }, 
    tesvik_derecesi: { name: "Teşvik Derecesi (1-6)", category: "pazar_ve_maliyet", defaultWeight: 10 },
    startup_sayisi: { name: "Startup Sayısı", category: "pazar_ve_maliyet", defaultWeight: 0.1 },
    osb_sayisi: { name: "OSB Sayısı", category: "pazar_ve_maliyet", defaultWeight: 5 }
};

// --- YARDIMCI VERİ FONKSİYONLARI ---
function getDynamicWeights(callback) {
    const sql = "SELECT kriter_adi, agirlik FROM kriterler";
    db.query(sql, (err, results) => {
        let dynamicWeights = {};
        Object.keys(KDS_CRITERIA_MAP).forEach(key => {
            dynamicWeights[key] = KDS_CRITERIA_MAP[key].defaultWeight;
        });
        if (!err && results && results.length > 0) {
            results.forEach(row => {
                if (dynamicWeights.hasOwnProperty(row.kriter_adi)) {
                    dynamicWeights[row.kriter_adi] = getNum(row.agirlik); 
                }
            });
        }
        callback(dynamicWeights);
    });
}

function fetchProvinceData(callback) {
    const sql = "SELECT * FROM iller";
    db.query(sql, (mysqlErr, results) => {
        if (mysqlErr || !results || results.length === 0) {
            console.warn("MySQL'den il verileri çekilemedi, JSON yedeği kullanılıyor.");
            const dbPath = path.join(__dirname, '..', 'database', 'provinces.json');
            fs.readFile(dbPath, 'utf8', (err, fileData) => {
                if (err) return callback(new Error('JSON Veritabanı okunamadı.'), null);
                callback(null, JSON.parse(fileData));
            });
        } else {
            const formattedData = results.map(row => ({
                id: toSVGId(row.il_adi),
                ad: row.il_adi,
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

// --- EXPORT EDİLEN API FONKSİYONLARI ---

exports.getProvinces = (req, res) => {
    fetchProvinceData((error, provinces) => {
        if (error || !provinces) return res.status(500).json({ success: false, message: 'Veri kaynağına ulaşılamadı.' });
        res.json({ success: true, data: provinces });
    });
};

exports.getKriterler = (req, res) => {
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
};

exports.updateProvince = (req, res) => {
    const { provinceId, provinceName, data } = req.body; 
    if (!provinceId || !provinceName || !data) return res.status(400).json({ success: false, message: 'Eksik bilgi gönderildi.' });

    const ilAdi = provinceName;
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
        yabanci_yatirim_endeksi: 0, 
        kamu_tesvik_skoru: 0,
        toplam_nufus: getNum(data.demografi.toplam_nufus),
        nufus_artis_hizi: getNum(data.demografi.nufus_artis_hizi),
        ortalama_hane_geliri: getNum(data.demografi.ortalama_hane_geliri)
    };

    db.query(`UPDATE iller SET ? WHERE il_adi = ?`, [updateData, ilAdi], (mysqlErr, result) => {
        if (!mysqlErr && result && result.affectedRows > 0) return res.json({ success: true, message: `${ilAdi} başarıyla güncellendi (MySQL).` });
        
        // MySQL başarısızsa JSON yedeği (Senin koddaki attemptJsonWrite mantığı)
        const dbPath = path.join(__dirname, '..', 'database', 'provinces.json');
        fs.readFile(dbPath, 'utf8', (err, fileData) => {
            if (err) return res.status(500).json({ success: false, message: 'Veritabanı okunamadı.' });
            let provinces = JSON.parse(fileData);
            const idx = provinces.findIndex(p => p.id === provinceId);
            if (idx === -1) provinces.push({ id: provinceId, ad: ilAdi, ...data });
            else provinces[idx] = { ...provinces[idx], ...data };
            fs.writeFile(dbPath, JSON.stringify(provinces, null, 2), 'utf8', () => res.json({ success: true, message: `${ilAdi} JSON yedeğine yazıldı.` }));
        });
    });
};

exports.updateKriterler = (req, res) => {
    const { updates } = req.body; 
    if (!updates || !Array.isArray(updates)) return res.status(400).json({ success: false });

    let completed = 0;
    updates.forEach(item => {
        db.query(`UPDATE kriterler SET agirlik = ? WHERE kriter_adi = ?`, [item.weight, item.key], (err, result) => {
            if (result && result.affectedRows === 0) {
                db.query(`INSERT INTO kriterler (kriter_adi, agirlik) VALUES (?, ?)`, [item.key, item.weight], () => {
                    completed++;
                    if (completed === updates.length) res.json({ success: true });
                });
            } else {
                completed++;
                if (completed === updates.length) res.json({ success: true });
            }
        });
    });
};

exports.getRecommendation = (req, res) => {
    getDynamicWeights(weights => {
        fetchProvinceData((error, provinces) => {
            if (error || !provinces) return res.status(500).json({ success: false });
            const result = kdsLogic.calculateSmartScoreAndComment(provinces, weights, 'default');
            res.json({ success: true, bestProvince: result.bestProvince, comment: result.comment, allScores: result.rankedProvinces });
        });
    });
};

exports.getCustomRecommend = (req, res) => {
    fetchProvinceData((error, provinces) => {
        if (error || !provinces) return res.status(500).json({ success: false });
        const result = kdsLogic.calculateCustomRecommendation(provinces, req.body); 
        res.json({ success: true, rankedProvinces: result.rankedResults.map(r => ({ id: r.id, value: r.score })), topProvincesWithDetails: result.topProvincesWithDetails });
    });
};

exports.getReport = (req, res) => {
    fetchProvinceData((error, provinces) => {
        if (error || !provinces) return res.status(500).json({ success: false });
        const result = kdsLogic.calculateThematicReport(provinces, req.params.reportType); 
        res.json({ success: true, data: result.rankedProvinces });
    });
};

exports.getCityAnalysis = (req, res) => {
    const cityName = req.query.il_adi;
    const q1 = `SELECT i.il_adi, i.ihracat_hacmi_milyon_usd as guncel_ihracat, i.liman_var_mi, i.genel_cazibe_puani, ROUND(((i.ihracat_hacmi_milyon_usd - ig.ihracat_hacmi_milyon_usd) / ig.ihracat_hacmi_milyon_usd * 100), 1) as on_yillik_buyume_hizi FROM iller i JOIN iller_gecmis ig ON i.il_adi = ig.il_adi AND ig.yil = 2014 WHERE i.il_adi = ?`;
    const q2 = `SELECT yil, ihracat_hacmi_milyon_usd, toplam_nufus, ortalama_hane_geliri FROM (SELECT 2024 as yil, ihracat_hacmi_milyon_usd, toplam_nufus, ortalama_hane_geliri FROM iller WHERE il_adi = ? UNION ALL SELECT yil, ihracat_hacmi_milyon_usd, toplam_nufus, ortalama_hane_geliri FROM iller_gecmis WHERE il_adi = ?) t ORDER BY yil ASC`;

    db.promise().query(q1, [cityName]).then(([r1]) => {
        return db.promise().query(q2, [cityName, cityName]).then(([r2]) => {
            const data = r1[0];
            data.cazibe_yorumu = data.genel_cazibe_puani >= 70 ? "Stratejik Yatırım Bölgesi" : (data.genel_cazibe_puani >= 50 ? "Yükselen Ekonomik Merkez" : "Gelişim Potansiyeli");
            res.json({ success: true, data, trendData: r2 });
        });
    }).catch(err => res.json({ success: false, message: err.message }));
};