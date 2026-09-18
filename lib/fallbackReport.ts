// Rapport déterministe — utilisé tel quel quand aucune clé Anthropic n'est
// configurée, et comme filet de sécurité si l'appel à Claude échoue.
// Toutes les phrases restent honnêtes : aucun montant n'est présenté comme
// une approbation, et l'écart de mise de fonds est chiffré sans dramatiser.

import { formatCurrency } from "./format";
import { REGIONS } from "./regions";
import { BRAND } from "./brand";
import type { Answers, Report, ScoringResult, Verdict } from "./types";

const HEADLINES: Record<Verdict, string> = {
  pret: "Tu es prêt à passer à l'action.",
  financement: "Presque prêt — il te manque la préqualification.",
  mise_de_fonds: "Presque prêt — il te manque la mise de fonds.",
  a_batir: "Ton projet se bâtit — et c'est très correct.",
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
      return `Ta situation te permet de viser une ${type} autour de ${formatCurrency(
        c.realisticBudget
      )} dans ${BRAND.region}. Financement, mise de fonds et échéancier sont alignés : la prochaine étape, c'est de regarder ce qui est réellement disponible dans tes secteurs.`;
    case "financement":
      return `Ta mise de fonds soutient un budget d'environ ${formatCurrency(
        c.realisticBudget
      )}. Il te manque une seule pièce : la validation d'un prêteur. Une préqualification prend généralement moins de 48 heures et transforme ton budget en offre crédible.`;
    case "mise_de_fonds":
      return `Ta situation te permet de viser gros. La seule pièce qui manque, c'est la mise de fonds — et ça, ça se bâtit. Avec ${formatCurrency(
        answers.downPayment ?? 0
      )} aujourd'hui, tu vises ${formatCurrency(
        c.maxByDownPayment
      )} ; il te manque ${formatCurrency(
        c.downPaymentGap
      )} pour débloquer ton plein potentiel.`;
    case "a_batir":
      return `Aujourd'hui, les chiffres ne soutiennent pas encore un achat dans ${BRAND.region} — et le savoir maintenant t'évite de perdre du temps. En travaillant le revenu retenu et la mise de fonds, ton projet devient réaliste plus vite que tu penses.`;
  }
}

function stepsFor(verdict: Verdict, answers: Answers, scoring: ScoringResult) {
  const c = scoring.capacity;
  const secteurs = regionNames(answers);
  const secteurTexte = secteurs.length ? secteurs.slice(0, 3).join(", ") : "tes secteurs";

  switch (verdict) {
    case "pret":
      return [
        {
          title: "Confirmer ton budget avec ton prêteur",
          description: `Fais valider ${formatCurrency(
            c.realisticBudget
          )} noir sur blanc — les dettes personnelles (auto, marges, cartes) ne sont pas incluses dans notre estimation.`,
        },
        {
          title: "Cadrer tes critères avec un courtier",
          description: `On traduit ton budget en propriétés réelles dans ${secteurTexte}, avec ce qui se vend vraiment à ce prix.`,
        },
        {
          title: "Recevoir les nouveautés avant tout le monde",
          description: "Une alerte sur mesure te donne quelques heures d'avance sur les propriétés qui correspondent à tes critères.",
        },
        {
          title: "Préparer ta stratégie d'offre",
          description: `Conditions, inspection, délais : ce qui fait accepter une offre dans ${BRAND.region} n'est pas toujours le prix le plus élevé.`,
        },
      ];
    case "financement":
      return [
        {
          title: "Obtenir ta préqualification",
          description: "48 heures et quelques documents suffisent. Sans ça, une offre a beaucoup moins de poids auprès d'un vendeur.",
        },
        {
          title: "Rassembler tes documents",
          description: "Talons de paie, avis de cotisation, preuve de mise de fonds : les avoir prêts accélère tout le reste.",
        },
        {
          title: "Valider ton budget réel",
          description: `Notre estimation de ${formatCurrency(
            c.realisticBudget
          )} ne tient pas compte de tes dettes — le prêteur, lui, va les inclure.`,
        },
        {
          title: "Commencer les visites en parallèle",
          description: `Rien n'empêche de visiter dans ${secteurTexte} pendant que ton financement se confirme.`,
        },
      ];
    case "mise_de_fonds":
      return [
        {
          title: "Chiffrer ton objectif de mise de fonds",
          description: `Vise ${formatCurrency(
            c.requiredDownForCapacity
          )} pour débloquer ${formatCurrency(c.maxByIncome)} — il te manque ${formatCurrency(
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
          title: "Rester actif dans ta recherche",
          description: `On peut déjà surveiller ${secteurTexte} pour toi et t'avertir quand une propriété entre dans ton budget actuel.`,
        },
      ];
    case "a_batir":
      return [
        {
          title: "Faire le point avec un courtier hypothécaire",
          description: "Un appel gratuit permet de voir précisément quel revenu et quelle mise de fonds débloqueraient ton projet.",
        },
        {
          title: "Bâtir ta mise de fonds avec le CELIAPP",
          description: "Jusqu'à 8 000 $ par année, déductible d'impôt, et retirable sans impôt pour une première propriété.",
        },
        {
          title: "Stabiliser le revenu retenu",
          description: "Les prêteurs veulent un historique. Quelques mois de stabilité changent complètement le montant accordé.",
        },
        {
          title: "Se donner une échéance réaliste",
          description: "Un plan sur 12 à 24 mois vaut mieux qu'une offre refusée. On reste disponibles quand tu seras prêt.",
        },
      ];
  }
}

function marketInsightFor(answers: Answers): string {
  const secteurs = regionNames(answers);
  const secteur = secteurs[0] ?? BRAND.region;
  return `Dans ${secteur}, le budget qui compte n'est pas celui affiché : ce sont les propriétés réellement disponibles dans ta fourchette. Un courtier acheteur voit les inscriptions au moment où elles entrent sur le marché, et connaît les propriétés qui n'ont pas encore été annoncées.`;
}

export function buildFallbackReport(answers: Answers, scoring: ScoringResult): Report {
  const c = scoring.capacity;
  const verdict = scoring.verdict;

  const stats = [
    {
      label: "Ce que ta situation pourrait supporter",
      value: formatCurrency(c.maxByIncome),
      detail: "Estimation basée sur le revenu du ménage, ton profil d'emploi et la mise de fonds minimale exigée.",
    },
    {
      label: "Budget réaliste aujourd'hui",
      value: formatCurrency(c.realisticBudget),
      detail:
        c.limitedBy === "mise_de_fonds"
          ? "Ce que ta mise de fonds actuelle te permet de viser dès maintenant."
          : "Ce que ta situation globale te permet de viser dès maintenant.",
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
          ? `Il te manque ${formatCurrency(c.downPaymentGap)} pour débloquer ta pleine capacité.`
          : "Ta mise de fonds actuelle couvre déjà le minimum exigé pour ta capacité.",
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
