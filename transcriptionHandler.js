const twilio = require('twilio');

/**
 * Maneja la transcripción de una llamada entrante de Twilio
 * @param {Object} req - Objeto de solicitud Express
 * @returns {Object} - Objeto TwiML para responder a Twilio
 */
function handleTranscription(req) {
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Grabar y transcribir la llamada sin mensajes previos
  twiml.record({
    action: '/transcription',
    transcribe: true,
    transcribeCallback: '/transcription',
    maxLength: 600, // Extendido a 10 minutos
    playBeep: false, // Sin beep
    timeout: 10,     // Más tiempo antes de terminar en silencio
    trim: 'trim-silence' // Recorta silencios
  });
  
  return twiml;
}

module.exports = { handleTranscription }; 