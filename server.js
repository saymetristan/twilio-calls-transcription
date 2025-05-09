const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Verificar autenticación de Twilio
const twilioAuthMiddleware = (req, res, next) => {
  // Descomenta esto en producción para verificar que las peticiones vengan de Twilio
  // const twilioSignature = req.headers['x-twilio-signature'];
  // const params = req.body;
  // const url = `${process.env.BASE_URL}${req.originalUrl}`;
  // const requestIsValid = twilio.validateRequest(
  //   process.env.TWILIO_AUTH_TOKEN,
  //   twilioSignature,
  //   url,
  //   params
  // );
  // if (!requestIsValid) {
  //   return res.status(403).send('Forbidden');
  // }
  next();
};

// Directorio para guardar transcripciones
const TRANSCRIPTIONS_DIR = path.join(__dirname, 'transcripciones');

// Asegurar que el directorio existe
if (!fs.existsSync(TRANSCRIPTIONS_DIR)) {
  fs.mkdirSync(TRANSCRIPTIONS_DIR);
}

// Ruta para recibir llamadas entrantes
app.post('/llamada-entrante', twilioAuthMiddleware, (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Responder a la llamada y grabar
  twiml.say({ language: 'es-ES' }, 'Hola, esta llamada será grabada y transcrita.');
  
  // Grabar la llamada y solicitar transcripción
  twiml.record({
    action: '/procesar-grabacion',
    transcribe: true,
    transcribeCallback: '/guardar-transcripcion',
    maxLength: 300, // 5 minutos máximo
    playBeep: true
  });
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Ruta para procesar la grabación
app.post('/procesar-grabacion', twilioAuthMiddleware, (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say({ language: 'es-ES' }, 'Gracias por tu mensaje. Adiós.');
  twiml.hangup();
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Ruta para guardar la transcripción
app.post('/guardar-transcripcion', twilioAuthMiddleware, (req, res) => {
  const callSid = req.body.CallSid;
  const transcripcion = req.body.TranscriptionText || 'No se pudo transcribir el audio';
  const fechaHora = new Date().toISOString().replace(/:/g, '-');
  const nombreArchivo = `${fechaHora}_${callSid}.md`;
  const rutaArchivo = path.join(TRANSCRIPTIONS_DIR, nombreArchivo);
  
  // Crear contenido con metadatos
  const contenido = `# Transcripción de llamada\n\n` +
    `- **Fecha y hora**: ${new Date().toLocaleString()}\n` +
    `- **ID de llamada**: ${callSid}\n` +
    `- **Número de teléfono**: ${req.body.From || 'Desconocido'}\n\n` +
    `## Contenido\n\n${transcripcion}\n`;
  
  // Guardar archivo
  fs.writeFileSync(rutaArchivo, contenido);
  
  console.log(`Transcripción guardada: ${nombreArchivo}`);
  res.status(200).send('OK');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
}); 