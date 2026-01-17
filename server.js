const express = require('express');
const path = require('path');
const db = require('./db'); 
// DEĞİŞİKLİK 1: Artık doğrudan dosyayı değil, klasörün 'index.js'ini (mainRouter) çağırıyoruz
const mainRouter = require('./routes/index'); 

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(express.static('views'));

// DEĞİŞİKLİK 2: Artık 'provinceRoutes' yerine 'mainRouter' kullanıyoruz
app.use('/api', mainRouter); 

app.listen(port, () => {
    console.log(`🚀 Sunucu http://localhost:${port} adresinde MVC yapısıyla çalışıyor!`);
});