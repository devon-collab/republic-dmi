import { FALLBACK_SECTION_COPY, PROHIBITED_WORDS, SECTION_PROMPTS } from "@/lib/config";
import { buildStrategicFindings } from "@/lib/scoring";
import type {
  GeneratedNarrativeSections,
  OutreachEmailDraft,
  ReportBuildResult,
  ReportInput,
  StrategicFinding,
  ToneSetting
} from "@/lib/types";

type NarrativeSectionKey = keyof typeof SECTION_PROMPTS;

function buildToneInstruction(tone: ToneSetting) {
  if (tone === "direct") {
    return "Use a direct, commercially urgent tone without sounding alarmist.";
  }
  if (tone === "conservative") {
    return "Use an analytical, understated and data-forward tone.";
  }
  return "Use an evidence-led, measured and advisory tone.";
}

function stripMarkdownFences(value: string) {
  return value.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

async function callOpenAi(prompt: string, maxTokens: number) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.5,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write premium B2B consultancy diagnostic copy in UK English. Never use the prohibited words list. Always return strict JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${body}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI returned an empty response.");
  }

  return JSON.parse(stripMarkdownFences(content));
}

function buildContext(input: ReportInput, report: ReportBuildResult) {
  return {
    prospect: input.prospect,
    tone: input.tone,
    totalScore: report.totalScore,
    scoreBand: report.scoreBand,
    confidence: report.confidence,
    categoryScores: report.categoryScores.map((category) => ({
      key: category.key,
      label: category.label,
      score: category.score,
      max: category.max,
      completeness: category.completeness,
      status: category.status,
      triggers: category.triggers
    })),
    benchmarkPositionLabel: report.benchmarkRankLabel,
    metricBenchmarks: report.metricBenchmarks.slice(0, 12),
    recommendations: report.recommendations.map((recommendation) => ({
      title: recommendation.title,
      rationale: recommendation.rationale,
      classification: recommendation.classification,
      timeline: recommendation.timeline
    })),
    primaryPathway: report.primaryPathway,
    secondaryPathway: report.secondaryPathway,
    topStrategicFindings: buildStrategicFindings(report.prospect, report.metricBenchmarks).slice(0, 5),
    industryBenchmark: report.industryBenchmark
  };
}

function fallbackNarratives(report: ReportBuildResult): GeneratedNarrativeSections {
  return {
    executiveSummary: FALLBACK_SECTION_COPY.executiveSummary,
    marketPositionSummary: FALLBACK_SECTION_COPY.marketPositionSummary,
    recommendationsIntroduction: FALLBACK_SECTION_COPY.recommendationsIntroduction,
    servicePathwayIntroduction: FALLBACK_SECTION_COPY.servicePathwayIntroduction,
    closingStatement: FALLBACK_SECTION_COPY.closingStatement,
    strategicFindings: buildStrategicFindings(report.prospect, report.metricBenchmarks)
  };
}

export async function generateNarratives(
  input: ReportInput,
  report: ReportBuildResult
): Promise<GeneratedNarrativeSections> {
  const context = buildContext(input, report);
  const prompt = [
    "Write JSON with keys: executiveSummary, marketPositionSummary, recommendationsIntroduction, servicePathwayIntroduction, closingStatement, strategicFindings.",
    'The strategicFindings value must be an array of 3 to 5 objects with keys: id, title, body, metricLabel, metricValue, riskLevel.',
    buildToneInstruction(input.tone),
    `Avoid these words entirely: ${PROHIBITED_WORDS.join(", ")}.`,
    "Use specific data points from the context rather than generic observations.",
    "Context:",
    JSON.stringify(context, null, 2),
    "Section instructions:",
    JSON.stringify(SECTION_PROMPTS, null, 2)
  ].join("\n\n");

  try {
    const result = await callOpenAi(prompt, 1400);
    const findings = Array.isArray(result.strategicFindings)
      ? result.strategicFindings.map(
          (finding: Partial<StrategicFinding>, index: number): StrategicFinding => ({
            id: finding.id || `finding-${index + 1}`,
            title: finding.title || `Finding ${index + 1}`,
            body: finding.body || "Add insight manually.",
            metricLabel: finding.metricLabel || "Key Metric",
            metricValue: finding.metricValue || "Unscored",
            riskLevel:
              finding.riskLevel === "Low" ||
              finding.riskLevel === "Medium" ||
              finding.riskLevel === "High" ||
              finding.riskLevel === "Critical"
                ? finding.riskLevel
                : "Medium"
          })
        )
      : buildStrategicFindings(report.prospect, report.metricBenchmarks);

    return {
      executiveSummary:
        typeof result.executiveSummary === "string"
          ? result.executiveSummary
          : FALLBACK_SECTION_COPY.executiveSummary,
      marketPositionSummary:
        typeof result.marketPositionSummary === "string"
          ? result.marketPositionSummary
          : FALLBACK_SECTION_COPY.marketPositionSummary,
      recommendationsIntroduction:
        typeof result.recommendationsIntroduction === "string"
          ? result.recommendationsIntroduction
          : FALLBACK_SECTION_COPY.recommendationsIntroduction,
      servicePathwayIntroduction:
        typeof result.servicePathwayIntroduction === "string"
          ? result.servicePathwayIntroduction
          : FALLBACK_SECTION_COPY.servicePathwayIntroduction,
      closingStatement:
        typeof result.closingStatement === "string"
          ? result.closingStatement
          : FALLBACK_SECTION_COPY.closingStatement,
      strategicFindings: findings
    };
  } catch {
    return fallbackNarratives(report);
  }
}

