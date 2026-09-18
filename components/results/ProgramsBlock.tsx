"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";

interface Props {
  // Montant qu'il reste à accumuler (0 = mise de fonds déjà suffisante).
  gap: number;
}

// Programmes réellement disponibles au Québec pour bâtir une mise de fonds.
// Les montants sont indicatifs : l'admissibilité dépend de la situation et
// doit être validée avec un courtier hypothécaire ou un fiscaliste.
const PROGRAMMES = [
  {
    nom: "CELIAPP",
    montant: "8 000 $ / an",
    detail:
      "Compte d'épargne libre d'impôt pour l'achat d'une première propriété : 40 000 $ à vie, déductible du revenu, et le retrait n'est jamais imposé.",
  },
  {
    nom: "RAP",
    montant: "jusqu'à 60 000 $",
    detail:
      "Le régime d'accession à la propriété permet de retirer ton REER sans impôt pour ta mise de fonds, remboursable sur 15 ans.",
  },
  {
    nom: "Crédits d'impôt premier acheteur",
    montant: "jusqu'à 2 900 $",
    detail:
      "Environ 1 500 $ au fédéral et 1 400 $ au Québec, réclamés dans ta déclaration l'année de l'achat.",
  },
  {
    nom: "Remise en argent hypothécaire",
    montant: "variable",
    detail:
      "Certains prêteurs versent une remise (cash-back) à la signature. À comparer avec le taux offert — un courtier hypothécaire fait le calcul.",
  },
  {
    nom: "Don familial",
    montant: "sans limite",
    detail:
      "Les prêteurs acceptent un don d'un proche parent avec une simple lettre de don. C'est la voie la plus rapide quand l'écart est petit.",
  },
];

export default function ProgramsBlock({ gap }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="mt-12"
    >
      <h3 className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">
        Programmes pour bâtir ta mise de fonds
      </h3>
      {gap > 0 && (
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          Il te manque {formatCurrency(gap)}. Plusieurs de ces programmes se cumulent —
          c&apos;est souvent plus rapide qu&apos;on pense.
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {PROGRAMMES.map((p, i) => (
          <motion.div
            key={p.nom}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 + i * 0.05 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium text-[var(--color-brand-100)]">{p.nom}</p>
              <span className="text-xs font-medium text-[var(--color-gold)] shrink-0">
                {p.montant}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{p.detail}</p>
          </motion.div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-slate-500 italic leading-relaxed">
        Montants indicatifs. L&apos;admissibilité dépend de ta situation et doit être
        confirmée avec un courtier hypothécaire.
      </p>
    </motion.section>
  );
}
