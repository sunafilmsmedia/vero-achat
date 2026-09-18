// ============================================================================
// Types — Logiciel Acheteur IA (Véronique Guillemette)
// ----------------------------------------------------------------------------
// Version ACHETEUR du kit. Contrairement à l'app vendeur, l'analyse produit
// une estimation de CAPACITÉ D'ACHAT (ce que la situation pourrait supporter)
// et un plan de mise de fonds. Ce n'est jamais une préapprobation : les
// chiffres sont indicatifs et doivent être validés par un prêteur.
// ============================================================================

export type FinancingStatus =
  | "preapproved" // déjà préapprouvé par un prêteur
  | "prequalified" // préqualifié (estimation d'un courtier hypothécaire)
  | "in_process" // démarches en cours
  | "not_started"; // rien de commencé

export type PropertyType = "maison" | "condo" | "plex" | "chalet" | "ouvert";

export type PurchaseTimeline =
  | "asap" // dès que je trouve la bonne propriété
  | "0_3_mois"
  | "3_6_mois"
  | "6_12_mois"
  | "plus_12_mois"; // → court-circuit vers la vidéo long terme

export type JourneyStage =
  | "premiere_maison" // ce sera ma première maison
  | "investisseur" // j'achète comme investissement
  | "vendre_pour_acheter" // je dois vendre pour acheter
  | "separation"; // achat dans un contexte de séparation

export type BuyingWith = "seul" | "couple";

export type EmploymentStatus =
  | "salarie_permanent"
  | "salarie_contrat" // temps partiel, contractuel, saisonnier
  | "autonome"
  | "entrepreneur"
  | "retraite"
  | "transition"; // entre deux emplois, retour aux études, etc.

export type Region = {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
};

export interface Answers {
  financingStatus?: FinancingStatus;
  propertyType?: PropertyType;
  // Jusqu'à 3 secteurs (ids de REGIONS ou texte libre saisi par la personne).
  regions?: string[];
  purchaseTimeline?: PurchaseTimeline;
  journeyStage?: JourneyStage;
  buyingWith?: BuyingWith;
  householdIncome?: number;
  downPayment?: number;
  employment?: EmploymentStatus;
}

// ── Capacité d'achat (calcul déterministe, lib/capacity.ts) ─────────────────

export type LimitingFactor = "mise_de_fonds" | "revenu" | "equilibre";

export interface CapacityResult {
  // Revenu retenu après ajustement selon le profil d'emploi.
  incomeConsidered: number;
  // Prix maximal soutenu par la situation (revenu + emploi), en supposant la
  // mise de fonds minimale disponible.
  maxByIncome: number;
  // Plafond imposé par la mise de fonds ACTUELLE (règles minimales du Canada).
  maxByDownPayment: number;
  // Budget réaliste aujourd'hui = le plus petit des deux.
  realisticBudget: number;
  // Mise de fonds nécessaire pour débloquer maxByIncome.
  requiredDownForCapacity: number;
  // Ce qu'il manque pour y arriver (0 si la mise de fonds suffit déjà).
  downPaymentGap: number;
  // Paiement hypothécaire mensuel estimé sur le budget réaliste.
  monthlyPayment: number;
  limitedBy: LimitingFactor;
  qualifyingRate: number;
  amortizationYears: number;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

export type Verdict =
  | "pret" // financement + mise de fonds au rendez-vous
  | "financement" // mise de fonds correcte, financement à confirmer
  | "mise_de_fonds" // capacité intéressante, mise de fonds insuffisante
  | "a_batir"; // projet à construire (revenu et/ou mise de fonds)

export interface ScoringFactor {
  label: string;
  delta: number;
  tone: "positive" | "negative" | "neutral";
}

export interface ScoringResult {
  score: number; // 0-100
  verdict: Verdict;
  factors: ScoringFactor[];
  capacity: CapacityResult;
}

// ── Rapport (IA ou fallback déterministe) ───────────────────────────────────

export interface ReportStat {
  label: string;
  value: string;
  detail: string;
}

export interface ReportStep {
  title: string;
  description: string;
}

export interface Report {
  headline: string;
  summary: string;
  stats: ReportStat[];
  steps: ReportStep[];
  marketInsight: string;
}

export interface AnalyzeResponse {
  scoring: ScoringResult;
  report: Report;
  generatedBy: "claude" | "fallback";
}

// ── Lead ────────────────────────────────────────────────────────────────────

export type LeadType = "acheteur";

export interface LeadPayload {
  name: string;
  phone?: string;
  email: string;
  consent: boolean;
  answers: Answers;
  leadType?: LeadType;
}
