import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { computeScoring } from "@/lib/scoring";
import { buildFallbackReport, regionNames } from "@/lib/fallbackReport";
import type { AnalyzeResponse, Answers, Report } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Tu es un expert en immobilier résidentiel québécois (Outaouais, secteur de Gatineau) qui rédige un rapport personnalisé, honnête et encourageant pour une personne qui veut ACHETER une propriété.

Ton ton : chaleureux, professionnel, en français (vouvoiement), jamais alarmiste, jamais commercial.

Tu reçois les réponses du formulaire, un calcul de capacité d'achat déterministe et un score (0-100). Tu dois produire un rapport JSON STRICTEMENT au format demandé. Ne dévie pas du schéma.

Règles absolues :
- N'INVENTE JAMAIS de chiffres. Utilise UNIQUEMENT les montants fournis dans "scoring.capacity" (maxByIncome, maxByDownPayment, realisticBudget, requiredDownForCapacity, downPaymentGap, monthlyPayment).
- Ne présente jamais ces montants comme une préapprobation : ce sont des estimations à valider avec un prêteur.
- Si le verdict est "mise_de_fonds", le message central est : la capacité est là, c'est la mise de fonds qui bride — et elle se bâtit (RAP, CELIAPP, remise en argent, don familial).
- Si "financement", pousse la préqualification comme prochaine étape unique.
- Si "pret", confirme et oriente vers la recherche active de propriétés.
- Si "a_batir", sois bienveillant : explique ce qui doit bouger (revenu retenu, mise de fonds) sans culpabiliser.
- "steps" : exactement 4 étapes courtes et actionnables.
- "stats" : exactement 4 entrées, dans cet ordre : capacité soutenue, budget réaliste, paiement mensuel estimé, mise de fonds visée.
- "marketInsight" : une observation utile sur le marché de l'Outaouais pour un acheteur, sans chiffre inventé.
- Pas de markdown, pas d'emojis, pas de formules creuses.`;

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // fallthrough
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
  return null;
}

function isValidReport(r: unknown): r is Report {
  if (!r || typeof r !== "object") return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.headline === "string" &&
    typeof x.summary === "string" &&
    Array.isArray(x.stats) &&
    x.stats.length >= 3 &&
    Array.isArray(x.steps) &&
    x.steps.length >= 3 &&
    typeof x.marketInsight === "string"
  );
}

export async function POST(req: Request) {
  let body: { answers?: Answers };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const answers = body.answers ?? {};
  const scoring = computeScoring(answers);
  const fallback = buildFallbackReport(answers, scoring);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const payload: AnalyzeResponse = { scoring, report: fallback, generatedBy: "fallback" };
    return NextResponse.json(payload);
  }

  try {
    const client = new Anthropic({ apiKey });
    const userMessage = {
      answers: { ...answers, secteurs: regionNames(answers) },
      scoring,
      fallbackHints: {
        headline: fallback.headline,
        summary: fallback.summary,
        marketInsight: fallback.marketInsight,
      },
      requiredSchema: {
        headline: "phrase d'accroche, 1 ligne",
        summary: "résumé, 2-3 phrases",
        stats: [
          { label: "Ce que votre situation pourrait supporter", value: "X $", detail: "..." },
          { label: "Budget réaliste aujourd'hui", value: "X $", detail: "..." },
          { label: "Paiement mensuel estimé", value: "X $ / mois", detail: "..." },
          { label: "Mise de fonds visée", value: "X $", detail: "..." },
        ],
        steps: [{ title: "...", description: "..." }],
        marketInsight: "observation de marché pertinente pour un acheteur dans l'Outaouais",
      },
    };

    const completion = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Voici les données. Réponds uniquement avec un objet JSON valide qui respecte le schéma.\n\n${JSON.stringify(
            userMessage,
            null,
            2
          )}`,
        },
      ],
    });

    const textBlock = completion.content.find((c) => c.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
    const parsed = extractJson(text);

    if (isValidReport(parsed)) {
      const payload: AnalyzeResponse = { scoring, report: parsed, generatedBy: "claude" };
      return NextResponse.json(payload);
    }
  } catch (err) {
    console.error("[analyze] Claude error", err);
  }

  const payload: AnalyzeResponse = { scoring, report: fallback, generatedBy: "fallback" };
  return NextResponse.json(payload);
}
