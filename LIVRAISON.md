# Véronique Guillemette — ACHETEUR — `vero-achat`

Logiciel de qualification d'**acheteurs** pour **Véronique Guillemette**
(courtière immobilière RE/MAX, Outaouais — Gatineau). Même identité visuelle
que son app vendeur (`eval-veroniqueguillemette` — thème noir/doré/blanc), mais
un produit différent : au lieu d'un verdict de timing de vente, l'app calcule
un **pouvoir d'achat** et chiffre **ce qu'il manque** en mise de fonds. La
structure et la logique reprennent les normes de l'app acheteur `achat-r-b`.

## Le parcours

1. **Hero** — « Quelle propriété peux-tu vraiment acheter à Gatineau ? »
2. **9 questions** (`lib/questions.ts`) :
   préqualification · type de propriété · secteurs (jusqu'à 3) · échéancier ·
   parcours · seul ou en couple · revenu brut du ménage · mise de fonds ·
   situation d'emploi
3. **Court-circuit « plus de 12 mois »** → écran vidéo (`LongTermScreen`).
   Aucune analyse, aucun lead capturé.
4. **Analyse** (2 s minimum) → écran de pré-révélation → **résultats bloqués**
   derrière le formulaire de contact.
5. **Résultats** : capacité, écart de mise de fonds, score, programmes,
   facteurs détectés, 4 prochaines étapes.

## Le calcul (`lib/capacity.ts`)

Deux plafonds calculés séparément, puis comparés :

| Valeur | Comment |
|---|---|
| `maxByIncome` | Ce que le revenu supporte : ABD 39 %, taux d'admissibilité **6,25 %**, amortissement **25 ans**, taxes ≈ 0,95 %/an, chauffage, 50 % des frais de condo, prime SCHL 4 % incluse. Revenu pondéré selon l'emploi (permanent 100 % → transition 55 %). |
| `maxByDownPayment` | Règles canadiennes : 5 % jusqu'à 500 k$, 10 % sur la tranche 500 k$–1,5 M$, 20 % au-delà. |
| `downPaymentGap` | Mise de fonds minimale exigée pour `maxByIncome`, moins la mise de fonds actuelle. |

> ⚠️ **Ce n'est jamais une préapprobation.** Les dettes personnelles ne sont
> pas demandées, donc pas déduites : le montant d'un prêteur sera généralement
> plus bas. L'avertissement est affiché sous les résultats.

## Les 4 verdicts (`lib/scoring.ts`)

| Verdict | Déclencheur | Titre affiché |
|---|---|---|
| `pret` | financement + mise de fonds au rendez-vous | Tu es prêt à passer à l'action. |
| `financement` | mise de fonds OK, prêteur pas encore validé | Presque prêt — il te manque la préqualification. |
| `mise_de_fonds` | capacité présente, comptant insuffisant | Presque prêt — il te manque la mise de fonds. |
| `a_batir` | capacité < 150 k$ ou score < 35 | Ton projet se bâtit — et c'est très correct. |

Score sur 100 affiché (« Score de préparation »), borné à 15–98.
Les programmes (CELIAPP, RAP, crédits d'impôt, remise en argent, don familial)
n'apparaissent que quand la mise de fonds est le frein.

## Le branding (white-label)

Tout ce qui identifie Véronique est centralisé dans **`lib/brand.ts`** :
nom, région (`l'Outaouais`) / ville (`Gatineau`), textes du hero, logos
(équipe + agence), centre de la carte. Courtière **unique** — le badge flottant
téléphone a été retiré (aucun numéro affiché), conformément à son app vendeur.

- Logos : `public/veronique-guillemette.webp` (gauche) + `public/remax-vision.jpg`
  (agence, pastille blanche à droite).
- Palette noir/doré/blanc : bloc `@theme` de `app/globals.css`.
- Secteurs de l'Outaouais : `lib/regions.ts` (~75 municipalités, recherche libre).
- Fond de carte : carte Leaflet décorative centrée sur Gatineau
  (`components/HeroBackground.tsx`, tuiles Esri World Dark Gray).

## À FAIRE avant déploiement

1. **Lien de la vidéo « plus de 12 mois »** → `lib/config.ts`
   (`VIDEO_LONG_TERME_URL`). Tant qu'il est vide, l'écran s'affiche sans
   bouton. `VIDEO_AUTO_REDIRECT` contrôle la redirection automatique (6 s).
2. **Câbler les intégrations** (vides par défaut — nouvelle app = nouveaux
   IDs, ne pas réutiliser ceux de l'app vendeur) :
   - Meta Pixel ID → `components/MetaPixel.tsx` (`const PIXEL_ID`)
   - Clarity Project ID → `components/Clarity.tsx` (`CLARITY_PROJECT_ID`)
3. **Variables d'environnement Vercel** (voir `.env.local.example`) :
   - `CRM_WEBHOOK_URL` (GHL de Véronique), `CRM_WEBHOOK_SECRET` (opt.)
   - `ANTHROPIC_API_KEY` (opt. — sinon rapport déterministe ; les **montants**
     sont toujours calculés par le code, jamais par l'IA)
   - `NEXT_PUBLIC_SITE_URL` (metadataBase / Open Graph)
4. **Valider les hypothèses financières** avec un courtier hypothécaire :
   taux d'admissibilité, taux de taxes de l'Outaouais, frais de condo moyens
   (constantes en haut de `lib/capacity.ts`).
5. **Tester les 4 verdicts** + le court-circuit « plus de 12 mois », et
   confirmer le mapping dans GHL.

## Champs envoyés au CRM (`app/api/lead/route.ts`)

`source: "vero-achat"`, `leadType: "acheteur"`, `periode` / `lead_type`
(jour/nuit, heure du Québec), contact, `score`, `verdict`, puis les montants :
`capaciteMax`, `budgetRealiste`, `plafondMiseDeFonds`, `miseDeFondsVisee`,
`manqueMiseDeFonds`, `paiementMensuel`, `facteurLimitant` — plus le profil
complet (`financingStatus`, `secteurs`, `purchaseTimeline`, `journeyStage`,
`buyingWith`, `householdIncome`, `downPayment`, `employment`).

## Dév local

```bash
npm install
cp .env.local.example .env.local   # remplir si besoin
npm run dev
```

Repo : https://github.com/sunafilmsmedia/vero-achat.git
