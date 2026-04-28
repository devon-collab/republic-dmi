import { NextResponse } from "next/server";
import { z } from "zod";

import { generateNarratives } from "@/lib/openai";
import { buildReportComputation } from "@/lib/scoring";
import { reportInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

const requestSchema = z.object({
  input: reportInputSchema
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid report payload.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const report = buildReportComputation(parsed.data.input);
  const narratives = await generateNarratives(parsed.data.input, report);

  return NextResponse.json({
    input: parsed.data.input,
    report,
    narratives
  });
}
