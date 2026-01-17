# 🌍 GlobalTech | CBS Tabanlı Stratejik Karar Destek Sistemi

Bu proje, Türkiye'nin 81 iline ait sosyo-ekonomik, lojistik ve demografik verileri analiz ederek yatırımcılar için en uygun lokasyonları belirleyen, katı **MVC (Model-View-Controller)** mimarisi üzerine inşa edilmiş bir Karar Destek Sistemi (KDS) platformudur.

## 1. Projenin Amacı
Projenin temel amacı; gerçekçi bir iş problemi üzerinden sunucu taraflı yazılım geliştirme becerilerini sergilemek, MVC mimarisini doğru ve tutarlı biçimde uygulamak ve REST prensiplerine uygun bir API tasarlamaktır. Uygulama; veri modeli, iş mantığı ve uç noktaların birbirinden tamamen ayrıştırıldığı, okunabilir ve ölçeklenebilir bir yapı sunar.

## 2. Senaryo Tanımı ve İş Kuralları
Sistem, bir yatırımcının bütçe ve stratejik önceliklerine göre (Teknopark sayısı, OSB kapasitesi, kira maliyeti vb.) şehirleri puanlar. Sistemde veri tutarlılığı ve mantıksal doğruluk için aşağıdaki **zorunlu iş kuralları** uygulanmaktadır:

* **Senaryo 1 (Analiz Güvenlik Kilidi):** Stratejik analiz motoru çalıştırılırken girilen kriter ağırlıklarının toplamı negatif olamaz. Mantıksal olarak negatif ağırlıklı bir analiz yapılamayacağı için sistem bu isteği `400 Bad Request` hatasıyla engeller.
* **Senaryo 2 (Taze Kayıt Koruması):** Veri bütünlüğü gereği, oluşturulma zamanı üzerinden henüz 60 saniye geçmemiş (yeni) bir analiz kaydı sistemden silinemez. Bu kural, sistemdeki hızlı ve hatalı veri manipülasyonunu engellemek amacıyla eklenmiştir.

## 3. Proje Mimari Yapısı (MVC)
Uygulama, akademik standartlara ve katı MVC prensiplerine uygun olarak klasörlenmiştir:



* **Model:** Veri yapısının ve analiz sınıflarının tanımlandığı katman (`models/Analiz.js`).
* **View:** Kullanıcıya sunulan arayüz, interaktif harita ve grafik bileşenleri (`views/`, `public/`).
* **Controller:** HTTP isteklerini karşılayan ve servislerle koordinasyonu sağlayan katman (`controllers/provinceController.js`).
* **Service & Logic:** Karmaşık puanlama algoritmalarının ve iş kurallarının işletildiği çekirdek katman (`services/provinceService.js`, `kds_logic.js`).
* **Router:** REST uç noktalarının tanımlandığı ve isteklerin yönlendirildiği katman (`routes/`).

## 4. Veri Modeli ve ER Diyagramı
Sistem; iller, geçmiş ekonomik veriler, kronoloji ve kullanıcı analiz kayıtları olmak üzere birbiriyle ilişkili tablolar üzerinden çalışmaktadır.



## 5. API Endpoint Listesi (RESTful)
Tüm uç noktalar REST prensiplerine uygun olarak isimlendirilmiş ve CRUD operasyonlarını kapsayacak şekilde tasarlanmıştır:

| Method | Endpoint | Tanım | CRUD Karşılığı |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/provinces` | Tüm illeri ve verilerini listeler. | Read |
| **POST** | `/api/analiz` | Yeni bir analiz sonucu oluşturur. | Create |
| **GET** | `/api/analiz` | Kaydedilmiş tüm analizleri getirir. | Read |
| **PATCH** | `/api/analiz/:id` | Analiz durumunu (Tamamlandı/Beklemede vb.) günceller. | Update |
| **DELETE** | `/api/analiz/:id` | Analiz kaydını siler (İş Kuralı 2 Uygulanır). | Delete |
| **GET** | `/api/city-analysis` | Belirli bir ilin 10 yıllık ekonomik karnesini getirir. | Read |
| **POST** | `/api/custom-recommend` | Kişiselleştirilmiş stratejik yatırım önerisi yapar. | - |

## 6. Kurulum ve Çalıştırma

1.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```
2.  **Çevresel Değişkenleri Yapılandırın:**
    `.env.example` dosyasını `.env` olarak kopyalayın ve veritabanı bilgilerinizi girin:
    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=sifreniz
    DB_NAME=kds_projesi
    ```
3.  **Veritabanını Hazırlayın:**
    MySQL üzerinde `kds_projesi` isimli bir veritabanı oluşturun ve tabloları import edin.
4.  **Uygulamayı Çalıştırın:**
    ```bash
    npm start
    ```

---
**Teslimat Bileşenleri:**
- [x] Katı MVC Yapısı
- [x] CRUD İşlemleri (Analiz Yönetimi)
- [x] 2 Özel İş Kuralı (Business Rules)
- [x] Environment Config (.env)
- [x] Detaylı API Endpoint Listesi