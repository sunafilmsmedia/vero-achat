// ============================================================================
// Réglages du déploiement — Véronique Guillemette (acheteur)
// ----------------------------------------------------------------------------
// Tout ce qui change d'un courtier / d'une campagne à l'autre est ici.
// ============================================================================

// Vidéo envoyée aux personnes qui veulent acheter dans PLUS DE 12 MOIS.
// Elles ne sont pas dirigées vers l'analyse ni capturées comme lead : on leur
// remet la vidéo et on les laisse revenir plus tard.
// ⚠️ À REMPLIR AU DÉPLOIEMENT — tant que c'est vide, l'écran affiche le
// message sans bouton vidéo.
export const VIDEO_LONG_TERME_URL = "";

// Redirection automatique vers la vidéo après quelques secondes (si l'URL
// ci-dessus est renseignée). Mettre à false pour n'offrir que le bouton.
export const VIDEO_AUTO_REDIRECT = true;
export const VIDEO_AUTO_REDIRECT_MS = 6000;

// Nombre maximal de secteurs sélectionnables à la question « secteurs ».
export const MAX_SECTEURS = 3;