export async function regenerateNarrativeSection(
  section: NarrativeSectionKey | "strategicFindings",
  input: ReportInput,
  report: ReportBuildResult
): Promise<string | StrategicFinding[]> {
  const context = buildContext(input, report);
  const prompt =
    section === "strategicFindings"
      ? [
          "Return JSON with one key: strategicFindings.",
          'The strategicFindings value must be an array of 3 to 5 objects with keys: id, title, body, metricLabel, metricValue, riskLevel.',
          buildToneInstruction(input.tone),
          `Avoid these words entirely: ${PROHIBITED_WORDS.join(", ")}.`,
          "Context:",
          JSON.stringify(context, null, 2),
          "Instruction:",
          SECTION_PROMPTS.strategicFindings
        ].join("\n\n")
      : [
          `Return JSON with one key: ${section}.`,
          buildToneInstruction(input.tone),
          `Avoid these words entirely: ${PROHIBITED_WORDS.join(", ")}.`,
          "Context:",
          JSON.stringify(context, null, 2),
          "Instruction:",
          SECTION_PROMPTS[section]
        ].join("\n\n");

  try {
    const result = await callOpenAi(prompt, section === "strategicFindings" ? 900 : 400);

    if (section === "strategicFindings") {
      if (!Array.isArray(result.strategicFindings)) {
        return buildStrategicFindings(report.prospect, report.metricBenchmarks);
      }

      return result.strategicFindings.map(
        (finding: Partial<StrategicFinding>, index: number): StrategicFinding => ({
          id: finding.id || `finding-${index + 1}`,
          title: finding.title || `Finding ${index + 1}`,
          body: finding.body || "Add insight manually.",
          metricLabel: finding.metricLabel || "Key Metric",
          metricValue: finding.metricValue || "Unscored",
          riskLevel:
            finding.riskLevel === "Low" ||
            finding.riskLevel === "Medium" ||
            finding.riskLevel === "High" ||
            finding.riskLevel === "Critical"
              ? finding.riskLevel
              : "Medium"
        })
      );
    }

    return typeof result[section] === "string"
      ? result[section]
      : FALLBACK_SECTION_COPY[section];
  } catch {
    return section === "strategicFindings"
      ? buildStrategicFindings(report.prospect, report.metricBenchmarks)
      : FALLBACK_SECTION_COPY[section];
  }
}

export async function generateOutreachEmail(
  input: ReportInput,
  report: ReportBuildResult,
  findings: StrategicFinding[],
  signerName: string
): Promise<OutreachEmailDraft> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const topFinding = findings[0]?.title || "digital visibility gap";
    return {
      subjectOptions: [
        `${input.prospect.companyName}: a digital maturity gap worth addressing`,
        `${input.prospect.companyName}: a quick benchmark against competitors`,
        `${input.prospect.companyName}: where the digital pipeline is being lost`
      ],
      body: `Hi,\n\nI have prepared a short Republic Digital Maturity Index snapshot for ${input.prospect.companyName}. The clearest issue is ${topFinding.toLowerCase()}, which is affecting discoverability and shortlist confidence.\n\nThe current score sits at ${report.totalScore}/100, with the most urgent priority being ${report.recommendations[0]?.title ?? "foundation repair"}.\n\nIf useful, I would be happy to walk you through the findings and outline the shortest route to improvement.\n\nKind regards,\n${signerName || "Republic Digital Consultancy"}`,
      signerName
    };
  }

  try {
    const prompt = [
      "Return JSON with keys: subjectOptions and body.",
      "subjectOptions must be an array of exactly three subject lines.",
      "body must be a cold outreach email with four short paragraphs and a sign-off using the provided signer name.",
      buildToneInstruction(input.tone),
      `Avoid these words entirely: ${PROHIBITED_WORDS.join(", ")}.`,
      "Context:",
      JSON.stringify(
        {
          companyName: input.prospect.companyName,
          overallScore: report.totalScore,
          scoreBand: report.scoreBand.label,
          topFindings: findings.slice(0, 3),
          primaryRecommendation: report.recommendations[0],
          signerName
        },
        null,
        2
      )
    ].join("\n\n");

    const result = await callOpenAi(prompt, 700);

    return {
      subjectOptions: Array.isArray(result.subjectOptions)
        ? result.subjectOptions.slice(0, 3)
        : [`${input.prospect.companyName}: digital growth opportunity`],
      body: typeof result.body === "string" ? result.body : "",
      signerName
    };
  } catch {
    return {
      subjectOptions: [
        `${input.prospect.companyName}: digital growth opportunity`,
        `${input.prospect.companyName}: competitor benchmark snapshot`,
        `${input.prospect.companyName}: where search demand is being lost`
      ],
      body: `Hi,\n\nI have prepared a short digital maturity snapshot for ${input.prospect.companyName}. It highlights several benchmark gaps that appear to be limiting discoverability and conversion confidence.\n\nThe strongest immediate opportunity is ${report.recommendations[0]?.title ?? "improving the digital foundation"}, supported by a current overall score of ${report.totalScore}/100.\n\nIf it would be useful, I can talk you through the implications and the most practical next steps.\n\nKind regards,\n${signerName || "Republic Digital Consultancy"}`,
      signerName
    };
  }
}
