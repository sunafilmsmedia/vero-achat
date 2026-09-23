import { NextResponse } from "next/server";
import { computeScoring } from "@/lib/scoring";
import { regionNames } from "@/lib/fallbackReport";
import { BRAND } from "@/lib/brand";
import type { Answers, LeadPayload, LeadType } from "@/lib/types";

export const runtime = "nodejs";

interface IncomingBody extends Partial<LeadPayload> {
  answers?: Answers;
  leadType?: LeadType;
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

// Segmentation jour/nuit selon l'heure du Québec (America/Montreal).
// Le fuseau IANA gère l'heure avancée automatiquement.
//   Jour : 8 h → 20 h   Nuit : 20 h → 8 h
function quebecSegment(): {
  periode: "jour" | "nuit";
  lead_type: "lead_jour" | "lead_nuit";
  heureQuebec: number;
} {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Montreal",
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(new Date());
  const heureQuebec = parseInt(hourStr, 10);
  const jour = heureQuebec >= 8 && heureQuebec < 20;
  return {
    periode: jour ? "jour" : "nuit",
    lead_type: jour ? "lead_jour" : "lead_nuit",
    heureQuebec,
  };
}

export async function POST(req: Request) {
  let body: IncomingBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, phone, email, consent, answers } = body;
  const leadType: LeadType = body.leadType ?? "acheteur";

  if (!name || !email || !consent || !answers) {
    return NextResponse.json(
      { stored: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const scoring = computeScoring(answers);
  const c = scoring.capacity;
  const { firstName, lastName } = splitName(name);
  const secteurs = regionNames(answers);
  const segment = quebecSegment();

  // Payload aplati pour mapping GHL direct + données brutes en complément.
  const payload = {
    source: BRAND.slug,
    receivedAt: new Date().toISOString(),

    leadType, // "acheteur"

    // Segmentation horaire (heure du Québec, DST géré)
    periode: segment.periode,
    lead_type: segment.lead_type,
    heureQuebec: segment.heureQuebec,

    // Contact
    firstName,
    lastName,
    fullName: name,
    phone: phone ?? "",
    email,

    // Scoring
    score: scoring.score,
    verdict: scoring.verdict, // pret | financement | mise_de_fonds | a_batir

    // Capacité d'achat (montants indicatifs, jamais une préapprobation)
    capaciteEstimee: c.maxByIncome,
    capaciteMin: c.capacityLow,
    capaciteMax: c.capacityHigh,
    sourceMiseDeFonds: c.downPaymentSource, // epargne | vente
    valeurProprieteActuelle: c.currentHomeValue,
    budgetRealiste: c.realisticBudget,
    plafondMiseDeFonds: c.maxByDownPayment,
    miseDeFondsVisee: c.requiredDownForCapacity,
    manqueMiseDeFonds: c.downPaymentGap,
    paiementMensuel: c.monthlyPayment,
    facteurLimitant: c.limitedBy,

    // Profil acheteur
    financingStatus: answers.financingStatus ?? "",
    propertyType: answers.propertyType ?? "",
    secteurs: secteurs.join(", "),
    secteursIds: answers.regions ?? [],
    purchaseTimeline: answers.purchaseTimeline ?? "",
    journeyStage: answers.journeyStage ?? "",
    buyingWith: answers.buyingWith ?? "",
    householdIncome: answers.householdIncome ?? 0,
    downPayment: answers.downPayment ?? 0,
    currentHomeValue: answers.currentHomeValue ?? 0,
    employment: answers.employment ?? "",

    // Données brutes
    lead: { name, phone, email },
    scoring: { score: scoring.score, verdict: scoring.verdict, capacity: c },
    answers,
  };

  const webhookUrl = process.env.CRM_WEBHOOK_URL;
  const webhookSecret = process.env.CRM_WEBHOOK_SECRET;

  if (webhookUrl) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (webhookSecret) headers["X-Webhook-Secret"] = webhookSecret;
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error("[lead] Webhook returned", res.status);
      }
    } catch (err) {
      console.error("[lead] Webhook failed", err);
    }
  } else {
    console.log("[lead] Stored (no webhook configured):", JSON.stringify(payload));
  }

  return NextResponse.json({ stored: true, verdict: scoring.verdict, leadType });
}
