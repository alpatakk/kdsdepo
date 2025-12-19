// db.js
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

module.exports = db;