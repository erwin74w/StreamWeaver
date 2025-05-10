// js/ably-config.js

// WARNING: Exposing a full-access API key client-side is a security risk.
// For production, this API key should ideally be restricted, or you should
// use Ably Token Authentication where the overlay client receives a temporary,
// capability-limited token from a secure backend.
export const ABLY_API_KEY = 'PpmbHg.J6_8kg:qC-BaNitrxujvNUg2DHRy8tlw3WECMYJispON6PCOik';
export const CHANNEL_NAME = 'streamweaver-control';

if (ABLY_API_KEY === 'YOUR_ABLY_API_KEY_WAS_HERE' || !ABLY_API_KEY || ABLY_API_KEY.length < 10) {
    console.warn("Ably API Key placeholder active or invalid. Please update 'js/ably-config.js' with your actual Ably API Key.");
    // Optionally, you could display an error on the overlay itself here.
}
