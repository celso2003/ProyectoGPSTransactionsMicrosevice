const express = require('express');
const router = express.Router();

// Ruta de prueba "Hola Mundo"
router.get('/hola', (req, res) => {
  res.json({ mensaje: 'Hola amigo' });
});


module.exports = router;