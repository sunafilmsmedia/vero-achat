"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";
import Hero from "@/components/Hero";
import TopLogos from "@/components/TopLogos";
import QualificationForm from "@/components/QualificationForm";
import LoadingScreen from "@/components/LoadingScreen";
import PreRevealScreen from "@/components/PreRevealScreen";
import LongTermScreen from "@/components/LongTermScreen";
import ResultsScreen from "@/components/results/ResultsScreen";
import { trackStep } from "@/lib/track";
import type { AnalyzeResponse, Answers } from "@/lib/types";

const HeroBackground = dynamic(() => import("@/components/HeroBackground"), { ssr: false });

type Stage = "hero" | "form" | "loading" | "preReveal" | "results" | "longTerm";

const MIN_LOADING_MS = 2000;

export default function Home() {
  const [stage, setStage] = useState<Stage>("hero");
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [analyze, setAnalyze] = useState<AnalyzeResponse | null>(null);
  const [revealChoice, setRevealChoice] = useState<"yes" | "no">("no");

  const handleFormComplete = async (finalAnswers: Answers) => {
    trackStep("analyse");
    setAnswers(finalAnswers);
    setStage("loading");
    if (typeof window !== "undefined") window.scrollTo(0, 0);

    const startedAt = performance.now();
    let result: AnalyzeResponse | null = null;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      if (res.ok) {
        result = (await res.json()) as AnalyzeResponse;
      }
    } catch {
      // result reste null
    }

    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
    setTimeout(() => {
      if (result) {
        setAnalyze(result);
        trackStep("pre_reveal");
        setStage("preReveal");
        if (typeof window !== "undefined") window.scrollTo(0, 0);
      } else {
        setStage("form");
      }
    }, remaining);
  };

  const revealResults = (choice: "yes" | "no") => {
    trackStep("resultats", choice === "yes" ? "avec_contact" : "sans_contact");
    setRevealChoice(choice);
    setStage("results");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  // Achat à plus de 12 mois : on remet la vidéo de préparation, sans analyse
  // ni capture de lead.
  const handleLongTerm = (partialAnswers: Answers) => {
    trackStep("long_terme");
    setAnswers(partialAnswers);
    setStage("longTerm");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const restart = () => {
    setAnswers(null);
    setAnalyze(null);
    setRevealChoice("no");
    setStage("hero");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const showChrome =
    stage === "hero" || stage === "preReveal" || stage === "results" || stage === "longTerm";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <AnimatePresence>
        {stage === "hero" && (
          <motion.div
            key="bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-0"
          >
            <HeroBackground />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {stage === "hero" && (
          <motion.div key="hero" className="relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            <Hero onStart={() => { trackStep("debut"); setStage("form"); }} />
          </motion.div>
        )}
        {stage === "form" && (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            <QualificationForm
              onComplete={handleFormComplete}
              onLongTerm={handleLongTerm}
              onExit={() => setStage("hero")}
            />
          </motion.div>
        )}
        {stage === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <LoadingScreen />
          </motion.div>
        )}
        {stage === "preReveal" && analyze && (
          <motion.div key="preReveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <PreRevealScreen onContinue={revealResults} />
          </motion.div>
        )}
        {stage === "results" && analyze && answers && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <ResultsScreen
              analyze={analyze}
              answers={answers}
              revealChoice={revealChoice}
              onRestart={restart}
            />
          </motion.div>
        )}
        {stage === "longTerm" && (
          <motion.div key="longTerm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <LongTermScreen onRestart={restart} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logos — visibles sur le hero, les résultats et la vidéo */}
      <AnimatePresence>
        {showChrome && (
          <motion.div
            key="brand-chrome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <TopLogos />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
