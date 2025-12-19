const express = require('express');
const path = require('path');
const db = require('./db'); 
const provinceRoutes = require('./routes/provinceRoutes');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(express.static('views'));

app.use('/api', provinceRoutes); // Köprüyü kurduk

app.listen(port, () => {
    console.log(`🚀 Sunucu http://localhost:${port} adresinde MVC yapısıyla çalışıyor!`);
});