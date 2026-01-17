// db.js
const mysql = require('mysql2');
require('dotenv').config(); 

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', 
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASS || '', 
    database: process.env.DB_NAME || 'kds_projesi',
    port: 3306 
});

db.connect(err => {
    if (err) {
        console.error('########################################');
        console.error('❌ KRİTİK HATA: .env üzerinden MySQL bağlantısı kurulamadı!');
        console.error('Lütfen .env dosyasındaki DB_NAME değerinin kds_projesi olduğunu kontrol edin.');
        console.error('Hata Detayı:', err.message); 
        console.error('########################################');
    } else {
        console.log('✅ MySQL veritabanına ENV dosyası üzerinden başarıyla bağlandı (ID: ' + db.threadId + ')');
    }
});

module.exports = db;