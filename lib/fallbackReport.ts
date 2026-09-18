// Rapport déterministe — utilisé tel quel quand aucune clé Anthropic n'est
// configurée, et comme filet de sécurité si l'appel à Claude échoue.
// Toutes les phrases restent honnêtes : aucun montant n'est présenté comme
// une approbation, et l'écart de mise de fonds est chiffré sans dramatiser.

import { formatCurrency } from "./format";
import { REGIONS } from "./regions";
import { BRAND } from "./brand";
import type { Answers, Report, ScoringResult, Verdict } from "./types";

const HEADLINES: Record<Verdict, string> = {
  pret: "Vous êtes prêt à passer à l'action.",
  financement: "Presque prêt — il vous manque la préqualification.",
  mise_de_fonds: "Presque prêt — il vous manque la mise de fonds.",
  a_batir: "Votre projet se bâtit — et c'est très correct.",
};

const PROPERTY_LABEL: Record<string, string> = {
  maison: "maison unifamiliale",
  condo: "condo",
  plex: "plex",
  chalet: "chalet",
  ouvert: "propriété",
};

export function regionNames(answers: Answers): string[] {
  return (answers.regions ?? []).map(
    (id) => REGIONS.find((r) => r.id === id)?.name ?? id
  );
}

function summaryFor(verdict: Verdict, answers: Answers, scoring: ScoringResult): string {
  const c = scoring.capacity;
  const type = PROPERTY_LABEL[answers.propertyType ?? "ouvert"] ?? "propriété";

  switch (verdict) {
    case "pret":
      return `Votre situation vous permet de viser une ${type} autour de ${formatCurrency(
        c.realisticBudget
      )} dans ${BRAND.region}. Financement, mise de fonds et échéancier sont alignés : la prochaine étape, c'est de regarder ce qui est réellement disponible dans vos secteurs.`;
    case "financement":
      return `Votre mise de fonds soutient un budget d'environ ${formatCurrency(
        c.realisticBudget
      )}. Il vous manque une seule pièce : la validation d'un prêteur. Une préqualification prend généralement moins de 48 heures et transforme votre budget en offre crédible.`;
    case "mise_de_fonds":
      return `Votre situation vous permet de viser gros. La seule pièce qui manque, c'est la mise de fonds — et ça, ça se bâtit. Avec ${formatCurrency(
        answers.downPayment ?? 0
      )} aujourd'hui, vous visez ${formatCurrency(
        c.maxByDownPayment
      )} ; il vous manque ${formatCurrency(
        c.downPaymentGap
      )} pour débloquer votre plein potentiel.`;
    case "a_batir":
      return `Aujourd'hui, les chiffres ne soutiennent pas encore un achat dans ${BRAND.region} — et le savoir maintenant vous évite de perdre du temps. En travaillant le revenu retenu et la mise de fonds, votre projet devient réaliste plus vite que vous pensez.`;
  }
}

