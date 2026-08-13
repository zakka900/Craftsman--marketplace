/**
 * CONFIGURAZIONE API — backend reale su Railway.
 * STRIPE_PUBLISHABLE_KEY: dashboard.stripe.com → Developers → API keys → "Publishable key" (pk_test_...).
 */
// TEMPORANEO — puntato al backend locale (con le nuove funzioni) per i test via Expo Go
// sulla stessa rete WiFi del PC. Ripristina l'URL Railway sotto prima di pubblicare/deployare.
export const API_URL = 'http://172.20.10.2:3000/api';
// export const API_URL = 'https://artisanbackend-production.up.railway.app/api';
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TuDVpHQoL7o2unYCRX6dtd9JXvHbcnT43fd4uDQbI0fos6dLHUq8dIN16mQUPfcHF4O1gTU48pBlNaP3orX3vyb00v1QdDTF6';
