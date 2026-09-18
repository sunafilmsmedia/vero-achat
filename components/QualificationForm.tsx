"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import { getVisibleQuestions, isAnswered } from "@/lib/questions";
import { trackStep } from "@/lib/track";
import { BRAND } from "@/lib/brand";
import type { Answers } from "@/lib/types";
import ProgressBar from "./ProgressBar";
import ChoiceQuestion from "./questions/ChoiceQuestion";
import CurrencyQuestion from "./questions/CurrencyQuestion";
import RegionMultiSearch from "./questions/RegionMultiSearch";

interface Props {
  onComplete: (answers: Answers) => void;
  onLongTerm: (answers: Answers) => void;
  onExit: () => void;
}

const AUTO_ADVANCE_MS = 220;

// Libellés d'étape (Clarity Scanner). Les secteurs sont suivis sans valeur
// (saisie libre possible — jamais de texte en clair).
const STEP_NAMES: Record<string, string> = {
  financingStatus: "financement",
  propertyType: "type_propriete",
  regions: "secteurs",
  purchaseTimeline: "echeancier",
  journeyStage: "parcours",
  buyingWith: "seul_ou_couple",
  householdIncome: "revenu_menage",
  downPayment: "mise_de_fonds",
  employment: "emploi",
};

// Champs dont la valeur est un choix prédéfini → sûr à transmettre.
const CHOICE_FIELDS = new Set([
  "financingStatus",
  "propertyType",
  "purchaseTimeline",
  "journeyStage",
  "buyingWith",
  "employment",
]);

function trackAnswer(partial: Partial<Answers>) {
  const field = Object.keys(partial).find((k) => k in STEP_NAMES);
  if (!field) return;
  const raw = (partial as Record<string, unknown>)[field];
  const value = CHOICE_FIELDS.has(field) && raw != null ? String(raw) : undefined;
  trackStep(STEP_NAMES[field], value);
}

