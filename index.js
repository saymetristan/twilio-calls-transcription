require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { handleTranscription } = require('./transcriptionHandler');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

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

// Endpoint para cuando se completa la grabación
app.post('/recording-complete', (req, res) => {
  console.log('Grabación completada:', JSON.stringify(req.body));
  
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.hangup();
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Endpoint específico para el callback de transcripción
app.post('/transcription-callback', (req, res) => {
  console.log('Callback de transcripción recibido:', JSON.stringify(req.body));
  
  const transcriptionText = req.body.TranscriptionText;
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  const transcriptionStatus = req.body.TranscriptionStatus;
  
  if (transcriptionStatus === 'completed' && transcriptionText && transcriptionText.trim() !== '') {
    const now = new Date();
    const fileName = `${now.toISOString().replace(/:/g, '-')}_${callSid}.md`;
    const filePath = path.join(transcriptionsDir, fileName);
    
    const fileContent = `# Transcripción de llamada: ${callSid}\n\n` +
                       `Fecha: ${now.toLocaleString()}\n\n` +
                       `RecordingUrl: ${recordingUrl || 'No disponible'}\n\n` +
                       `## Contenido\n\n${transcriptionText}\n`;
    
    fs.writeFileSync(filePath, fileContent);
    console.log(`Transcripción guardada en: ${filePath}`);
  } else {
    console.log(`Transcripción no disponible para la llamada: ${callSid}`);
    console.log(`Estado de transcripción: ${transcriptionStatus}`);
    
    // Guardar un archivo de error para referencia
    const now = new Date();
    const fileName = `${now.toISOString().replace(/:/g, '-')}_${callSid}_error.md`;
    const filePath = path.join(transcriptionsDir, fileName);
    
    fs.writeFileSync(filePath, `# Error en transcripción: ${callSid}\n\nFecha: ${now.toLocaleString()}\n\nEstado: ${transcriptionStatus}\n\nDatos recibidos: ${JSON.stringify(req.body)}\n`);
  }
  
  res.sendStatus(200);
});

// Mantener el endpoint original para compatibilidad
app.post('/transcription', (req, res) => {
  console.log('Datos de transcripción recibidos (endpoint original):', JSON.stringify(req.body));
  
  const transcriptionText = req.body.TranscriptionText;
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  
  if (transcriptionText && transcriptionText.trim() !== '') {
    const now = new Date();
    const fileName = `${now.toISOString().replace(/:/g, '-')}_${callSid}.md`;
    const filePath = path.join(transcriptionsDir, fileName);
    
    const fileContent = `# Transcripción de llamada: ${callSid}\n\n` +
                       `Fecha: ${now.toLocaleString()}\n\n` +
                       `RecordingUrl: ${recordingUrl || 'No disponible'}\n\n` +
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