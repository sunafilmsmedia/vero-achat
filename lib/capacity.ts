// ============================================================================
// Capacité d'achat — calcul déterministe
// ----------------------------------------------------------------------------
// Règle de base du courtage : une personne se qualifie généralement autour de
// 4,5 × son revenu brut annuel. On part de là, puis on compare avec ce que la
// mise de fonds permet réellement.
//
//   1. maxByIncome        4,5 × le revenu retenu (pondéré selon l'emploi).
//                         Affiché sous forme de FOURCHETTE (± 50 000 $) : le
//                         chiffre exact dépend des dettes, des paiements
//                         mensuels et du prêteur.
//   2. maxByDownPayment   ce que la MISE DE FONDS actuelle permet, selon les
//                         règles minimales canadiennes (5 % / 10 % / 20 %).
//
// Cas particulier : quelqu'un qui doit VENDRE avant d'acheter n'a pas de mise
// de fonds à déclarer — sa mise de fonds sortira de la vente. On lui demande
// plutôt la valeur de sa propriété, et on ne calcule aucun « écart ».
//
// ⚠️ Rien ici n'est une préapprobation. Les dettes personnelles (auto, marges,
// cartes) ne sont pas demandées et ne sont donc pas déduites.
// ============================================================================

import type { Answers, CapacityResult, EmploymentStatus, LimitingFactor } from "./types";

// Multiple du revenu brut annuel utilisé pour estimer la capacité.
const MULTIPLE_REVENU = 4.5;

// Demi-largeur de la fourchette affichée, de part et d'autre de l'estimation.
const MARGE_FOURCHETTE = 50_000;

// Taux hypothécaire et amortissement — servent au paiement mensuel estimé.
// Ce n'est PAS le taux d'admissibilité (test de simulation de crise) : la
// capacité vient du multiple de revenu, donc le paiement doit refléter un taux
// de contrat réaliste.
const TAUX_HYPOTHECAIRE = 5;
const AMORTISSEMENT_ANS = 25;

// Prime SCHL ajoutée au prêt quand la mise de fonds est sous 20 %.
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

// Paiement mensuel par dollar emprunté, au taux hypothécaire estimé.
function facteurPaiement(): number {
  const r = TAUX_HYPOTHECAIRE / 100 / 12;
  const n = AMORTISSEMENT_ANS * 12;
  return r / (1 - Math.pow(1 + r, -n));
}

export function paiementMensuel(pret: number): number {
  if (pret <= 0) return 0;
  return Math.round(pret * facteurPaiement());
}

// Une personne qui doit vendre avant d'acheter : sa mise de fonds viendra du
// produit de la vente, pas de son compte d'épargne.
export function vendAvantDAcheter(answers: Answers): boolean {
  return answers.journeyStage === "vendre_pour_acheter";
}

export function computeCapacity(answers: Answers): CapacityResult {
  const revenu = Math.max(0, answers.householdIncome ?? 0);
  const estVendeur = vendAvantDAcheter(answers);
  const mise = estVendeur ? 0 : Math.max(0, answers.downPayment ?? 0);
  const currentHomeValue = estVendeur ? Math.max(0, answers.currentHomeValue ?? 0) : 0;

  const facteurEmploi = answers.employment ? FACTEUR_EMPLOI[answers.employment] : 0.9;
  const incomeConsidered = Math.round(revenu * facteurEmploi);

  // Capacité = 4,5 × le revenu retenu, arrondie pour ne pas afficher de faux
  // chiffre précis. La fourchette, elle, est ce qu'on montre au visiteur.
  const maxByIncome = round(incomeConsidered * MULTIPLE_REVENU, 5_000);
  const capacityLow = Math.max(0, maxByIncome - MARGE_FOURCHETTE);
  const capacityHigh = maxByIncome > 0 ? maxByIncome + MARGE_FOURCHETTE : 0;

  const requiredDownForCapacity = Math.round(miseDeFondsMinimale(maxByIncome));

  const maxByDownPayment = estVendeur ? 0 : round(prixMaxSelonMiseDeFonds(mise));
  const realisticBudget = estVendeur ? maxByIncome : Math.min(maxByIncome, maxByDownPayment);
  const downPaymentGap = estVendeur
    ? 0
    : Math.max(0, requiredDownForCapacity - mise);

  // Paiement estimé sur le budget réaliste. Pour un vendeur, on suppose la
  // mise de fonds minimale (le produit net de sa vente reste à confirmer).
  const miseUtilisee = estVendeur
    ? Math.min(requiredDownForCapacity, realisticBudget)
    : Math.min(mise, realisticBudget);
  const pretBase = Math.max(0, realisticBudget - miseUtilisee);
  const ratioMise = realisticBudget > 0 ? miseUtilisee / realisticBudget : 0;
  const prime = ratioMise >= 0.2 ? 0 : PRIME_SCHL_MIN;
  const monthlyPayment = paiementMensuel(pretBase * (1 + prime));

  // Facteur limitant : on tolère 3 % d'écart avant de trancher.
  let limitedBy: LimitingFactor = "equilibre";
  if (estVendeur) {
    limitedBy = "vente_a_confirmer";
  } else if (maxByIncome > 0 && maxByDownPayment < maxByIncome * 0.97) {
    limitedBy = "mise_de_fonds";
  } else if (maxByDownPayment > 0 && maxByIncome < maxByDownPayment * 0.97) {
    limitedBy = "revenu";
  }

  return {
    incomeConsidered,
    maxByIncome,
    capacityLow,
    capacityHigh,
    downPaymentSource: estVendeur ? "vente" : "epargne",
    currentHomeValue,
    maxByDownPayment,
    realisticBudget,
    requiredDownForCapacity,
    downPaymentGap,
    monthlyPayment,
    limitedBy,
    mortgageRate: TAUX_HYPOTHECAIRE,
    amortizationYears: AMORTISSEMENT_ANS,
    incomeMultiple: MULTIPLE_REVENU,
  };
}
