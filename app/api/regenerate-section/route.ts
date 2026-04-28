import { NextResponse } from "next/server";
import { z } from "zod";

import { regenerateNarrativeSection } from "@/lib/openai";
import { buildReportComputation } from "@/lib/scoring";
import { reportInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

const requestSchema = z.object({
  section: z.enum([
    "executiveSummary",
    "marketPositionSummary",
    "recommendationsIntroduction",
    "servicePathwayIntroduction",
    "closingStatement",
    "strategicFindings"
  ]),
  input: reportInputSchema
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid regeneration payload.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const report = buildReportComputation(parsed.data.input);
  const value = await regenerateNarrativeSection(parsed.data.section, parsed.data.input, report);

  return NextResponse.json({
    section: parsed.data.section,
    value
  });
}
