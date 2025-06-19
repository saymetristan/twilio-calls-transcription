const twilio = require('twilio');

/**
 * Maneja la transcripción de una llamada entrante de Twilio
 * @param {Object} req - Objeto de solicitud Express
 * @returns {Object} - Objeto TwiML para responder a Twilio
 */
function handleTranscription(req) {
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Grabar y transcribir la llamada
  twiml.record({
    action: '/recording-complete',
    transcribe: true,
    transcribeCallback: '/transcription-callback',
    maxLength: 600,
    playBeep: false,
    timeout: 10,
    trim: 'trim-silence'
  });
  
  return twiml;
}

module.exports = { handleTranscription }; 