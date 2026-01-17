/**
 * Analiz Modeli
 */
class Analiz {
    constructor(data = {}) {
        // 1. Kimlik: 
        this.id = data.id || Date.now();
        this.tarih = new Date();

        // 2. Girdiler: 
        this.kriterler = data.weights || {};
        this.mod = data.investorMode || 'default';

        // 3. Çıktılar:
        this.sonuclar = {
            enUygunIl: data.bestProvince || null,
            tumSiralama: data.rankedProvinces || []
        };

        // 4. Durum: 
        this.durum = data.status || 'Tamamlandı';
    }
}

module.exports = Analiz;