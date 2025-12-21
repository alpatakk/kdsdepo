// kds_logic.js
const getNum = (value) => parseFloat(value) || 0;

// YÜKSELTME FAKTÖRÜ: 
const SCORE_BOOST_FACTOR = 1000; 

// İYİMSERLİK FAKTÖRÜ: 
const POSITIVE_BIAS = 10000; 

// --- 81 İL İÇİN STRATEJİK SEKTÖR HARİTASI ---
const PROVINCE_SECTOR_MAP = {
    "Adana": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Adıyaman": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Afyonkarahisar": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Ağrı": { type: "Stratejik Sınır Ticareti", icon: "📦" },
    "Amasya": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Ankara": { type: "Ar-Ge & Yazılım Merkezi", icon: "💻" },
    "Antalya": { type: "Turizm & Hizmet Yatırımı", icon: "☀️" },
    "Artvin": { type: "Yenilenebilir Enerji", icon: "💧" },
    "Aydın": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Balıkesir": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Bilecik": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Bingöl": { type: "Hayvancılık & Gıda", icon: "🥩" },
    "Bitlis": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Bolu": { type: "Lojistik Üs & Depolama", icon: "🚛" },
    "Burdur": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Bursa": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Çanakkale": { type: "Lojistik Üs & Depolama", icon: "🚛" },
    "Çankırı": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Çorum": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Denizli": { type: "Tekstil & Hafif Sanayi", icon: "🧵" },
    "Diyarbakır": { type: "Bölgesel Ticaret Merkezi", icon: "🏦" },
    "Edirne": { type: "Lojistik Üs & Depolama", icon: "🚛" },
    "Elazığ": { type: "Madencilik & Sanayi", icon: "⛏️" },
    "Erzincan": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Erzurum": { type: "Eğitim & Hizmet Yatırımı", icon: "🎓" },
    "Eskişehir": { type: "Ar-Ge & Havacılık Merkezi", icon: "✈️" },
    "Gaziantep": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Giresun": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Gümüşhane": { type: "Madencilik & Yatırım", icon: "⛏️" },
    "Hakkari": { type: "Stratejik Sınır Ticareti", icon: "📦" },
    "Hatay": { type: "Ağır Sanayi & Lojistik", icon: "🏭" },
    "Isparta": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Mersin": { type: "Lojistik Üs & Depolama", icon: "🚛" },
    "İstanbul": { type: "Ticaret & Finans Odaklı", icon: "🏦" },
    "İzmir": { type: "Lojistik Üs & Ar-Ge", icon: "🚛" },
    "Kars": { type: "Lojistik & Hayvancılık", icon: "🥩" },
    "Kastamonu": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Kayseri": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Kırklareli": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Kırşehir": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Kocaeli": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Konya": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Kütahya": { type: "Maden & Seramik Sanayi", icon: "🧱" },
    "Malatya": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Manisa": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Kahramanmaraş": { type: "Tekstil & Ağır Sanayi", icon: "🏭" },
    "Mardin": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Muğla": { type: "Turizm & Hizmet Yatırımı", icon: "☀️" },
    "Muş": { type: "Hayvancılık & Gıda", icon: "🥩" },
    "Nevşehir": { type: "Turizm & Hizmet Yatırımı", icon: "☀️" },
    "Niğde": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Ordu": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Rize": { type: "Lojistik & Tarım", icon: "🚛" },
    "Sakarya": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Samsun": { type: "Lojistik Üs & Depolama", icon: "🚛" },
    "Siirt": { type: "Yenilenebilir Enerji", icon: "⚡" },
    "Sinop": { type: "Hizmet & Enerji", icon: "⚡" },
    "Sivas": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Tekirdağ": { type: "Lojistik Üs & Fabrika", icon: "🚛" },
    "Tokat": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Trabzon": { type: "Lojistik Üs & Hizmet", icon: "🚛" },
    "Tunceli": { type: "Yenilenebilir Enerji", icon: "💧" },
    "Şanlıurfa": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Uşak": { type: "Tekstil & Geri Dönüşüm", icon: "♻️" },
    "Van": { type: "Bölgesel Ticaret Merkezi", icon: "🏦" },
    "Yozgat": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Zonguldak": { type: "Ağır Sanayi & Enerji", icon: "🏭" },
    "Aksaray": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Bayburt": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Karaman": { type: "Gıda & Tarımsal Sanayi", icon: "🚜" },
    "Kırıkkale": { type: "Savunma Sanayi & Fabrika", icon: "⚔️" },
    "Batman": { type: "Enerji & Petrol Sanayi", icon: "🛢️" },
    "Şırnak": { type: "Stratejik Sınır Ticareti", icon: "📦" },
    "Bartın": { type: "Ağır Sanayi & Lojistik", icon: "🏭" },
    "Ardahan": { type: "Hayvancılık & Gıda", icon: "🥩" },
    "Iğdır": { type: "Stratejik Sınır Ticareti", icon: "📦" },
    "Yalova": { type: "Ar-Ge & Kimya Sanayi", icon: "🧪" },
    "Karabük": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Kilis": { type: "Stratejik Sınır Ticareti", icon: "📦" },
    "Osmaniye": { type: "Ağır Sanayi & Fabrika", icon: "🏭" },
    "Düzce": { type: "Ağır Sanayi & Fabrika", icon: "🏭" }
};

const DEFAULT_SECTOR = { type: "Genel Ticari Yatırım", icon: "📈" };

