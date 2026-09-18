import { computeCapacity } from "./capacity";
import { BRAND } from "./brand";
import type { Answers, ScoringFactor, ScoringResult, Verdict } from "./types";

const BASE_SCORE = 32;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function computeScoring(answers: Answers): ScoringResult {
  const factors: ScoringFactor[] = [];
  const capacity = computeCapacity(answers);
  let score = BASE_SCORE;

  const add = (delta: number, label: string, tone: ScoringFactor["tone"]) => {
    score += delta;
    factors.push({ label, delta, tone });
  };

  // ── Financement ───────────────────────────────────────────────────────────
  switch (answers.financingStatus) {
    case "preapproved":
      add(18, "Préapprobation en main — tu peux déposer une offre solide", "positive");
      break;
    case "prequalified":
      add(12, "Préqualification obtenue — la base est faite", "positive");
      break;
    case "in_process":
      add(5, "Démarches de financement déjà entamées", "neutral");
      break;
    case "not_started":
      add(-8, "Financement pas encore amorcé", "negative");
      break;
  }

  // ── Échéancier ────────────────────────────────────────────────────────────
  switch (answers.purchaseTimeline) {
    case "asap":
    case "0_3_mois":
      add(12, "Achat visé à court terme", "positive");
      break;
    case "3_6_mois":
      add(7, "Achat visé dans 3 à 6 mois", "positive");
      break;
    case "6_12_mois":
      add(2, "Achat visé dans 6 à 12 mois", "neutral");
      break;
    case "plus_12_mois":
      // Court-circuité vers la vidéo long terme — n'arrive normalement pas ici.
      add(-10, "Projet à plus de 12 mois", "negative");
      break;
  }

  // ── Avancement du parcours ────────────────────────────────────────────────
  switch (answers.journeyStage) {
    case "offres":
      add(12, "Déjà des offres déposées — parcours avancé", "positive");
      break;
    case "visites":
      add(9, "Visites en cours", "positive");
      break;
    case "recherche":
      add(4, "Suivi actif des annonces", "neutral");
      break;
    case "curieux":
      add(-4, "Début de la réflexion", "negative");
      break;
  }

  // ── Profil d'emploi ───────────────────────────────────────────────────────
  switch (answers.employment) {
    case "salarie_permanent":
      add(10, "Emploi permanent — profil recherché par les prêteurs", "positive");
      break;
    case "retraite":
      add(7, "Revenus de retraite stables", "positive");
      break;
    case "autonome":
    case "entrepreneur":
      add(3, "Travailleur autonome — le revenu net des 2 dernières années sera utilisé", "neutral");
      break;
    case "salarie_contrat":
      add(2, "Emploi à contrat ou temps partiel — historique à documenter", "neutral");
      break;
    case "transition":
      add(-12, "Situation d'emploi en transition — un prêteur voudra de la stabilité", "negative");
      break;
  }

  if (answers.buyingWith === "couple") {
    add(2, "Achat à deux — deux revenus, plus de flexibilité", "positive");
  }

  // ── Mise de fonds vs capacité ─────────────────────────────────────────────
  const requis = capacity.requiredDownForCapacity;
  const manque = capacity.downPaymentGap;
  if (capacity.maxByIncome > 0 && requis > 0) {
    const ratioManque = manque / requis;
    if (manque <= 0) {
      add(15, "Mise de fonds suffisante pour ta pleine capacité", "positive");
    } else if (ratioManque <= 0.25) {
      add(4, "Mise de fonds presque au niveau de ta capacité", "positive");
    } else if (ratioManque <= 0.6) {
      add(-10, "Mise de fonds à compléter pour débloquer ta capacité", "negative");
    } else {
      add(-20, "Mise de fonds encore éloignée de ta capacité", "negative");
    }
  }

  // ── Capacité soutenue par le revenu ───────────────────────────────────────
  if (capacity.maxByIncome >= 400_000) {
    add(8, `Le revenu du ménage soutient un budget confortable pour ${BRAND.region}`, "positive");
  } else if (capacity.maxByIncome >= 250_000) {
    add(3, `Le revenu du ménage soutient un budget réaliste dans ${BRAND.region}`, "neutral");
  } else if (capacity.maxByIncome > 0) {
    add(-8, "Le revenu retenu limite le budget accessible", "negative");
  } else {
    add(-15, "Revenu insuffisant pour supporter une hypothèque actuellement", "negative");
  }

  score = clamp(Math.round(score), 15, 98);

  return { score, verdict: verdictFor(score, capacity, answers), factors, capacity };
}

function verdictFor(
  score: number,
  capacity: ScoringResult["capacity"],
  answers: Answers
): Verdict {
  // Projet à bâtir : le revenu ne supporte pas encore un achat crédible.
  if (capacity.maxByIncome < 150_000 || score < 35) return "a_batir";

  // Mise de fonds : la capacité existe, mais le comptant la bride.
  const requis = capacity.requiredDownForCapacity;
  if (requis > 0 && capacity.downPaymentGap > requis * 0.05) return "mise_de_fonds";

  // Financement : tout est là sauf la validation d'un prêteur.
  if (
    answers.financingStatus === "in_process" ||
    answers.financingStatus === "not_started"
  ) {
    return "financement";
  }

  return "pret";
}
