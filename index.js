const express = require('express');
const bodyParser = require('body-parser');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear el cuerpo de la petición
app.use(bodyParser.urlencoded({ extended: false }));

// Endpoint para recibir llamadas de Twilio
app.post('/call', (req, res) => {
  const twiml = new VoiceResponse();
  
  // Informar al llamante que la llamada será grabada y transcrita
  twiml.say({
    language: 'es-ES',
    voice: 'woman'
  }, 'Su llamada será grabada y transcrita. Por favor, hable después del tono.');
  
  // Grabar la llamada y solicitar transcripción
  twiml.record({
    action: '/transcribe',
    transcribe: true,
    transcribeCallback: '/transcription-callback',
    maxLength: 300, // 5 minutos máximo
    playBeep: true
  });
  
  // Finalizar si no hay grabación
  twiml.say({
    language: 'es-ES',
    voice: 'woman'
  }, 'No hemos recibido ninguna grabación. Gracias por llamar.');
  
  // Enviar respuesta TwiML
  res.type('text/xml');
  res.send(twiml.toString());
});

// Endpoint para manejar después de la grabación
app.post('/transcribe', (req, res) => {
  const twiml = new VoiceResponse();
  
  twiml.say({
    language: 'es-ES',
    voice: 'woman'
  }, 'Gracias por su mensaje. La transcripción estará disponible en breve.');
  
  twiml.hangup();
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Endpoint para recibir la transcripción
app.post('/transcription-callback', (req, res) => {
  const transcriptionText = req.body.TranscriptionText || 'Sin transcripción disponible';
  const transcriptionStatus = req.body.TranscriptionStatus;
  const recordingUrl = req.body.RecordingUrl;
  const callSid = req.body.CallSid;
  
  console.log('Estado de transcripción:', transcriptionStatus);
  console.log('Texto transcrito:', transcriptionText);
  console.log('URL de grabación:', recordingUrl);
  console.log('SID de llamada:', callSid);
  
  // Crear directorio de transcripciones si no existe
  const transcriptionsDir = path.join(__dirname, 'transcripciones');
  if (!fs.existsSync(transcriptionsDir)) {
    fs.mkdirSync(transcriptionsDir);
  }
  
  // Fecha y hora actual formateada
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  
  // Crear contenido del archivo
  const fileContent = `# Transcripción de llamada
Fecha: ${now.toLocaleString()}
ID de llamada: ${callSid}
Estado: ${transcriptionStatus}
URL de grabación: ${recordingUrl}

## Contenido
${transcriptionText}
`;

  // Guardar transcripción individual
  const fileName = `transcripcion-${timestamp}.md`;
  fs.writeFileSync(path.join(transcriptionsDir, fileName), fileContent);
  
  // Añadir al registro consolidado
  const logEntry = `\n\n------\n# Transcripción ${timestamp}\n${fileContent}`;
  fs.appendFileSync(path.join(transcriptionsDir, 'todas-transcripciones.md'), logEntry);
  
  console.log(`Transcripción guardada en: ${fileName}`);
  
  res.sendStatus(200);
});

// Ruta de estado
app.get('/status', (req, res) => {
  res.json({ status: 'ok' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
}); 