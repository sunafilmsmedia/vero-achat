"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { VERDICT_HEADLINES } from "@/lib/fallbackReport";
import { BRAND, brokersInlineNames } from "@/lib/brand";
import type { AnalyzeResponse, Answers, CapacityResult, Verdict } from "@/lib/types";
import ContactForm from "./ContactForm";
import ProgramsBlock from "./ProgramsBlock";

interface Props {
  analyze: AnalyzeResponse;
  answers: Answers;
  // "yes" → la personne s'est engagée à recevoir l'analyse : le contenu est
  // bloqué derrière le ContactForm. "no" → résultats affichés directement.
  revealChoice: "yes" | "no";
  onRestart: () => void;
}

const VERDICT_BADGE: Record<Verdict, { label: string; color: string; bg: string; ring: string }> = {
  pret: {
    label: "Prêt à acheter",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/30",
  },
  financement: {
    label: "Presque prêt",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/30",
  },
  mise_de_fonds: {
    label: "Presque prêt",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/30",
  },
  a_batir: {
    label: "Projet à bâtir",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/30",
  },
};

type SubmissionState =
  | { kind: "pending" }
  | { kind: "done"; stored: boolean; firstName: string };

export default function ResultsScreen({ analyze, answers, revealChoice, onRestart }: Props) {
  const { scoring, report } = analyze;
  const capacity = scoring.capacity;
  const badge = VERDICT_BADGE[scoring.verdict];
  const [submission, setSubmission] = useState<SubmissionState>({ kind: "pending" });

  const isGated = revealChoice === "yes" && submission.kind === "pending";
  const showPrograms = capacity.downPaymentGap > 0 || scoring.verdict === "a_batir";

  if (isGated) {
    return (
      <div className="min-h-screen px-5 sm:px-8 py-12 sm:py-16 max-w-xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="relative mx-auto mb-7 w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-[var(--color-brand-500)]/20 blur-xl" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-gold-soft)] to-[var(--color-gold)] border border-white/10 flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(201,162,39,0.5)]">
              <svg className="w-7 h-7 text-[#0a0a0a]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="9" width="12" height="9" rx="2" />
                <path d="M7 9V6.5C7 4.8 8.3 3.5 10 3.5C11.7 3.5 13 4.8 13 6.5V9" />
              </svg>
            </div>
          </div>

          <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-brand-300)] mb-3">
            Analyse complète disponible
          </p>
          <h1 className="display-title text-[2rem] sm:text-5xl text-[var(--color-brand-100)] text-balance">
            Votre pouvoir d&apos;achat est calculé.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed text-balance max-w-md mx-auto">
            Laissez-nous vos coordonnées pour débloquer votre portrait complet et recevoir
            votre appel personnalisé avec {brokersInlineNames()}.
          </p>
        </motion.div>

        <div className="mt-10">
          <ContactForm
            answers={answers}
            verdict={scoring.verdict}
            gated
            onSubmitted={(r) => setSubmission({ kind: "done", ...r })}
          />
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={onRestart}
            className="text-xs text-slate-500 hover:text-[var(--color-brand-200)] transition-colors"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 sm:px-8 py-10 sm:py-14 max-w-3xl mx-auto w-full">
      {/* Verdict badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-center mb-8"
      >
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${badge.bg} ring-1 ${badge.ring}`}>
          <span className={`w-2 h-2 rounded-full ${badge.color.replace("text-", "bg-")}`} />
          <span className={`text-xs font-medium tracking-wide ${badge.color}`}>{badge.label}</span>
        </div>
      </motion.div>

      {/* Verdict + résumé */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-12"
      >
        <h1 className="display-title text-[2rem] sm:text-5xl lg:text-6xl text-[var(--color-brand-100)] text-balance">
          {VERDICT_HEADLINES[scoring.verdict]}
        </h1>
        <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed text-balance max-w-2xl mx-auto">
          {report.summary}
        </p>
      </motion.div>

      {/* Capacité d'achat — la pièce maîtresse */}
      <CapacityCard capacity={capacity} downPayment={answers.downPayment ?? 0} />

      {/* Score */}
      <div className="mt-6">
        <ScoreCard score={scoring.score} verdict={scoring.verdict} />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="text-center text-[11px] sm:text-xs text-slate-500 italic mt-3"
      >
        Estimation indicative — un courtier vous appellera pour la valider avec vous.
      </motion.p>

      {/* Capture (ou confirmation) */}
      {submission.kind === "pending" ? (
        <ContactForm
          answers={answers}
          verdict={scoring.verdict}
          onSubmitted={(r) => setSubmission({ kind: "done", ...r })}
        />
      ) : (
        <ConfirmationBlock stored={submission.stored} firstName={submission.firstName} />
      )}

      {/* Stats secondaires */}
      <div className="grid sm:grid-cols-3 gap-3 mt-12">
        {report.stats.slice(1, 4).map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.07 }}
            className="glass-card rounded-2xl p-5"
          >
            <p className="text-[11px] uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className="font-serif text-2xl text-[var(--color-brand-100)] mt-1">{s.value}</p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{s.detail}</p>
          </motion.div>
        ))}
      </div>

      {/* Programmes — seulement quand la mise de fonds est le frein */}
      {showPrograms && <ProgramsBlock gap={capacity.downPaymentGap} />}

      {/* Donnée de marché */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="
          mt-12
          rounded-2xl
          bg-gradient-to-br from-[var(--color-gold)]/10 to-[var(--color-gold)]/5
          border border-[var(--color-gold)]/25
          p-5 sm:p-6
        "
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-gold)]/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--color-brand-300)]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 17V9L10 3L17 9V17H12V12H8V17Z" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-brand-300)] mb-1.5">
              Donnée du marché
            </p>
            <p className="text-sm sm:text-base text-[var(--color-brand-100)] leading-relaxed">
              {report.marketInsight}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Facteurs détectés */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        className="mt-10"
      >
        <h3 className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-4">
          Facteurs détectés
        </h3>
        <ul className="space-y-2">
          {scoring.factors.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${
                  f.tone === "positive"
                    ? "bg-emerald-400"
                    : f.tone === "negative"
                    ? "bg-rose-400"
                    : "bg-slate-500"
                }`}
              />
              <span className="text-[var(--color-slate-300)]">{f.label}</span>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Prochaines étapes */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.75 }}
        className="mt-12"
      >
        <h3 className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-5">
          Prochaines étapes
        </h3>
        <ol className="space-y-3">
          {report.steps.map((s, i) => (
            <li key={i} className="glass-card rounded-2xl p-4 sm:p-5 flex gap-4">
              <span className="
                shrink-0 w-8 h-8 rounded-full
                bg-gradient-to-br from-[var(--color-gold-soft)] to-[var(--color-gold)]
                flex items-center justify-center
                font-serif text-[#0a0a0a] text-sm
                shadow-[0_6px_18px_-4px_rgba(201,162,39,0.5)]
              ">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-[var(--color-brand-100)]">{s.title}</p>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">{s.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </motion.section>

      {/* Avis */}
      <p className="mt-10 text-[11px] text-slate-500 leading-relaxed">
        Ces montants sont une estimation prudente calculée à un taux d&apos;admissibilité
        de {capacity.qualifyingRate.toString().replace(".", ",")} % sur {capacity.amortizationYears} ans.
        Vos dettes personnelles (auto, marges, cartes) ne sont pas incluses : le montant
        confirmé par un prêteur peut être plus bas. Ce n&apos;est ni une préapprobation
        ni un engagement de prêt.
      </p>

      {/* Footer */}
      <div className="mt-10 mb-24 sm:mb-12 text-center">
        <button
          onClick={onRestart}
          className="text-sm text-slate-400 hover:text-[var(--color-brand-200)] transition-colors underline underline-offset-4 decoration-white/25 hover:decoration-[var(--color-brand-400)]"
        >
          Refaire l&apos;analyse
        </button>
        <p className="mt-6 text-[10px] text-slate-600 uppercase tracking-[0.2em]">
          Analyse {analyze.generatedBy === "claude" ? "IA" : "déterministe"} · {BRAND.teamName} · {BRAND.city}
        </p>
      </div>
    </div>
  );
}

// Carte principale : ce que la situation pourrait supporter, puis l'écart de
// mise de fonds chiffré quand c'est le facteur limitant.
function CapacityCard({
  capacity,
  downPayment,
}: {
  capacity: CapacityResult;
  downPayment: number;
}) {
  const hasGap = capacity.downPaymentGap > 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="
        relative overflow-hidden
        rounded-3xl p-7 sm:p-9
        bg-black/[0.02]
        border border-[var(--color-slate-accent)]/25
        shadow-[0_30px_80px_-30px_rgba(0, 0, 0, 0.18)]
      "
    >
      <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[var(--color-gold)]/10 blur-3xl" />

      <div className="relative">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          Ce que votre situation pourrait supporter
        </p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="font-serif text-5xl sm:text-6xl text-[var(--color-brand-100)] leading-none mt-3"
        >
          {formatCurrency(capacity.maxByIncome)}
        </motion.p>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
          Estimation basée sur le revenu du ménage, votre profil d&apos;emploi et la mise
          de fonds minimale exigée. 💪
        </p>

        {hasGap && (
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-black/[0.03] border border-[var(--color-slate-accent)]/20 px-4 py-3.5">
              <p className="text-sm text-[var(--color-brand-100)] leading-relaxed">
                💡 Votre mise de fonds actuelle ({formatCurrency(downPayment)}) vous limite à{" "}
                <strong className="font-semibold">{formatCurrency(capacity.maxByDownPayment)}</strong>{" "}
                aujourd&apos;hui.
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-gold)]/[0.09] border border-[var(--color-gold)]/30 px-4 py-3.5">
              <p className="text-sm text-[var(--color-brand-100)] leading-relaxed">
                🎯 Pour débloquer votre plein potentiel, visez une mise d&apos;environ{" "}
                <strong className="font-semibold">
                  {formatCurrency(capacity.requiredDownForCapacity)}
                </strong>{" "}
                — il vous manque {formatCurrency(capacity.downPaymentGap)}.
              </p>
            </div>
          </div>
        )}

        {!hasGap && capacity.realisticBudget > 0 && (
          <div className="mt-6 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/25 px-4 py-3.5">
            <p className="text-sm text-[var(--color-brand-100)] leading-relaxed">
              ✅ Votre mise de fonds de {formatCurrency(downPayment)} couvre déjà le minimum
              exigé — rien ne bride votre capacité aujourd&apos;hui.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ConfirmationBlock({ stored, firstName }: { stored: boolean; firstName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`
        mt-12 rounded-3xl p-6 sm:p-8
        ${stored
          ? "bg-gradient-to-br from-emerald-400/20 to-emerald-200/10 border border-emerald-500/30"
          : "bg-gradient-to-br from-[var(--color-gold)]/10 to-transparent border border-[var(--color-gold)]/30"}
      `}
    >
      {stored ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7L10 3L17 7M3 7V15A2 2 0 0 0 5 17H15A2 2 0 0 0 17 15V7M3 7L10 11L17 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="font-serif text-xl sm:text-2xl text-[var(--color-brand-100)]">
              Merci {firstName}, votre plan d&apos;achat arrive.
            </p>
          </div>
          <p className="text-sm sm:text-base text-[var(--color-slate-300)] leading-relaxed">
            Vous allez recevoir votre analyse complète par courriel dans les prochaines minutes,
            et {brokersInlineNames()} vous contactera pour valider vos chiffres avec vous.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-[var(--color-gold)]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10 2 L17 6 L17 11 C17 14.5 14 17.5 10 18 C6 17.5 3 14.5 3 11 L3 6 Z" strokeLinejoin="round" />
              <path d="M7 10 L9.5 12.5 L14 8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="font-serif text-xl sm:text-2xl text-[var(--color-gold-soft)]">
              Vos coordonnées n&apos;ont pas été conservées.
            </p>
          </div>
          <p className="text-sm sm:text-base text-[var(--color-gold-soft)]/85 leading-relaxed">
            Votre analyse reste affichée ici. Revenez nous voir quand vous voudrez en parler
            à quelqu&apos;un.
          </p>
        </>
      )}
    </motion.div>
  );
}

function ScoreCard({ score, verdict }: { score: number; verdict: Verdict }) {
  const barClass =
    verdict === "pret"
      ? "bg-gradient-to-r from-emerald-300 to-emerald-400"
      : verdict === "a_batir"
      ? "bg-gradient-to-r from-rose-300 to-rose-400"
      : "bg-gradient-to-r from-amber-300 to-amber-400";

  const note =
    verdict === "pret"
      ? "Tout est aligné : financement, mise de fonds et échéancier."
      : verdict === "financement"
      ? "Il ne manque que la validation d'un prêteur."
      : verdict === "mise_de_fonds"
      ? "La capacité est là — c'est la mise de fonds qui bride le budget."
      : "Le projet se construit : revenus, mise de fonds, puis achat.";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="
        relative overflow-hidden
        rounded-3xl p-7 sm:p-9
        bg-gradient-to-br from-[#fdfaf1] to-[#f6efda]
        border border-[var(--color-gold)]/30
        shadow-[0_30px_80px_-30px_rgba(0, 0, 0, 0.20)]
      "
    >
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[var(--color-gold)]/15 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[var(--color-gold)]/10 blur-3xl" />

      <div className="relative">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-brand-300)]">
          Score de préparation
        </p>
        <div className="flex items-baseline gap-2 mt-3">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="font-serif text-7xl sm:text-8xl text-[var(--color-brand-100)] leading-none"
          >
            {score}
          </motion.span>
          <span className="font-serif text-2xl text-[var(--color-brand-100)]/45">/100</span>
        </div>

        <div className="mt-6 h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`h-full rounded-full ${barClass}`}
          />
        </div>

        <p className="mt-4 text-sm text-[var(--color-brand-200)]">{note}</p>
      </div>
    </motion.div>
  );
}
