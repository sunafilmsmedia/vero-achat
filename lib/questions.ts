import type { Answers } from "./types";

export type QuestionId =
  | "financingStatus"
  | "propertyType"
  | "regions"
  | "purchaseTimeline"
  | "journeyStage"
  | "buyingWith"
  | "householdIncome"
  | "downPayment"
  | "employment";

export type QuestionKind = "choice" | "regions" | "currency";

export interface Choice<V extends string = string> {
  value: V;
  label: string;
  hint?: string;
}

export interface QuestionDef {
  id: QuestionId;
  kind: QuestionKind;
  title: string;
  subtitle?: string;
  choices?: Choice[];
  autoAdvance?: boolean;
  showIf?: (a: Answers) => boolean;
}

export const QUESTIONS: QuestionDef[] = [
  {
    id: "financingStatus",
    kind: "choice",
    title: "Es-tu déjà préqualifié pour une hypothèque ?",
    subtitle: "Aucune mauvaise réponse — ça nous dit simplement où tu en es.",
    autoAdvance: true,
    choices: [
      { value: "preapproved", label: "Oui, je suis préapprouvé", hint: "Une lettre d'un prêteur en main" },
      { value: "prequalified", label: "Oui, je suis préqualifié", hint: "Un montant estimé par un courtier hypothécaire" },
      { value: "in_process", label: "C'est en cours", hint: "J'ai commencé les démarches" },
      { value: "not_started", label: "Pas encore", hint: "Je n'ai rien commencé de ce côté" },
    ],
  },
  {
    id: "propertyType",
    kind: "choice",
    title: "Quel type de propriété t'intéresse le plus ?",
    subtitle: "Celui vers lequel tu penches aujourd'hui.",
    autoAdvance: true,
    choices: [
      { value: "maison", label: "Maison unifamiliale", hint: "Détachée ou jumelée" },
      { value: "condo", label: "Condo", hint: "Copropriété" },
      { value: "plex", label: "Plex", hint: "Duplex, triplex, multilogement" },
      { value: "chalet", label: "Chalet", hint: "Résidence secondaire ou bord de l'eau" },
      { value: "ouvert", label: "Je suis ouvert", hint: "Ça dépend de l'opportunité" },
    ],
  },
  {
    id: "regions",
    kind: "regions",
    title: "Quels secteurs t'intéressent le plus ?",
    subtitle: "Choisis-en jusqu'à 3 — ou écris le tien.",
  },
  {
    id: "purchaseTimeline",
    kind: "choice",
    title: "Dans combien de temps aimerais-tu acheter ?",
    subtitle: "Ton meilleur estimé, sans pression.",
    autoAdvance: true,
    choices: [
      { value: "asap", label: "Dès que je trouve la bonne propriété" },
      { value: "0_3_mois", label: "Dans les 3 prochains mois" },
      { value: "3_6_mois", label: "Dans 3 à 6 mois" },
      { value: "6_12_mois", label: "Dans 6 à 12 mois" },
      { value: "plus_12_mois", label: "Dans plus de 12 mois", hint: "Je prépare mon projet" },
    ],
  },
  {
    id: "journeyStage",
    kind: "choice",
    title: "Où en es-tu dans ton parcours ?",
    subtitle: "Pour adapter le plan à ton avancement réel.",
    autoAdvance: true,
    choices: [
      { value: "curieux", label: "Je commence à peine à regarder" },
      { value: "recherche", label: "Je suis les annonces sérieusement" },
      { value: "visites", label: "Je visite des propriétés" },
      { value: "offres", label: "J'ai déjà fait une ou des offres" },
    ],
  },
  {
    id: "buyingWith",
    kind: "choice",
    title: "Tu achètes seul(e) ou en couple ?",
    subtitle: "Ça change ce qui est réaliste pour ton budget.",
    autoAdvance: true,
    choices: [
      { value: "seul", label: "Seul(e)" },
      { value: "couple", label: "En couple", hint: "Ou avec un co-acheteur" },
    ],
  },
  {
    id: "householdIncome",
    kind: "currency",
    title: "Quel est le revenu brut annuel du ménage ?",
    subtitle: "Avant impôts, en additionnant tous les revenus du ménage.",
  },
  {
    id: "downPayment",
    kind: "currency",
    title: "Combien as-tu de disponible pour la mise de fonds ?",
    subtitle: "Ce qui est réellement disponible aujourd'hui — REER et CELIAPP inclus.",
  },
  {
    id: "employment",
    kind: "choice",
    title: "Quelle est ta situation d'emploi ?",
    subtitle: "C'est ce que les prêteurs regardent en premier.",
    autoAdvance: true,
    choices: [
      { value: "salarie_permanent", label: "Salarié permanent", hint: "Temps plein" },
      { value: "salarie_contrat", label: "Salarié à contrat ou temps partiel", hint: "Saisonnier, contractuel" },
      { value: "autonome", label: "Travailleur autonome" },
      { value: "entrepreneur", label: "Entrepreneur", hint: "Propriétaire d'entreprise" },
      { value: "retraite", label: "Retraité" },
      { value: "transition", label: "En transition", hint: "Entre deux emplois, études…" },
    ],
  },
];

export function getVisibleQuestions(answers: Answers): QuestionDef[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

export function isAnswered(q: QuestionDef, a: Answers): boolean {
  switch (q.id) {
    case "financingStatus": return !!a.financingStatus;
    case "propertyType": return !!a.propertyType;
    case "regions": return Array.isArray(a.regions) && a.regions.length >= 1;
    case "purchaseTimeline": return !!a.purchaseTimeline;
    case "journeyStage": return !!a.journeyStage;
    case "buyingWith": return !!a.buyingWith;
    case "householdIncome": return typeof a.householdIncome === "number" && a.householdIncome > 0;
    case "downPayment": return typeof a.downPayment === "number" && a.downPayment >= 0;
    case "employment": return !!a.employment;
  }
}
