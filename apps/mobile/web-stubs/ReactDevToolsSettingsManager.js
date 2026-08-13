// Stub per il web: React Native 0.86 non fornisce una variante .web.js di questo
// modulo nativo (solo .ios.js/.android.js), usato solo dal bridge dev-tools interno.
// Metro lo risolve qui SOLO per la piattaforma web (vedi metro.config.js) — nessun
// impatto su iOS/Android, dove restano i file nativi originali.
export function setGlobalHookSettings() {}
export function getGlobalHookSettings() {
  return null;
}
