import { NextResponse } from "next/server";
import { z } from "zod";

import { generateOutreachEmail } from "@/lib/openai";
import { buildStrategicFindings, buildReportComputation } from "@/lib/scoring";
import { reportInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

const requestSchema = z.object({
  input: reportInputSchema,
  signerName: z.string().optional(),
  findings: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        body: z.string(),
        metricLabel: z.string(),
        metricValue: z.string(),
        riskLevel: z.enum(["Low", "Medium", "High", "Critical"])
      })
    )
    .optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid outreach email payload.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const report = buildReportComputation(parsed.data.input);
  const findings =
    parsed.data.findings && parsed.data.findings.length
      ? parsed.data.findings
      : buildStrategicFindings(report.prospect, report.metricBenchmarks);
  const draft = await generateOutreachEmail(
    parsed.data.input,
    report,
    findings,
    parsed.data.signerName ?? ""
  );

  return NextResponse.json(draft);
}
