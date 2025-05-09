const twilio = require('twilio');

/**
 * Maneja la transcripción de una llamada entrante de Twilio
 * @param {Object} req - Objeto de solicitud Express
 * @returns {Object} - Objeto TwiML para responder a Twilio
 */
function handleTranscription(req) {
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Mensaje de bienvenida
  twiml.say({ language: 'es-ES', voice: 'Polly.Conchita' }, 
    'Hola, esta llamada será transcrita. Por favor, hable después del tono.');
  
  // Breve pausa
  twiml.pause({ length: 1 });
  
  // Beep para indicar inicio de grabación
  twiml.play({ digits: 'w9' });
  
  // Grabar y transcribir la llamada
  twiml.record({
    action: '/transcription',
    transcribe: true,
    transcribeCallback: '/transcription',
    maxLength: 300, // Máximo 5 minutos
    playBeep: true,
    timeout: 5
  });
  
  // Mensaje de despedida
  twiml.say({ language: 'es-ES', voice: 'Polly.Conchita' }, 
    'Gracias por su mensaje. Adiós.');
  
  return twiml;
}

module.exports = { handleTranscription }; 