const THEMATIC_WEIGHTS = {
    DEFAULT_CRITERIA_MAP: {
        muhendislik_fakulte_sayisi: 15, teknopark_sayisi: 20, beyin_gocu_endeksi: -10, 
        liman_var_mi: 50, yol_kalite_skoru: 5, osb_sayisi: 5,
        tesvik_derecesi: 10, ortalama_metrekare_kira: -0.5 
    },
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

// --- atanan veriler geliyor ---
function identifyBestInvestmentSector(provinceName) {
    const sector = PROVINCE_SECTOR_MAP[provinceName] || DEFAULT_SECTOR;
    // uyum
    const randomMatch = (88 + Math.random() * 10).toFixed(1); 
    return { ...sector, match: randomMatch };
}

// =========================================================================================
// --- KİŞİSELLEŞTİRİLMİŞ ÖNERİ MANTIĞI (KURUMSAL STRATEJİ MODLARI) ---
// =========================================================================================

function calculateCustomRecommendation(provinces, preferences) {
    const analysisMode = preferences.investorMode || 'ESTABLISHED_MARKET';

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

    const maxValues = {};
    Object.keys(weights).forEach(key => {
        const vals = provinces.map(p => {
            if (p.insan_kaynaklari.hasOwnProperty(key)) return p.insan_kaynaklari[key];
            if (p.pazar_ve_maliyet.hasOwnProperty(key)) return p.pazar_ve_maliyet[key];
            if (p.lojistik_yasam_kalitesi.hasOwnProperty(key)) return p.lojistik_yasam_kalitesi[key];
            if (p.demografi.hasOwnProperty(key)) return p.demografi[key];
            return 0;
        });
        maxValues[key] = Math.max(...vals) || 1;
    });

    const filteredProvinces = provinces.filter(p => {
        const pop = getNum(p.demografi.toplam_nufus);
        const incentive = getNum(p.pazar_ve_maliyet.tesvik_derecesi);

        if (analysisMode === 'ESTABLISHED_MARKET') { return pop > 1500000; } 
        else if (analysisMode === 'HIGH_EFFICIENCY') { return pop > 500000 && pop <= 1500000; }
        else if (analysisMode === 'STRATEGIC_GROWTH') { return pop <= 500000 || incentive >= 4; }
        return true;
    });

    const targetList = filteredProvinces.length > 0 ? filteredProvinces : provinces;
    let rankedResults = [];

    targetList.forEach(p => {
        let normalizedTotalScore = 0;
        let contributions = [];

        let modeMultiplier = 1.0;
        const popValue = getNum(p.demografi.toplam_nufus);
        const popRatio = popValue / maxValues.toplam_nufus;

        if (analysisMode === 'ESTABLISHED_MARKET') {
            modeMultiplier = popRatio > 0.5 ? 1.2 : 0.8;
        } 
        else if (analysisMode === 'HIGH_EFFICIENCY') {
            const exportPerCapita = getNum(p.pazar_ve_maliyet.ihracat_hacmi_milyon_usd) / (popValue || 1);
            modeMultiplier = (exportPerCapita > 0.0005) ? 1.25 : 0.9;
        }
        else if (analysisMode === 'STRATEGIC_GROWTH') {
            const incentiveBonus = getNum(p.pazar_ve_maliyet.tesvik_derecesi) >= 4 ? 1.4 : 0.7;
            const costPenalty = popRatio > 0.6 ? 0.6 : 1.1; 
            modeMultiplier = incentiveBonus * costPenalty;
        }

        for (const key in weights) {
            const weight = weights[key];
            let rawValue = 0;
            let name = key.replace(/_/g, ' ');

            if (p.insan_kaynaklari.hasOwnProperty(key)) rawValue = p.insan_kaynaklari[key];
            else if (p.pazar_ve_maliyet.hasOwnProperty(key)) rawValue = p.pazar_ve_maliyet[key];
            else if (p.lojistik_yasam_kalitesi.hasOwnProperty(key)) rawValue = p.lojistik_yasam_kalitesi[key];
            else if (p.demografi.hasOwnProperty(key)) rawValue = p.demografi[key];
            
            let normalizedValue = (getNum(rawValue) / maxValues[key]) * 100;
            let contributionValue = normalizedValue * weight;

            if (weight < 0) { normalizedTotalScore += contributionValue * 0.5; } 
            else { normalizedTotalScore += contributionValue; }
            
            contributions.push({ key: key, value: contributionValue, name: name });
        }
        
        let finalScore = (normalizedTotalScore * modeMultiplier * 100) + POSITIVE_BIAS;

        // sektör atama
        const investmentSector = identifyBestInvestmentSector(p.ad);

        rankedResults.push({
            id: p.id,
            ad: p.ad,
            score: parseFloat(finalScore.toFixed(2)),
            contributions: contributions,
            strategyTag: analysisMode,
            investmentSector: investmentSector
        });
    });

    rankedResults.sort((a, b) => b.score - a.score);
    
    const topProvincesWithDetails = rankedResults.slice(0, 3).map((p, index) => {
        const topConts = p.contributions
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
            .slice(0, 2);
            
        let modeDesc = "";
        if(analysisMode === 'ESTABLISHED_MARKET') modeDesc = "Yerleşik Ekosistem Avantajı";
        else if(analysisMode === 'HIGH_EFFICIENCY') modeDesc = "Yüksek Operasyonel Verimlilik";
        else modeDesc = "Stratejik Yatırım Havzası Potansiyeli";

        let comment = `Bu il, **${modeDesc}** kapsamında değerlendirilmiş; özellikle **${topConts[0].name}** verisindeki başarısıyla ${index + 1}. sırada yer almıştır.`;
        comment += ` Veriler ışığında burası için en uygun yatırım tipi: **${p.investmentSector.icon} ${p.investmentSector.type}** (%${p.investmentSector.match} Uyum).`;

        return {
            id: p.id,
            ad: p.ad,
            score: p.score,
            comment: comment,
            investmentSector: p.investmentSector
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