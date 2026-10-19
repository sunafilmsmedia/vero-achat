"use client";

interface Props {
  value?: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  placeholder?: string;
  helper?: string;
}

export default function TextQuestion({
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  helper,
}: Props) {
  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8">
      <input
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        autoComplete={autoComplete}
        autoFocus
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full font-serif text-2xl sm:text-3xl text-[var(--color-brand-100)] bg-transparent
          placeholder:text-slate-400/50 focus:outline-none w-full
        "
      />
      {helper && <p className="text-xs text-slate-500 mt-3">{helper}</p>}
    </div>
  );
}
