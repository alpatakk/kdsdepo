// kds_logic.js
const getNum = (value) => parseFloat(value) || 0;

// YÜKSELTME FAKTÖRÜ: İller arası farkı abartmak için 1000 ile çarpıyoruz.
const SCORE_BOOST_FACTOR = 1000; 

// İYİMSERLİK FAKTÖRÜ: En düşük skoru bile yukarı çekmek için tüm skorlara eklenir.
const POSITIVE_BIAS = 10000; 

// Tematik ağırlıklar (Rapor butonları için kullanılır)
const THEMATIC_WEIGHTS = {
    // Akıllı Öneri için yönetici ayarları 
    DEFAULT_CRITERIA_MAP: {
        muhendislik_fakulte_sayisi: 15, teknopark_sayisi: 20, beyin_gocu_endeksi: -10, 
        liman_var_mi: 50, yol_kalite_skoru: 5, osb_sayisi: 5,
        tesvik_derecesi: 10, ortalama_metrekare_kira: -0.5 
    },
    // Rapor butonu tiplerine göre tematik ağırlıklar 
    teknoloji_ofisi: {
        teknopark_sayisi: 60, muhendislik_fakulte_sayisi: 30, startup_sayisi: 10, beyin_gocu_endeksi: -15
    },
    lojistik_depo: {
        liman_var_mi: 60, yol_kalite_skoru: 30, ihracat_hacmi_milyon_usd: 10
    },
    genel_cazibe: {
        toplam_nufus: 10, osb_sayisi: 10, teknopark_sayisi: 10, hastane_yatak_kapasitesi: 10, ortalama_hane_geliri: 10, tesvik_derecesi: 10, yol_kalite_skoru: 5
    },
    demografi_pazar: {
        toplam_nufus: 30, nufus_artis_hizi: 10, ortalama_hane_geliri: 30, ortalama_metrekare_kira: -10
    }
};

/**
 * Haritadaki Raporlar İçin Mevcut Skorlama Mantığı
 */
function calculateSmartScoreAndComment(provinces, weights, reportType = 'default') {
    
    let maxScore = -Infinity;
    let bestProvinceData = null;
    let effectiveWeights = {};

    if (reportType !== 'default' && THEMATIC_WEIGHTS[reportType]) {
        effectiveWeights = THEMATIC_WEIGHTS[reportType];
    } else {
        effectiveWeights = { ...THEMATIC_WEIGHTS.DEFAULT_CRITERIA_MAP }; 
        for (const key in weights) {
            effectiveWeights[key] = weights[key];
        }
    }


    const rankedProvinces = provinces.map(p => {
        let rawScore = 0; 
        const rawContributions = [];
        
        for (const key in effectiveWeights) {
            const weight = effectiveWeights[key];
            let value;

            if (p.insan_kaynaklari.hasOwnProperty(key)) { value = p.insan_kaynaklari[key]; }
            else if (p.pazar_ve_maliyet.hasOwnProperty(key)) { value = p.pazar_ve_maliyet[key]; }
            else if (p.lojistik_yasam_kalitesi.hasOwnProperty(key)) { value = p.lojistik_yasam_kalitesi[key]; }
            else if (p.demografi.hasOwnProperty(key)) { value = p.demografi[key]; }
            else { 
                value = 0;
                if (reportType !== 'default' && weight === 0) continue; 
            }

            if (key === 'liman_var_mi') {
                value = p.lojistik_yasam_kalitesi.liman_var_mi ? 1 : 0;
            }
            
            const contributionValue = getNum(value) * weight;
            
            if (contributionValue < 0) {
                rawScore += contributionValue * 0.5; 
                rawContributions.push({ key: key, value: contributionValue, name: key.replace(/_/g, ' ') });
            } else {
                rawScore += contributionValue; 
                rawContributions.push({ key: key, value: contributionValue, name: key.replace(/_/g, ' ') });
            }
        }
        
        let finalScore = (rawScore * SCORE_BOOST_FACTOR) + POSITIVE_BIAS;
        if (finalScore <= 0) finalScore = 1; 

        const finalContributions = [];
        rawContributions.forEach(c => {
             const finalValue = (c.value < 0 ? c.value * 0.5 : c.value) * SCORE_BOOST_FACTOR;
             finalContributions.push({ ...c, value: finalValue });
        });

        finalScore = parseFloat(finalScore.toFixed(2));
        if (finalScore > maxScore) {
            maxScore = finalScore;
            bestProvinceData = { id: p.id, ad: p.ad, score: finalScore, contributions: finalContributions };
        }
        
        return { id: p.id, value: finalScore }; 
    });

    let comment = 'Tematik raporlama yapıldı. İl bazlı yorum için Akıllı Öneri sekmesini kullanın.';
    if (reportType === 'default' && bestProvinceData) {
        const topContributions = bestProvinceData.contributions
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
            .slice(0, 3);
            
        comment = `Mevcut kriter ağırlıklarınıza göre en yüksek skorlu il **${bestProvinceData.ad}** (${bestProvinceData.score.toLocaleString('tr-TR')} puan) olmuştur.`;
        comment += ` Güçlü yanları: `;
        
        topContributions.forEach((c, index) => {
            const etki = c.value >= 0 ? 'Pozitif Güç' : 'Negatif Etkiyi Azaltma';
            comment += ` ${c.name} (${etki})`;
            if (index < topContributions.length - 1) comment += ' | ';
        });
    }

    return {
        bestProvince: bestProvinceData,
        comment: comment,
        rankedProvinces: rankedProvinces 
    };
}

