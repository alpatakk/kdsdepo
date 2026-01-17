const express = require('express');
const router = express.Router();
const provinceRoutes = require('./provinceRoutes');

router.use('/', provinceRoutes);

module.exports = router;