export default function QualificationForm({ onComplete, onLongTerm, onExit }: Props) {
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = useMemo(() => getVisibleQuestions(answers), [answers]);
  const current = visible[Math.min(index, visible.length - 1)];
  const isLast = index >= visible.length - 1;
  const canProceed = current ? isAnswered(current, answers) : false;

  const submit = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    onComplete(answers);
  }, [answers, onComplete]);

  const goNext = useCallback(() => {
    // Étapes à avance manuelle (montants, secteurs) : on suit le passage ici.
    if (current && !current.autoAdvance) {
      trackStep(STEP_NAMES[current.id] ?? current.id);
    }
    setDirection(1);
    if (isLast) submit();
    else setIndex((i) => Math.min(visible.length - 1, i + 1));
  }, [current, isLast, submit, visible.length]);

  const goPrev = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setDirection(-1);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const updateAndMaybeAdvance = useCallback(
    (partial: Partial<Answers>, autoAdvance: boolean, delayMs: number = AUTO_ADVANCE_MS) => {
      let nextAnswers: Answers = answers;
      setAnswers((prev) => {
        const next = { ...prev, ...partial };
        nextAnswers = next;
        return next;
      });

      // Court-circuit : un achat à plus de 12 mois est redirigé vers la vidéo
      // de préparation. Aucune analyse, aucune capture de lead.
      if (partial.purchaseTimeline === "plus_12_mois") {
        trackStep(STEP_NAMES.purchaseTimeline, "plus_12_mois");
        if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = setTimeout(() => onLongTerm(nextAnswers), AUTO_ADVANCE_MS);
        return;
      }

      if (autoAdvance) {
        trackAnswer(partial);
        if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = setTimeout(() => {
          setDirection(1);
          setIndex((i) => {
            const visibleAfter = getVisibleQuestions(nextAnswers);
            if (i >= visibleAfter.length - 1) {
              onComplete(nextAnswers);
              return i;
            }
            return i + 1;
          });
        }, delayMs);
      }
    },
    [answers, onComplete, onLongTerm]
  );

  if (!current) return null;

  return (
    <div className="min-h-screen flex flex-col px-5 sm:px-8 py-6 sm:py-10 max-w-2xl mx-auto w-full">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 mb-8 sm:mb-12">
        <button
          onClick={onExit}
          className="text-xs text-slate-500 hover:text-[var(--color-brand-200)] transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 2L2 6L5 10M2 6H10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </button>
        <div className="font-serif italic text-sm text-[var(--color-brand-300)]">
          {BRAND.teamName}
        </div>
      </header>

      <ProgressBar current={index} total={visible.length} />

      {/* Slide container */}
      <div className="flex-1 mt-10 sm:mt-14 relative">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={current.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-7 sm:mb-9">
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[var(--color-brand-100)] leading-tight tracking-tight text-balance">
                {current.title}
              </h2>
              {current.subtitle && (
                <p className="mt-2.5 text-sm sm:text-base text-slate-400">{current.subtitle}</p>
              )}
            </div>

            <QuestionRenderer
              questionId={current.id}
              answers={answers}
              onUpdate={updateAndMaybeAdvance}
              autoAdvance={!!current.autoAdvance}
              choices={current.choices}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer controls */}
      <footer className="mt-8 sm:mt-10 pt-6 border-t border-[var(--color-slate-accent)]/10">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className="
              px-5 py-2.5 rounded-full text-sm font-medium
              text-slate-400 hover:text-[var(--color-brand-200)]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Précédent
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={submit}
              disabled={!canProceed}
              className="
                inline-flex items-center gap-2
                px-6 sm:px-8 py-3 rounded-full text-sm font-medium
                bg-gradient-to-b from-[var(--color-gold-soft)] to-[var(--color-gold)]
                text-[#0a0a0a] font-semibold
                shadow-[0_15px_40px_-10px_rgba(201,162,39,0.55)]
                hover:shadow-[0_20px_50px_-10px_rgba(201,162,39,0.7)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all
              "
            >
              Voir mon analyse
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              className="
                inline-flex items-center gap-2
                px-6 py-2.5 rounded-full text-sm font-medium
                bg-white/[0.06] border border-[var(--color-slate-accent)]/15
                text-[var(--color-brand-100)]
                hover:bg-white/[0.12] hover:border-[var(--color-slate-accent)]/25
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all
              "
            >
              Suivant
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

interface RendererProps {
  questionId: string;
  answers: Answers;
  choices?: { value: string; label: string; hint?: string }[];
  autoAdvance: boolean;
  onUpdate: (partial: Partial<Answers>, autoAdvance: boolean, delayMs?: number) => void;
}

function QuestionRenderer({ questionId, answers, choices, autoAdvance, onUpdate }: RendererProps) {
  switch (questionId) {
    case "financingStatus":
      return (
        <ChoiceQuestion
          choices={choices!}
          value={answers.financingStatus}
          onChange={(v) => onUpdate({ financingStatus: v as Answers["financingStatus"] }, autoAdvance)}
        />
      );
    case "propertyType":
      return (
        <ChoiceQuestion
          choices={choices!}
          value={answers.propertyType}
          onChange={(v) => onUpdate({ propertyType: v as Answers["propertyType"] }, autoAdvance)}
        />
      );
    case "regions":
      return (
        <RegionMultiSearch
          value={answers.regions}
          onChange={(ids) => onUpdate({ regions: ids }, false)}
        />
      );
    case "purchaseTimeline":
      return (
        <ChoiceQuestion
          choices={choices!}
          value={answers.purchaseTimeline}
          onChange={(v) => onUpdate({ purchaseTimeline: v as Answers["purchaseTimeline"] }, autoAdvance)}
        />
      );
    case "journeyStage":
      return (
        <ChoiceQuestion
          choices={choices!}
          value={answers.journeyStage}
          onChange={(v) => onUpdate({ journeyStage: v as Answers["journeyStage"] }, autoAdvance)}
        />
      );
    case "buyingWith":
      return (
        <ChoiceQuestion
          choices={choices!}
          value={answers.buyingWith}
          onChange={(v) => onUpdate({ buyingWith: v as Answers["buyingWith"] }, autoAdvance)}
        />
      );
    case "householdIncome":
      return (
        <CurrencyQuestion
          value={answers.householdIncome}
          onChange={(v) => onUpdate({ householdIncome: v }, false)}
          placeholder="95 000"
          helper="Le total avant impôts de tous les revenus du ménage, par année."
        />
      );
    case "downPayment":
      return (
        <CurrencyQuestion
          value={answers.downPayment}
          onChange={(v) => onUpdate({ downPayment: v }, false)}
          placeholder="20 000"
          helper="Aucun jugement — même 0 $ est une réponse utile."
        />
      );
    case "employment":
      return (
        <ChoiceQuestion
          choices={choices!}
          value={answers.employment}
          onChange={(v) => onUpdate({ employment: v as Answers["employment"] }, autoAdvance)}
        />
      );
    default:
      return null;
  }
}
