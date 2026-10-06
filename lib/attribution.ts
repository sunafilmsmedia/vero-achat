"use client";

// Attribution publicitaire — fbclid (Facebook Click ID).
// Capturé depuis l'URL au premier chargement et persisté en localStorage,
// pour qu'il survive même si le visiteur navigue avant de soumettre le
// formulaire (l'URL peut changer, le localStorage reste). Envoyé au webhook
// CRM sur CHAQUE lead, vide si le visiteur n'est jamais venu d'une pub Meta.
const STORAGE_KEY = "fbclid";

export function captureFbclid(): void {
  if (typeof window === "undefined") return;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("fbclid");
    if (fromUrl) window.localStorage.setItem(STORAGE_KEY, fromUrl);
  } catch {
    // no-op — l'attribution ne doit jamais casser l'app
  }
}

export function getFbclid(): string {
  if (typeof window === "undefined") return "";
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("fbclid");
    return fromUrl ?? window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}
