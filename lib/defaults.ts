import type { GeneratedNarrativeSections, PerformanceData, ReportInput, StrategicFinding } from "@/lib/types";

export const FIXED_COMPETITOR_IDS = ["competitor-1", "competitor-2", "competitor-3"] as const;

export const EMPTY_PERFORMANCE_DATA: PerformanceData = {};

export function createEmptyPerformanceData(): PerformanceData {
  return { ...EMPTY_PERFORMANCE_DATA };
}

export function createDefaultReportInput(): ReportInput {
  return {
    prospect: {
      companyName: "",
      websiteUrl: "",
      industry: "Professional Services",
      region: "",
      contactName: "",
      contactRole: "",
      reportDate: new Date().toISOString().slice(0, 10)
    },
    competitors: [
      { id: FIXED_COMPETITOR_IDS[0], name: "", websiteUrl: "" },
      { id: FIXED_COMPETITOR_IDS[1], name: "", websiteUrl: "" },
      { id: FIXED_COMPETITOR_IDS[2], name: "", websiteUrl: "" }
    ],
    prospectPerformance: createEmptyPerformanceData(),
    competitorPerformance: {
      [FIXED_COMPETITOR_IDS[0]]: createEmptyPerformanceData(),
      [FIXED_COMPETITOR_IDS[1]]: createEmptyPerformanceData(),
      [FIXED_COMPETITOR_IDS[2]]: createEmptyPerformanceData()
    },
    tone: "consultative",
    inputMode: "manual"
  };
}

export function createFallbackNarratives(
  findings: StrategicFinding[]
): GeneratedNarrativeSections {
  return {
    executiveSummary: "",
    marketPositionSummary: "",
    recommendationsIntroduction: "",
    servicePathwayIntroduction: "",
    closingStatement: "",
    strategicFindings: findings
  };
}
