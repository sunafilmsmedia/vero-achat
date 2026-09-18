"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  VIDEO_AUTO_REDIRECT,
  VIDEO_AUTO_REDIRECT_MS,
  VIDEO_LONG_TERME_URL,
} from "@/lib/config";

interface Props {
  onRestart: () => void;
}

// Écran terminal pour les projets à PLUS DE 12 MOIS.
// Ces personnes ne passent pas par l'analyse et ne sont pas capturées comme
// lead : on leur remet la vidéo de préparation et on les laisse revenir.
export default function LongTermScreen({ onRestart }: Props) {
  const hasVideo = VIDEO_LONG_TERME_URL.trim().length > 0;
  const [secondsLeft, setSecondsLeft] = useState(
    Math.round(VIDEO_AUTO_REDIRECT_MS / 1000)
  );

  useEffect(() => {
    if (!hasVideo || !VIDEO_AUTO_REDIRECT) return;
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    const jump = setTimeout(() => {
      window.location.href = VIDEO_LONG_TERME_URL;
    }, VIDEO_AUTO_REDIRECT_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(jump);
    };
  }, [hasVideo]);

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl text-center"
      >
        {/* Icône lecture */}
        <div className="mx-auto mb-7 w-14 h-14 rounded-full bg-[var(--color-gold)]/12 border border-[var(--color-gold)]/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-[var(--color-brand-300)]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="10" cy="10" r="7.5" />
            <path d="M8.5 7L13 10L8.5 13Z" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-brand-300)] mb-3">
          Projet à préparer
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl text-[var(--color-brand-100)] leading-[1.1] tracking-tight text-balance">
          Plus de 12 mois ? C&apos;est le meilleur moment pour bâtir votre dossier.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed text-balance max-w-md mx-auto">
          À cette distance, une analyse de budget vieillirait mal — les taux et le
          marché auront bougé. On vous a préparé une vidéo qui explique exactement
          quoi faire d&apos;ici là : mise de fonds, CELIAPP, crédit et dossier de
          financement.
        </p>

        {hasVideo ? (
          <>
            <a
              href={VIDEO_LONG_TERME_URL}
              className="
                mt-10 inline-flex items-center gap-2
                px-8 py-4 rounded-full text-base
                bg-gradient-to-b from-[var(--color-gold-soft)] to-[var(--color-gold)]
                text-[#0a0a0a] font-semibold no-underline
                shadow-[0_20px_50px_-15px_rgba(201,162,39,0.6)]
                hover:shadow-[0_25px_60px_-10px_rgba(201,162,39,0.7)]
                hover:-translate-y-0.5
                transition-all duration-300
              "
            >
              Regarder la vidéo
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            {VIDEO_AUTO_REDIRECT && (
              <p className="mt-4 text-xs text-slate-500">
                Redirection automatique dans {secondsLeft} s…
              </p>
            )}
          </>
        ) : (
          <p className="mt-10 text-sm text-slate-500 italic">
            La vidéo sera disponible ici sous peu.
          </p>
        )}

        <div className="mt-8">
          <button
            onClick={onRestart}
            className="text-xs text-slate-500 hover:text-[var(--color-brand-200)] transition-colors underline underline-offset-4 decoration-white/25"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </motion.div>
    </div>
  );
}
