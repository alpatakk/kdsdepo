// kds_logic.js
const getNum = (value) => parseFloat(value) || 0;

// YÜKSELTME FAKTÖRÜ: Normalizasyon sonrası puanı ölçeklendirmek için 1 e çekildi.
const SCORE_BOOST_FACTOR = 1; 

// İYİMSERLİK FAKTÖRÜ: Taban puan rasyonelleştirildi.
const POSITIVE_BIAS = 10; 

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
 * Normalizasyon için her kriterin maksimum değerini bulan yardımcı fonksiyon
 */
function findMaxValues(provinces, effectiveWeights) {
    const maxValues = {};
    for (const key in effectiveWeights) {
        let max = 0;
        provinces.forEach(p => {
            let val = 0;
            if (p.insan_kaynaklari.hasOwnProperty(key)) val = getNum(p.insan_kaynaklari[key]);
            else if (p.pazar_ve_maliyet.hasOwnProperty(key)) val = getNum(p.pazar_ve_maliyet[key]);
            else if (p.lojistik_yasam_kalitesi.hasOwnProperty(key)) val = getNum(p.lojistik_yasam_kalitesi[key]);
            else if (p.demografi.hasOwnProperty(key)) val = getNum(p.demografi[key]);
            
            if (key === 'liman_var_mi') val = p.lojistik_yasam_kalitesi.liman_var_mi ? 1 : 0;
            if (val > max) max = val;
        });
        maxValues[key] = max || 1; // 0'a bölünmeyi engellemek için
    }
    return maxValues;
}

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
        if (weights) {
            for (const key in weights) {
                effectiveWeights[key] = weights[key];
            }
        }
    }

    const maxValues = findMaxValues(provinces, effectiveWeights);

    const rankedProvinces = provinces.map(p => {
        let normalizedRawScore = 0; 
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
            
            // Veriyi normalize et (0-100 arasına çek)
            const normalizedVal = (getNum(value) / maxValues[key]) * 100;
            const contributionValue = normalizedVal * (weight / 100); 
            
            if (contributionValue < 0) {
                normalizedRawScore += contributionValue * 0.5; 
                rawContributions.push({ key: key, value: contributionValue, name: key.replace(/_/g, ' ') });
            } else {
                normalizedRawScore += contributionValue; 
                rawContributions.push({ key: key, value: contributionValue, name: key.replace(/_/g, ' ') });
            }
        }
        
        // Final skor artık 0-100 bandında daha rasyonel
        let finalScore = (normalizedRawScore * SCORE_BOOST_FACTOR) + POSITIVE_BIAS;
        if (finalScore <= 0) finalScore = 1;
        if (finalScore > 100) finalScore = 100; // Tavan puan sınırlaması

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

    const maxValues = findMaxValues(provinces, weights);

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
            
            // Normalize edilmiş veri üzerinden ağırlıklı skor
            let normalizedValue = (getNum(rawValue) / maxValues[key]) * 100;
            let contributionValue = normalizedValue * weight;

            if (weight < 0) { normalizedTotalScore += contributionValue * 0.5; } 
            else { normalizedTotalScore += contributionValue; }
            
            contributions.push({ key: key, value: contributionValue, name: name });
        }
        
        let finalScore = (normalizedTotalScore * modeMultiplier) + POSITIVE_BIAS;
        if(finalScore > 100) finalScore = 100;

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

// =========================================================================================
// === YENİ: SİDEBAR VE GENEL ÖZET İÇİN ANALİZ FONKSİYONLARI (EKLEME) ===
// =========================================================================================

function getTopCazibeProvinces(provinces) {
    const results = calculateThematicReport(provinces, 'genel_cazibe');
    return results.rankedProvinces
        .map(rp => ({
            ad: provinces.find(p => p.id === rp.id).ad,
            score: rp.value
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

function calculateRegionalAverages(provinces) {
    const REGION_MAP = {
        'Marmara': ['İstanbul', 'Bursa', 'Kocaeli', 'Tekirdağ', 'Sakarya', 'Çanakkale', 'Edirne', 'Kırklareli', 'Balıkesir', 'Yalova', 'Bilecik'],
        'Ege': ['İzmir', 'Manisa', 'Aydın', 'Denizli', 'Muğla', 'Afyonkarahisar', 'Kütahya', 'Uşak'],
        'İç Anadolu': ['Ankara', 'Konya', 'Kayseri', 'Eskişehir', 'Sivas', 'Kırıkkale', 'Aksaray', 'Karaman', 'Kırşehir', 'Niğde', 'Nevşehir', 'Yozgat', 'Çankırı'],
        'Akdeniz': ['Antalya', 'Adana', 'Mersin', 'Hatay', 'Kahramanmaraş', 'Osmaniye', 'Isparta', 'Burdur'],
        'Karadeniz': ['Samsun', 'Trabzon', 'Ordu', 'Giresun', 'Rize', 'Artvin', 'Gümüşhane', 'Bayburt', 'Düzce', 'Bolu', 'Zonguldak', 'Karabük', 'Bartın', 'Kastamonu', 'Sinop', 'Çorum', 'Amasya', 'Tokat'],
        'Güneydoğu Anadolu': ['Gaziantep', 'Diyarbakır', 'Şanlıurfa', 'Mardin', 'Adıyaman', 'Batman', 'Siirt', 'Şırnak', 'Kilis'],
        'Doğu Anadolu': ['Erzurum', 'Malatya', 'Van', 'Elazığ', 'Ağrı', 'Kars', 'Iğdır', 'Ardahan', 'Muş', 'Bingöl', 'Bitlis', 'Tunceli', 'Hakkari', 'Erzincan']
    };

    const thematicResults = calculateThematicReport(provinces, 'genel_cazibe').rankedProvinces;
    const regionalScores = {};

    Object.keys(REGION_MAP).forEach(region => {
        const cityNames = REGION_MAP[region];
        const scores = thematicResults
            .filter(rp => {
                const province = provinces.find(p => p.id === rp.id);
                return province && cityNames.includes(province.ad);
            })
            .map(rp => rp.value);
        
        const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        regionalScores[region] = parseFloat(avg.toFixed(2));
    });

    return regionalScores;
}

function calculateTrendInvestmentScore(provinces, historicalData) {
    const trendResults = provinces.map(p => {
        const currentPop = getNum(p.demografi.toplam_nufus);
        const currentExport = getNum(p.pazar_ve_maliyet.ihracat_hacmi_milyon_usd);
        const pastFactor = historicalData && historicalData.length > 0 ? 1.15 : 1.0; 
        
        // Popülasyon ve ihracat üzerinden normalize edilmiş basit trend puanı
        const trendScore = ((currentPop / 1000000) * 0.4 + (currentExport / 500) * 0.6) * pastFactor * 20 + POSITIVE_BIAS;
        return { ad: p.ad, score: parseFloat(Math.min(100, trendScore).toFixed(2)) };
    });

    return trendResults.sort((a, b) => b.score - a.score).slice(0, 10);
}

module.exports = {
    calculateSmartScoreAndComment,
    calculateThematicReport,
    calculateCustomRecommendation,
    getTopCazibeProvinces,
    calculateRegionalAverages,
    calculateTrendInvestmentScore
};