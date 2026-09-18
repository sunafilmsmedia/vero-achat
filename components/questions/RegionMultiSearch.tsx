"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MAX_SECTEURS } from "@/lib/config";
import { REGIONS } from "@/lib/regions";

interface Props {
  value?: string[];
  onChange: (ids: string[]) => void;
}

// Normalise pour une recherche insensible aux accents et à la casse.
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const displayName = (id: string) =>
  REGIONS.find((r) => r.id === id)?.name ?? id;

export default function RegionMultiSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const selected = value ?? [];
  const full = selected.length >= MAX_SECTEURS;

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
      return;
    }
    if (full) return;
    onChange([...selected, id]);
    setQuery("");
  };

  const q = query.trim();
  const nq = norm(q);
  const matches = nq ? REGIONS.filter((r) => norm(r.name).includes(nq)) : REGIONS;

  // La personne peut toujours ajouter exactement ce qu'elle a écrit, même si
  // le secteur n'est pas dans la liste. On ne dit jamais « pas trouvé ».
  const exact =
    REGIONS.some((r) => norm(r.name) === nq) || selected.some((s) => norm(displayName(s)) === nq);
  const showCustom = q.length >= 2 && !exact && !full;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (matches.length === 1) toggle(matches[0].id);
    else if (q.length >= 2) toggle(q);
  };

  return (
    <div className="space-y-3">
      {/* Secteurs choisis */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((id) => (
            <motion.button
              key={id}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => toggle(id)}
              className="
                inline-flex items-center gap-2
                rounded-full pl-4 pr-3 py-2 text-sm font-semibold
                bg-gradient-to-br from-[var(--color-gold-soft)] to-[var(--color-gold)]
                text-[#0a0a0a]
                shadow-[0_10px_26px_-12px_rgba(201,162,39,0.55)]
              "
            >
              {displayName(id)}
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/20" aria-hidden>
                <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3L9 9M9 3L3 9" strokeLinecap="round" />
                </svg>
              </span>
              <span className="sr-only">Retirer {displayName(id)}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Champ de recherche / saisie libre */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="M14 14L17 17" strokeLinecap="round" />
        </svg>
        <input
          autoFocus
          type="text"
          value={query}
          disabled={full}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            full
              ? `${MAX_SECTEURS} secteurs choisis — retire-en un pour changer`
              : "Écris un secteur (ex. Gatineau, Aylmer…)"
          }
          className="
            w-full glass-card rounded-xl pl-11 pr-4 py-3.5
            text-[var(--color-brand-100)] placeholder:text-slate-400/70
            text-base disabled:opacity-60
            focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)]/35
          "
        />
      </div>

      <p className="text-[11px] text-slate-500">
        {selected.length} / {MAX_SECTEURS} secteur{selected.length > 1 ? "s" : ""} choisi
        {selected.length > 1 ? "s" : ""}
      </p>

      {/* Liste : secteurs correspondants + option « utiliser ce que j'ai écrit » */}
      {!full && (
        <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
          {matches
            .filter((r) => !selected.includes(r.id))
            .map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(r.id)}
                className="
                  w-full text-left glass-card rounded-xl px-4 py-3
                  flex items-center justify-between gap-3
                  hover:bg-white/[0.09] hover:border-[var(--color-slate-accent)]/20
                  transition-colors group
                "
              >
                <span className="font-medium text-[var(--color-brand-100)]">{r.name}</span>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-[var(--color-brand-300)] transition-colors shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 4v12M4 10h12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}

          {showCustom && (
            <button
              type="button"
              onClick={() => toggle(q)}
              className="
                w-full text-left rounded-xl px-4 py-3
                flex items-center gap-3
                bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-400)]/25
                hover:bg-[var(--color-brand-500)]/16
                transition-colors
              "
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-brand-500)] shrink-0">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10 4v12M4 10h12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-[var(--color-brand-100)] truncate">
                  Ajouter «&nbsp;{q}&nbsp;»
                </span>
                <span className="block text-[11px] text-slate-500">Ton secteur</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
