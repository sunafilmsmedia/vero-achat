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
    title: "Êtes-vous déjà préqualifié pour une hypothèque ?",
    subtitle: "Aucune mauvaise réponse — ça nous dit simplement où vous en êtes.",
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
    title: "Quel type de propriété vous intéresse le plus ?",
    subtitle: "Celui vers lequel vous penchez aujourd'hui.",
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
    title: "Quels secteurs vous intéressent le plus ?",
    subtitle: "Choisissez-en jusqu'à 3 — ou écrivez le vôtre.",
  },
  {
    id: "purchaseTimeline",
    kind: "choice",
    title: "Dans combien de temps aimeriez-vous acheter ?",
    subtitle: "Votre meilleur estimé, sans pression.",
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
    title: "Où en êtes-vous dans votre parcours ?",
    subtitle: "Pour adapter notre accompagnement à votre situation.",
    autoAdvance: true,
    choices: [
      { value: "premiere_maison", label: "Ce sera ma première maison" },
      { value: "investisseur", label: "Je suis investisseur" },
      { value: "vendre_pour_acheter", label: "Je dois vendre pour acheter" },
      { value: "separation", label: "Je suis en séparation" },
    ],
  },
  {
    id: "buyingWith",
    kind: "choice",
    title: "Achetez-vous seul(e) ou avec un co-acheteur ?",
    subtitle: "Ça change ce qui est réaliste pour votre budget.",
    autoAdvance: true,
    choices: [
      { value: "seul", label: "Seul(e)" },
      { value: "co_acheteur", label: "Avec un co-acheteur", hint: "Conjoint(e), parent, ami(e)…" },
      { value: "co_acheteurs", label: "Avec plus d'un co-acheteur", hint: "Deux co-acheteurs ou plus" },
    ],
  },
  {
    id: "householdIncome",
    kind: "currency",
    title: "Quel est le revenu brut annuel du ménage ?",
    subtitle: "Avant impôts, en additionnant les revenus de tous les acheteurs.",
  },
  {
    id: "downPayment",
    kind: "currency",
    title: "Combien avez-vous de disponible pour la mise de fonds ?",
    subtitle: "Ce qui est réellement disponible aujourd'hui — REER et CELIAPP inclus.",
  },
  {
    id: "employment",
    kind: "choice",
    title: "Quelle est votre situation d'emploi ?",
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
