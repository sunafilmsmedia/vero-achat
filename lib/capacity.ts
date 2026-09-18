// ============================================================================
// Capacité d'achat — calcul déterministe
// ----------------------------------------------------------------------------
// Deux plafonds sont calculés séparément, puis comparés :
//
//   1. maxByIncome        ce que le REVENU du ménage peut supporter (test de
//                         simulation de crise, ABD 39 %, amortissement 25 ans),
//                         en supposant la mise de fonds minimale disponible.
//   2. maxByDownPayment   ce que la MISE DE FONDS actuelle permet, selon les
//                         règles minimales canadiennes (5 % / 10 % / 20 %).
//
// L'écart entre les deux est le cœur du produit : quand la mise de fonds est
// le facteur limitant, on chiffre exactement ce qu'il manque.
//
// ⚠️ Aucune de ces valeurs n'est une préapprobation. Les dettes personnelles
// (auto, marges, cartes) ne sont pas demandées et ne sont donc pas déduites :
// le résultat réel d'un prêteur sera généralement plus bas.
// ============================================================================

import type { Answers, CapacityResult, EmploymentStatus, LimitingFactor } from "./types";

// Taux d'admissibilité (test de simulation de crise). Volontairement prudent.
const TAUX_ADMISSIBILITE = 6.25;
const AMORTISSEMENT_ANS = 25;

// Amortissement brut de la dette : part du revenu brut consacrée à l'habitation.
const RATIO_ABD = 0.39;

// Charges mensuelles incluses dans l'ABD.
const CHAUFFAGE_MENSUEL = 150;
const CHAUFFAGE_CONDO = 100;
// Frais de copropriété : les prêteurs en comptent 50 %.
const FRAIS_CONDO_MENSUEL = 260;
// Taxes municipales + scolaires estimées, en % du prix, par année (Outaouais).
const TAUX_TAXES_ANNUEL = 0.0095;

// Prime SCHL ajoutée au prêt quand la mise de fonds est sous 20 %.
// On suppose la mise de fonds minimale pour le calcul de capacité (5-9,99 %).
const PRIME_SCHL_MIN = 0.04;

// Plafond des prêts assurés : au-delà, il faut 20 % de mise de fonds.
const PLAFOND_ASSURE = 1_500_000;

// Pondération du revenu selon la stabilité perçue par les prêteurs.
// Un travailleur autonome est généralement qualifié sur son revenu NET
// d'entreprise (moyenne de 2 ans), d'où la réduction.
const FACTEUR_EMPLOI: Record<EmploymentStatus, number> = {
  salarie_permanent: 1,
  salarie_contrat: 0.9,
  autonome: 0.8,
  entrepreneur: 0.8,
  retraite: 0.95,
  transition: 0.55,
};

function round(n: number, pas = 50): number {
  return Math.round(n / pas) * pas;
}

// Mise de fonds minimale exigée au Canada pour un prix donné.
export function miseDeFondsMinimale(prix: number): number {
  if (prix <= 500_000) return prix * 0.05;
  if (prix < PLAFOND_ASSURE) return 25_000 + (prix - 500_000) * 0.1;
  return prix * 0.2;
}

// Prix maximal atteignable avec une mise de fonds donnée (inverse de la
// fonction ci-dessus). Ex. 20 000 $ → 400 000 $ ; 26 285 $ → 512 850 $.
export function prixMaxSelonMiseDeFonds(mise: number): number {
  if (mise <= 0) return 0;
  if (mise < 25_000) return mise / 0.05;
  if (mise < 125_000) return 500_000 + (mise - 25_000) / 0.1;
  return Math.max(PLAFOND_ASSURE, mise / 0.2);
}

// Paiement mensuel par dollar emprunté, au taux d'admissibilité.
function facteurPaiement(): number {
  const r = TAUX_ADMISSIBILITE / 100 / 12;
  const n = AMORTISSEMENT_ANS * 12;
  return r / (1 - Math.pow(1 + r, -n));
}

export function paiementMensuel(pret: number): number {
  if (pret <= 0) return 0;
  return Math.round(pret * facteurPaiement());
}

// Prix maximal soutenu par le revenu, en supposant la mise de fonds minimale.
// Les taxes municipales dépendent du prix, donc on itère jusqu'à convergence.
function prixMaxSelonRevenu(revenuRetenu: number, isCondo: boolean): number {
  if (revenuRetenu <= 0) return 0;

  const brutMensuel = revenuRetenu / 12;
  const chauffage = isCondo ? CHAUFFAGE_CONDO : CHAUFFAGE_MENSUEL;
  const condo = isCondo ? FRAIS_CONDO_MENSUEL * 0.5 : 0;
  const plafondHabitation = brutMensuel * RATIO_ABD;
  const facteur = facteurPaiement();

  let prix = 350_000;
  for (let i = 0; i < 40; i++) {
    const taxes = (prix * TAUX_TAXES_ANNUEL) / 12;
    const dispoHypotheque = plafondHabitation - chauffage - condo - taxes;
    if (dispoHypotheque <= 0) return 0;

    // Le paiement porte sur le prêt assuré (prime SCHL incluse).
    const pretAssure = dispoHypotheque / facteur;
    const pretBase = pretAssure / (1 + PRIME_SCHL_MIN);
    const mise = miseDeFondsMinimale(prix);
    const nouveauPrix = pretBase + mise;

    if (Math.abs(nouveauPrix - prix) < 250) {
      prix = nouveauPrix;
      break;
    }
    prix = nouveauPrix;
  }
  return Math.max(0, prix);
}

export function computeCapacity(answers: Answers): CapacityResult {
  const revenu = Math.max(0, answers.householdIncome ?? 0);
  const mise = Math.max(0, answers.downPayment ?? 0);
  const isCondo = answers.propertyType === "condo";

  const facteurEmploi = answers.employment ? FACTEUR_EMPLOI[answers.employment] : 0.9;
  const incomeConsidered = Math.round(revenu * facteurEmploi);

  const maxByIncome = round(prixMaxSelonRevenu(incomeConsidered, isCondo));
  const maxByDownPayment = round(prixMaxSelonMiseDeFonds(mise));
  const realisticBudget = Math.min(maxByIncome, maxByDownPayment);

  const requiredDownForCapacity = Math.round(miseDeFondsMinimale(maxByIncome));
  const downPaymentGap = Math.max(0, requiredDownForCapacity - mise);

  // Prêt correspondant au budget réaliste (prime SCHL incluse si < 20 %).
  const miseUtilisee = Math.min(mise, realisticBudget);
  const pretBase = Math.max(0, realisticBudget - miseUtilisee);
  const ratioMise = realisticBudget > 0 ? miseUtilisee / realisticBudget : 0;
  const prime = ratioMise >= 0.2 ? 0 : PRIME_SCHL_MIN;
  const monthlyPayment = paiementMensuel(pretBase * (1 + prime));

  // Facteur limitant : on tolère 3 % d'écart avant de trancher.
  let limitedBy: LimitingFactor = "equilibre";
  if (maxByIncome > 0 && maxByDownPayment < maxByIncome * 0.97) {
    limitedBy = "mise_de_fonds";
  } else if (maxByDownPayment > 0 && maxByIncome < maxByDownPayment * 0.97) {
    limitedBy = "revenu";
  }

  return {
    incomeConsidered,
    maxByIncome,
    maxByDownPayment,
    realisticBudget,
    requiredDownForCapacity,
    downPaymentGap,
    monthlyPayment,
    limitedBy,
    qualifyingRate: TAUX_ADMISSIBILITE,
    amortizationYears: AMORTISSEMENT_ANS,
  };
}
