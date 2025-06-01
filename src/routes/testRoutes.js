const express = require('express');
const router = express.Router();

// Ruta de prueba "Hola Mundo"
router.get('/hola', (req, res) => {
  res.json({ mensaje: 'Hola ricardo y celso y mundo' });
});

// Nueva ruta de prueba "Hola amigos"
//hola
router.get('/amigos', (req, res) => {
  res.json({ mensaje: 'Hola ricardo y celso y mundo' });
});

module.exports = router;