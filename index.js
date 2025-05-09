require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { handleTranscription } = require('./transcriptionHandler');
const fs = require('fs');
const path = require('path');

// Crear directorio de transcripciones si no existe
const transcriptionsDir = path.join(__dirname, 'transcriptions');
if (!fs.existsSync(transcriptionsDir)) {
  fs.mkdirSync(transcriptionsDir);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Ruta principal
app.get('/', (req, res) => {
  res.send('Servidor de transcripción de llamadas Twilio activo');
});

// Endpoint para recibir llamadas de Twilio
app.post('/call', (req, res) => {
  const twiml = handleTranscription(req);
  res.type('text/xml');
  res.send(twiml.toString());
});

// Endpoint para recibir transcripciones
app.post('/transcription', (req, res) => {
  const transcriptionText = req.body.TranscriptionText;
  const callSid = req.body.CallSid;
  
  if (transcriptionText) {
    const now = new Date();
    const fileName = `${now.toISOString().replace(/:/g, '-')}_${callSid}.md`;
    const filePath = path.join(transcriptionsDir, fileName);
    
    const fileContent = `# Transcripción de llamada: ${callSid}\n\n` +
                       `Fecha: ${now.toLocaleString()}\n\n` +
                       `## Contenido\n\n${transcriptionText}\n`;
    
    fs.writeFileSync(filePath, fileContent);
    console.log(`Transcripción guardada en: ${filePath}`);
  } else {
    console.log(`No se pudo obtener la transcripción para la llamada: ${callSid}`);
  }
  
  res.sendStatus(200);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto: ${PORT}`);
}); 