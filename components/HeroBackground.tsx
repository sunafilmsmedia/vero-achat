import Image from "next/image";

// Carte décorative du hero — image statique (export ArcGIS pré-généré,
// voir lib/brand.ts pour le centre/zoom d'origine) plutôt qu'une carte
// Leaflet interactive chargée côté client. La carte n'était de toute façon
// pas interactive (zoom/drag désactivés) : un <img> fixe produit le même
// rendu visuel instantanément, sans bundle JS ni appels réseau vers un
// serveur de tuiles tiers — ce qui plombait le LCP (jusqu'à ~8-9 s).
export default function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div className="map-mono absolute inset-0">
        <Image
          src="/hero-map.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Voile blanc : la carte reste perceptible, le titre parfaitement lisible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 32%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.72) 40%, rgba(255,255,255,0.94) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 22%, rgba(255,255,255,0.5) 70%, rgba(255,255,255,0.98) 100%)",
        }}
      />
    </div>
  );
}
