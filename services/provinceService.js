const Analiz = require('../models/Analiz'); 
const kdsLogic = require('../kds_logic'); 

//  CRUD işlemleri için analizleri bellekte tutacak depo
let analizDeposu = []; 

class ProvinceService {
    /**
     *  Ham SQL verisini  kullanılan nesne yapısına dönüştürme.
     */
    formatProvinces(results) {
        if (!results || !Array.isArray(results)) return [];
        
        return results.map(row => {
            const toSVGId = (text) => {
                if (!text) return '';
                return text.trim()
                    .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/Ş/g, 's').replace(/ş/g, 's')
                    .replace(/Ç/g, 'c').replace(/ç/g, 'c').replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
                    .replace(/Ü/g, 'u').replace(/ü/g, 'u').replace(/Ö/g, 'o').replace(/ö/g, 'o')
                    .replace(/ /g, '_').toLowerCase();
            };

            return {
                id: toSVGId(row.il_adi),
                ad: row.il_adi,
                demografi: {
                    toplam_nufus: parseFloat(row.toplam_nufus) || 0,
                    nufus_artis_hizi: parseFloat(row.nufus_artis_hizi) || 0,
                    ortalama_hane_geliri: parseFloat(row.ortalama_hane_geliri) || 0
                },
                insan_kaynaklari: {
                    muhendislik_fakulte_sayisi: parseFloat(row.muhendislik_fakulte_sayisi) || 0,
                    universite_ogrenci_sayisi: parseFloat(row.universite_ogrenci_sayisi) || 0,
                    teknopark_sayisi: parseFloat(row.teknopark_sayisi) || 0,
                    beyin_gocu_endeksi: parseFloat(row.beyin_gocu_endeksi) || 0,
                    yabanci_dil_orani: parseFloat(row.yabanci_dil_orani) || 0
                },
                lojistik_yasam_kalitesi: {
                    havalimani_tipi: row.havalimani_tipi, 
                    liman_var_mi: parseFloat(row.liman_var_mi) || 0,
                    yol_kalite_skoru: parseFloat(row.yol_kalite_skoru) || 0,
                    hastane_yatak_kapasitesi: parseFloat(row.hastane_yatak_kapasitesi) || 0,
                    yesil_alan_orani: parseFloat(row.yesil_alan_orani) || 0
                },
                pazar_ve_maliyet: {
                    osb_sayisi: parseFloat(row.osb_sayisi) || 0,
                    tesvik_derecesi: parseFloat(row.tesvik_derecesi) || 0,
                    ortalama_metrekare_kira: parseFloat(row.ortalama_metrekare_kira) || 0,
                    startup_sayisi: parseFloat(row.startup_sayisi) || 0,
                    ihracat_hacmi_milyon_usd: parseFloat(row.ihracat_hacmi_milyon_usd) || 0,
                    yabanci_yatirim_endeksi: parseFloat(row.yabanci_yatirim_endeksi) || 0, 
                    kamu_tesvik_skoru: parseFloat(row.kamu_tesvik_skoru) || 0
                },
                genel_cazibe_puani: parseFloat(row.genel_cazibe_puani) || 0
            };
        });
    }

    // --- ANALİZ CRUD İŞLEMLERİ ---

    // [CREATE] Yeni Analiz Oluşturma
    async createAnaliz(analizGirdisi) {
        // madde 2 modeli kullanılan
        const yeniAnaliz = new Analiz({
            weights: analizGirdisi.weights,
            bestProvince: analizGirdisi.bestProvince,
            status: 'Tamamlandı'
        });
        analizDeposu.push(yeniAnaliz);
        return yeniAnaliz;
    }

    // [READ] Tüm Analizleri Listeleme
    getAllAnalizler() {
        return analizDeposu;
    }

    // [UPDATE] Analiz Durumunu Güncelleme
    updateAnalizStatus(id, yeniDurum) {
        const analiz = analizDeposu.find(a => a.analizId == id);
        if (analiz) {
            analiz.durum = yeniDurum;
            return analiz;
        }
        return null;
    }

    // [DELETE] Analiz Silme 
    deleteAnaliz(id) {
        // İŞ KURALI 1:  son 1 dakika içinde yapılan analizler "Sistem Koruması" gereği silinemez.
        const analiz = analizDeposu.find(a => a.analizId == id);
        if (analiz) {
            const gecenSure = (Date.now() - analiz.analizId) / 1000;
            if (gecenSure < 60) {
                throw new Error("Efendim, henüz çok taze olan analizler güvenlik gereği hemen silinemez.");
            }
        }

        const initialLength = analizDeposu.length;
        analizDeposu = analizDeposu.filter(a => a.analizId != id);
        return analizDeposu.length < initialLength;
    }

    // --- ANALİZ VE RAPORLAMA ---

    async getSmartAnalysis(rawProvinces, weights) {
        if (!rawProvinces || rawProvinces.length === 0) throw new Error('İl verisi bulunamadı.');

        // İŞ KURALI 2:  eğer girilen ağırlıkların toplamı negatif ise analiz başlatılamaz.
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        if (totalWeight < 0) {
            throw new Error("Efendim, negatif toplam ağırlık ile stratejik analiz yapılması mantıksal olarak mümkün değildir.");
        }

        const provinces = this.formatProvinces(rawProvinces);
        const result = kdsLogic.calculateSmartScoreAndComment(provinces, weights, 'default');
        
        if (!result || !result.bestProvince) {
            throw new Error('Analiz motoru sonuç üretemedi.');
        }
        return result;
    }

    async getCustomAdvice(rawProvinces, preferences) {
        const provinces = this.formatProvinces(rawProvinces);
        if (!preferences.investorMode) preferences.investorMode = 'ESTABLISHED_MARKET';
        
        const result = kdsLogic.calculateCustomRecommendation(provinces, preferences);
        
        if (!result.topProvincesWithDetails || result.topProvincesWithDetails.length === 0) {
            throw new Error('Kriterlere uygun stratejik il bulunamadı.');
        }
        return result;
    }

    async getThematicReport(rawProvinces, reportType) {
        if (!reportType) throw new Error('Rapor tipi belirtilmedi.');
        const provinces = this.formatProvinces(rawProvinces);
        return kdsLogic.calculateThematicReport(provinces, reportType);
    }
}

module.exports = new ProvinceService();