function stepsFor(verdict: Verdict, answers: Answers, scoring: ScoringResult) {
  const c = scoring.capacity;
  const secteurs = regionNames(answers);
  const secteurTexte = secteurs.length ? secteurs.slice(0, 3).join(", ") : "vos secteurs";

  switch (verdict) {
    case "pret":
      return [
        {
          title: "Confirmer votre budget avec votre prêteur",
          description: `Faites valider ${formatCurrency(
            c.realisticBudget
          )} noir sur blanc — les dettes personnelles (auto, marges, cartes) ne sont pas incluses dans notre estimation.`,
        },
        {
          title: "Cadrer vos critères avec un courtier",
          description: `On traduit votre budget en propriétés réelles dans ${secteurTexte}, avec ce qui se vend vraiment à ce prix.`,
        },
        {
          title: "Recevoir les nouveautés avant tout le monde",
          description: "Une alerte sur mesure vous donne quelques heures d'avance sur les propriétés qui correspondent à vos critères.",
        },
        {
          title: "Préparer votre stratégie d'offre",
          description: `Conditions, inspection, délais : ce qui fait accepter une offre dans ${BRAND.region} n'est pas toujours le prix le plus élevé.`,
        },
      ];
    case "financement":
      return [
        {
          title: "Obtenir votre préqualification",
          description: "48 heures et quelques documents suffisent. Sans ça, une offre a beaucoup moins de poids auprès d'un vendeur.",
        },
        {
          title: "Rassembler vos documents",
          description: "Talons de paie, avis de cotisation, preuve de mise de fonds : les avoir prêts accélère tout le reste.",
        },
        {
          title: "Valider votre budget réel",
          description: `Notre estimation de ${formatCurrency(
            c.realisticBudget
          )} ne tient pas compte de vos dettes — le prêteur, lui, va les inclure.`,
        },
        {
          title: "Commencer les visites en parallèle",
          description: `Rien n'empêche de visiter dans ${secteurTexte} pendant que votre financement se confirme.`,
        },
      ];
    case "mise_de_fonds":
      return [
        {
          title: "Chiffrer votre objectif de mise de fonds",
          description: `Visez ${formatCurrency(
            c.requiredDownForCapacity
          )} pour débloquer ${formatCurrency(c.maxByIncome)} — il vous manque ${formatCurrency(
            c.downPaymentGap
          )}.`,
        },
        {
          title: "Activer les bons programmes",
          description: "RAP, CELIAPP, crédit d'impôt pour l'achat d'une première habitation, remboursement de la TPS/TVQ sur le neuf : plusieurs se cumulent.",
        },
        {
          title: "Explorer la remise en argent hypothécaire",
          description: "Certains prêteurs offrent une remise (cash-back) qui peut combler une partie de l'écart. À valider avec un courtier hypothécaire.",
        },
        {
          title: "Rester actif dans votre recherche",
          description: `On peut déjà surveiller ${secteurTexte} pour vous et vous avertir quand une propriété entre dans votre budget actuel.`,
        },
      ];
    case "a_batir":
      return [
        {
          title: "Faire le point avec un courtier hypothécaire",
          description: "Un appel gratuit permet de voir précisément quel revenu et quelle mise de fonds débloqueraient votre projet.",
        },
        {
          title: "Bâtir votre mise de fonds avec le CELIAPP",
          description: "Jusqu'à 8 000 $ par année, déductible d'impôt, et retirable sans impôt pour une première propriété.",
        },
        {
          title: "Stabiliser le revenu retenu",
          description: "Les prêteurs veulent un historique. Quelques mois de stabilité changent complètement le montant accordé.",
        },
        {
          title: "Se donner une échéance réaliste",
          description: "Un plan sur 12 à 24 mois vaut mieux qu'une offre refusée. On reste disponibles quand vous serez prêt.",
        },
      ];
  }
}

function marketInsightFor(answers: Answers): string {
  const secteurs = regionNames(answers);
  const secteur = secteurs[0] ?? BRAND.region;
  return `Dans ${secteur}, le budget qui compte n'est pas celui affiché : ce sont les propriétés réellement disponibles dans votre fourchette. Un courtier acheteur voit les inscriptions au moment où elles entrent sur le marché, et connaît les propriétés qui n'ont pas encore été annoncées.`;
}

export function buildFallbackReport(answers: Answers, scoring: ScoringResult): Report {
  const c = scoring.capacity;
  const verdict = scoring.verdict;

  const stats = [
    {
      label: "Ce que votre situation pourrait supporter",
      value: formatCurrency(c.maxByIncome),
      detail: "Estimation basée sur le revenu du ménage, votre profil d'emploi et la mise de fonds minimale exigée.",
    },
    {
      label: "Budget réaliste aujourd'hui",
      value: formatCurrency(c.realisticBudget),
      detail:
        c.limitedBy === "mise_de_fonds"
          ? "Ce que votre mise de fonds actuelle vous permet de viser dès maintenant."
          : "Ce que votre situation globale vous permet de viser dès maintenant.",
    },
    {
      label: "Paiement mensuel estimé",
      value: `${formatCurrency(c.monthlyPayment)} / mois`,
      detail: `Capital et intérêts seulement, au taux d'admissibilité prudent de ${c.qualifyingRate
        .toString()
        .replace(".", ",")} % sur ${c.amortizationYears} ans. Taxes et assurances en sus.`,
    },
    {
      label: "Mise de fonds visée",
      value: formatCurrency(c.requiredDownForCapacity),
      detail:
        c.downPaymentGap > 0
          ? `Il vous manque ${formatCurrency(c.downPaymentGap)} pour débloquer votre pleine capacité.`
          : "Votre mise de fonds actuelle couvre déjà le minimum exigé pour votre capacité.",
    },
  ];

  return {
    headline: HEADLINES[verdict],
    summary: summaryFor(verdict, answers, scoring),
    stats,
    steps: stepsFor(verdict, answers, scoring),
    marketInsight: marketInsightFor(answers),
  };
}

export const VERDICT_HEADLINES = HEADLINES;