function calculateThematicReport(provinces, reportType) {
    return calculateSmartScoreAndComment(provinces, null, reportType);
}

// =========================================================================================
// --- KİŞİSELLEŞTİRİLMİŞ ÖNERİ MANTIĞI (3'LÜ KART VE 10 KRİTER) ---
// =========================================================================================

/**
 * Normalizasyon ve 10 Farklı Slider Verisine Dayalı Seçici Analiz Motoru
 */
function calculateCustomRecommendation(provinces, preferences) {
    // 1. Ağırlıkları Tanımla (0-1 arasına normalize et)
    const weights = {
        teknopark_sayisi: getNum(preferences.teknopark) / 100,
        muhendislik_fakulte_sayisi: getNum(preferences.muhendislik) / 100,
        osb_sayisi: getNum(preferences.osb) / 100,
        universite_ogrenci_sayisi: getNum(preferences.ogrenci) / 100,
        yol_kalite_skoru: getNum(preferences.yol) / 100,
        tesvik_derecesi: getNum(preferences.tesvik) / 100,
        ihracat_hacmi_milyon_usd: getNum(preferences.ihracat) / 100,
        toplam_nufus: getNum(preferences.nufus) / 100,
        ortalama_metrekare_kira: -(getNum(preferences.kira) / 100), 
        beyin_gocu_endeksi: -(getNum(preferences.goc) / 100)
    };

    // 2. Normalizasyon için her kriterin Türkiye çapındaki MAX değerini hesapla
    const maxValues = {};
    Object.keys(weights).forEach(key => {
        const vals = provinces.map(p => {
            if (p.insan_kaynaklari.hasOwnProperty(key)) return p.insan_kaynaklari[key];
            if (p.pazar_ve_maliyet.hasOwnProperty(key)) return p.pazar_ve_maliyet[key];
            if (p.lojistik_yasam_kalitesi.hasOwnProperty(key)) return p.lojistik_yasam_kalitesi[key];
            if (p.demografi.hasOwnProperty(key)) return p.demografi[key];
            return 0;
        });
        maxValues[key] = Math.max(...vals) || 1; // 0'a bölünmeyi engelle
    });

    let rankedResults = [];

    // 3. Her il için "Normalleştirilmiş Ağırlıklı Puan" (MCDA) Hesapla
    provinces.forEach(p => {
        let normalizedTotalScore = 0;
        let contributions = [];

        for (const key in weights) {
            const weight = weights[key];
            let rawValue = 0;
            let name = key.replace(/_/g, ' ');

            if (p.insan_kaynaklari.hasOwnProperty(key)) rawValue = p.insan_kaynaklari[key];
            else if (p.pazar_ve_maliyet.hasOwnProperty(key)) rawValue = p.pazar_ve_maliyet[key];
            else if (p.lojistik_yasam_kalitesi.hasOwnProperty(key)) rawValue = p.lojistik_yasam_kalitesi[key];
            else if (p.demografi.hasOwnProperty(key)) rawValue = p.demografi[key];
            
            // Veriyi 0-100 ölçeğine çek
            let normalizedValue = (getNum(rawValue) / maxValues[key]) * 100;
            let contributionValue = normalizedValue * weight;

            // Negatif etkileri (Kira, Beyin Göçü) iyimserlik payıyla ekle
            if (weight < 0) {
                normalizedTotalScore += contributionValue * 0.5;
            } else {
                normalizedTotalScore += contributionValue;
            }
            
            contributions.push({ key: key, value: contributionValue, name: name });
        }
        
        // Skorları okunabilir (5000 - 15000 bandı) büyüklüğe getir
        let finalScore = (normalizedTotalScore * 100) + POSITIVE_BIAS;

        rankedResults.push({
            id: p.id,
            ad: p.ad,
            score: parseFloat(finalScore.toFixed(2)),
            contributions: contributions
        });
    });

    // 4. Sırala ve En İyi 3'ü Seç
    rankedResults.sort((a, b) => b.score - a.score);
    
    const topProvincesWithDetails = rankedResults.slice(0, 3).map((p, index) => {
        // İlin kazandığı en yüksek 2 katkıyı bul
        const topConts = p.contributions
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
            .slice(0, 2);
            
        let comment = `Bu il, seçtiğiniz öncelikler arasında özellikle **${topConts[0].name}** ve **${topConts[1].name}** verilerindeki Türkiye geneline göre üstün performansıyla ${index + 1}. sırada yer almıştır.`;

        return {
            id: p.id,
            ad: p.ad,
            score: p.score,
            comment: comment
        };
    });

    return {
        rankedResults: rankedResults, 
        topProvincesWithDetails: topProvincesWithDetails 
    };
}

module.exports = {
    calculateSmartScoreAndComment,
    calculateThematicReport,
    calculateCustomRecommendation
};