const provinceService = require('../services/provinceService');
const db = require('../db');
const fs = require('fs');
const path = require('path');

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
const getNum = (value) => parseFloat(value) || 0;

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

function fetchRawData(callback) {
    const sql = "SELECT * FROM iller";
    db.query(sql, (mysqlErr, results) => {
        if (mysqlErr || !results || results.length === 0) {
            const dbPath = path.join(__dirname, '..', 'database', 'provinces.json');
            fs.readFile(dbPath, 'utf8', (err, fileData) => {
                if (err) return callback(new Error('JSON Veritabanı okunamadı.'), null);
                callback(null, JSON.parse(fileData));
            });
        } else {
            callback(null, results);
        }
    });
}

// --- API FONKSİYONLARI  ---

exports.getProvinces = (req, res) => {
    fetchRawData((error, results) => {
        if (error || !results) return res.status(500).json({ success: false, message: 'Veri kaynağına ulaşılamadı.' });
        const data = provinceService.formatProvinces(results);
        res.status(200).json({ success: true, data: data });
    });
};

exports.getTimeline = (req, res) => {
    const sql = "SELECT * FROM turkiye_kronolojisi ORDER BY yil DESC, id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Kronoloji verileri çekilemedi.' });
        res.status(200).json({ success: true, data: results });
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
        res.status(200).json({ success: true, data: Object.keys(finalCriteria).map(key => ({ 
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

    const updateData = {
        muhendislik_fakulte_sayisi: getNum(data.insan_kaynaklari.muhendislik_fakulte_sayisi),
        universite_ogrenci_sayisi: getNum(data.insan_kaynaklari.universite_ogrenci_sayisi),
        teknopark_sayisi: getNum(data.insan_kaynaklari.teknopark_sayisi),
        beyin_gocu_endeksi: getNum(data.insan_kaynaklari.beyin_gocu_endeksi),
        yabanci_dil_orani: getNum(data.insan_kaynaklari.yabanci_dil_orani),
        havalimani_tipi: data.lojistik_yasam_kalitesi.havalimani_tipi,
        liman_var_mi: (data.lojistik_yasam_kalitesi.liman_var_mi === true || data.lojistik_yasam_kalitesi.liman_var_mi === 'true') ? 1 : 0, 
        yol_kalite_skoru: getNum(data.lojistik_yasam_kalitesi.yol_kalite_skoru),
        hastane_yatak_kapasitesi: getNum(data.lojistik_yasam_kalitesi.hastane_yatak_kapasitesi),
        yesil_alan_orani: getNum(data.lojistik_yasam_kalitesi.yesil_alan_orani),
        osb_sayisi: getNum(data.pazar_ve_maliyet.osb_sayisi),
        tesvik_derecesi: getNum(data.pazar_ve_maliyet.tesvik_derecesi),
        ortalama_metrekare_kira: getNum(data.pazar_ve_maliyet.ortalama_metrekare_kira),
        startup_sayisi: getNum(data.pazar_ve_maliyet.startup_sayisi),
        ihracat_hacmi_milyon_usd: getNum(data.pazar_ve_maliyet.ihracat_hacmi_milyon_usd),
        toplam_nufus: getNum(data.demografi.toplam_nufus),
        nufus_artis_hizi: getNum(data.demografi.nufus_artis_hizi),
        ortalama_hane_geliri: getNum(data.demografi.ortalama_hane_geliri)
    };

    db.query(`UPDATE iller SET ? WHERE il_adi = ?`, [updateData, provinceName], (mysqlErr, result) => {
        if (!mysqlErr && result && result.affectedRows > 0) return res.status(200).json({ success: true, message: `${provinceName} başarıyla güncellendi (MySQL).` });
        
        const dbPath = path.join(__dirname, '..', 'database', 'provinces.json');
        fs.readFile(dbPath, 'utf8', (err, fileData) => {
            if (err) return res.status(500).json({ success: false, message: 'Veritabanı okunamadı.' });
            let provinces = JSON.parse(fileData);
            const idx = provinces.findIndex(p => p.id === provinceId);
            if (idx === -1) provinces.push({ id: provinceId, ad: provinceName, ...data });
            else provinces[idx] = { ...provinces[idx], ...data };
            fs.writeFile(dbPath, JSON.stringify(provinces, null, 2), 'utf8', () => res.status(200).json({ success: true, message: `${provinceName} JSON yedeğine yazıldı.` }));
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
                    if (completed === updates.length) res.status(200).json({ success: true });
                });
            } else {
                completed++;
                if (completed === updates.length) res.status(200).json({ success: true });
            }
        });
    });
};

exports.getRecommendation = (req, res) => {
    getDynamicWeights(weights => {
        fetchRawData(async (error, results) => {
            if (error || !results) return res.status(500).json({ success: false });
            try {
                const result = await provinceService.getSmartAnalysis(results, weights);
                res.status(200).json({ success: true, bestProvince: result.bestProvince, allScores: result.rankedProvinces });
            } catch (err) {
                res.status(400).json({ success: false, message: err.message });
            }
        });
    });
};

exports.getCustomRecommend = (req, res) => {
    fetchRawData(async (error, results) => {
        if (error || !results) return res.status(500).json({ success: false });
        try {
            const result = await provinceService.getCustomAdvice(results, req.body); 
            res.status(200).json({ 
                success: true, 
                rankedProvinces: result.rankedResults.map(r => ({ id: r.id, value: r.score })), 
                topProvincesWithDetails: result.topProvincesWithDetails 
            });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    });
};

exports.getReport = (req, res) => {
    fetchRawData(async (error, results) => {
        if (error || !results) return res.status(500).json({ success: false });
        try {
            const result = await provinceService.getThematicReport(results, req.params.reportType); 
            res.status(200).json({ success: true, data: result.rankedProvinces });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    });
};

exports.getCityAnalysis = (req, res) => {
    const cityName = req.query.il_adi;
    const q1 = `SELECT i.il_adi, i.ihracat_hacmi_milyon_usd as guncel_ihracat, i.liman_var_mi, i.genel_cazibe_puani, ROUND(((i.ihracat_hacmi_milyon_usd - ig.ihracat_hacmi_milyon_usd) / ig.ihracat_hacmi_milyon_usd * 100), 1) as on_yillik_buyume_hizi FROM iller i JOIN iller_gecmis ig ON i.il_adi = ig.il_adi AND ig.yil = 2014 WHERE i.il_adi = ?`;
    const q2 = `SELECT yil, ihracat_hacmi_milyon_usd, toplam_nufus, ortalama_hane_geliri FROM (SELECT 2024 as yil, ihracat_hacmi_milyon_usd, toplam_nufus, ortalama_hane_geliri FROM iller WHERE il_adi = ? UNION ALL SELECT yil, ihracat_hacmi_milyon_usd, toplam_nufus, ortalama_hane_geliri FROM iller_gecmis WHERE il_adi = ?) t ORDER BY yil ASC`;

    db.promise().query(q1, [cityName]).then(([r1]) => {
        return db.promise().query(q2, [cityName, cityName]).then(([r2]) => {
            if(!r1[0]) return res.status(404).json({ success: false, message: "İl bulunamadı." });
            const data = r1[0];
            data.cazibe_yorumu = data.genel_cazibe_puani >= 75 ? "Stratejik Yatırım Bölgesi" : (data.genel_cazibe_puani >= 50 ? "Yükselen Ekonomik Merkez" : "Gelişim Potansiyeli");
            res.status(200).json({ success: true, data, trendData: r2 });
        });
    }).catch(err => res.status(500).json({ success: false, message: err.message }));
};

exports.getSummaryData = (req, res) => {
    getDynamicWeights(weights => {
        fetchRawData(async (error, results) => {
            if (error || !results) return res.status(500).json({ success: false, message: 'Özet verileri çekilemedi.' });
            
            try {
                const analysis = await provinceService.getSmartAnalysis(results, weights);
                const provinces = provinceService.formatProvinces(results);

                const rankedList = analysis.rankedProvinces.map(rp => {
                    const p = provinces.find(prov => prov.id === rp.id);
                    return {
                        ad: p.ad,
                        nufus: p.demografi.toplam_nufus,
                        score: rp.value 
                    };
                }).sort((a, b) => b.score - a.score);

                const top5 = rankedList.slice(0, 5);

                const sqlTrend = "SELECT yil, SUM(ihracat_hacmi_milyon_usd) as toplam_ihracat FROM iller_gecmis GROUP BY yil ORDER BY yil ASC";
                db.query(sqlTrend, (err, trendResults) => {
                    const timelineSummary = trendResults || [];
                    const topCity = top5[0].ad;
                    const totalAvg = analysis.rankedProvinces.reduce((a, b) => a + b.value, 0) / provinces.length;
                    
                    let smartNote = `Efendim, sistem analizine göre mevcut kriterler ışığında **${topCity}** ili yatırım cazibesi bakımından lider konumdadır. `;
                    smartNote += `Türkiye genel ortalaması **${totalAvg.toFixed(2)}** puan seviyesindedir. `;
                    
                    if (timelineSummary.length > 1) {
                        const lastYear = timelineSummary[timelineSummary.length - 1].toplam_ihracat;
                        const prevYear = timelineSummary[timelineSummary.length - 2].toplam_ihracat;
                        const diff = ((lastYear - prevYear) / prevYear * 100).toFixed(1);
                        smartNote += `Ulusal ihracat hacminde son dönemde %${diff > 0 ? '+' : ''}${diff} oranında bir hareketlilik gözlemlenmektedir.`;
                    }

                    res.status(200).json({
                        success: true,
                        summary: {
                            topCity: topCity,
                            avgScore: parseFloat(totalAvg.toFixed(2)),
                            top5: top5,
                            fullList: rankedList,
                            timeline: timelineSummary,
                            insight: smartNote
                        }
                    });
                });
            } catch (err) {
                res.status(500).json({ success: false, message: err.message });
            }
        });
    });
};

// --- ANALİZ YÖNETİMİ (CRUD) ENDPOINTLERİ ---

// [GET] 
exports.listAnalizler = (req, res) => {
    const data = provinceService.getAllAnalizler();
    res.status(200).json({ success: true, count: data.length, data: data });
};

// [POST] 
exports.saveAnaliz = (req, res) => {
    try {
        const yeni = provinceService.createAnaliz(req.body);
        // 201: Created - REST standartlarında yeni kayıt oluşturma kodu
        res.status(201).json({ success: true, message: "Efendim, analiz başarıyla kaydedildi.", data: yeni });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// [PATCH] 
exports.patchAnaliz = (req, res) => {
    const success = provinceService.updateAnalizStatus(req.params.id, req.body.status);
    if (success) {
        res.status(200).json({ success: true, data: success });
    } else {
        res.status(404).json({ success: false, message: "Güncellenecek analiz bulunamadı." });
    }
};

// [DELETE] 
exports.removeAnaliz = (req, res) => {
    try {
        const success = provinceService.deleteAnaliz(req.params.id);
        if (success) {
            res.status(200).json({ success: true, message: "Analiz başarıyla silindi." });
        } else {
            res.status(404).json({ success: false, message: "Silinecek analiz bulunamadı." });
        }
    } catch (err) {
        // error mesajı
        res.status(400).json({ success: false, message: err.message });
    }
};