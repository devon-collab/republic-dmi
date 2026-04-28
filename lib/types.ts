export type ToneSetting = "consultative" | "direct" | "conservative";
export type InputMode = "manual" | "upload";
export type EntityType = "prospect" | "competitor";
export type CoreWebVitalsStatus = "Poor" | "Needs Improvement" | "Good";
export type PaidMediaVisibility = "None" | "Low" | "Medium" | "High";
export type DataConfidenceLevel = "full" | "estimated" | "partial";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type RecommendationClassification = "Quick Win" | "Strategic Programme" | "Quick Win to Strategic Programme";
export type ServicePathwayKey =
  | "foundationFix"
  | "visibilityGrowth"
  | "trustAndConversionUpgrade"
  | "strategicMarketLeadership";
export type BenchmarkPositionLabel =
  | "Market Leader"
  | "Competitive"
  | "Behind Key Competitors"
  | "At Risk";
export type CategoryStatus = "Strong" | "Moderate" | "Weak" | "Critical";

export type PerformanceCategoryKey =
  | "websiteAuthority"
  | "seoHealth"
  | "organicVisibility"
  | "userEngagement"
  | "technicalPerformance"
  | "trustAndConversion"
  | "strategicDigitalMaturity";

export interface ProspectDetails {
  companyName: string;
  websiteUrl: string;
  industry: string;
  region?: string;
  contactName?: string;
  contactRole?: string;
  reportDate: string;
}

export interface CompetitorDetails {
  id: string;
  name: string;
  websiteUrl: string;
}

export interface PerformanceData {
  domainAuthority?: number | null;
  pageAuthority?: number | null;
  backlinks?: number | null;
  referringDomains?: number | null;
  criticalSeoHealth?: number | null;
  indexedPages?: number | null;
  metadataIssues?: number | null;
  brokenLinks?: number | null;
  organicMonthlyVisits?: number | null;
  topKeyword1?: string | null;
  topKeyword2?: string | null;
  topKeyword3?: string | null;
  bounceRate?: number | null;
  pagesPerVisit?: number | null;
  averageSessionDuration?: number | null;
  coreWebVitals?: CoreWebVitalsStatus | null;
  pageSpeedScore?: number | null;
  mobilePerformanceScore?: number | null;
  trustScore?: number | null;
  googleReviewsCount?: number | null;
  averageReviewRating?: number | null;
  socialMediaPresenceScore?: number | null;
  aiGeoVisibilityScore?: number | null;
  paidMediaVisibility?: PaidMediaVisibility | null;
}

export interface UploadMapping {
  [fieldKey: string]: string | null;
}

export interface UploadedDataset {
  fileName: string;
  detectedColumns: string[];
  rows: Record<string, string>[];
  mapping: UploadMapping;
  warnings: string[];
}

export interface ReportInput {
  prospect: ProspectDetails;
  competitors: CompetitorDetails[];
  prospectPerformance: PerformanceData;
  competitorPerformance: Record<string, PerformanceData>;
  tone: ToneSetting;
  inputMode: InputMode;
}

export interface ReportEntity {
  id: string;
  type: EntityType;
  name: string;
  url: string;
  performance: PerformanceData;
}

export interface CategoryScore {
  key: PerformanceCategoryKey;
  label: string;
  weight: number;
  score: number;
  max: number;
  unscored: number;
  completeness: number;
  status: CategoryStatus;
  triggers: string[];
}

export interface MetricBenchmark {
  key: keyof PerformanceData;
  label: string;
  prospectValue: number | string | null;
  competitorAverage: number | string | null;
  bestCompetitor: number | string | null;
  worstCompetitor: number | string | null;
  rank: number | null;
  totalEntities: number;
  gapAmount: number | null;
  gapPercentage: number | null;
  riskLevel: RiskLevel;
  benchmarkPositionLabel: BenchmarkPositionLabel;
}

export interface TriggeredRecommendation {
  id: string;
  title: string;
  rationale: string;
  classification: RecommendationClassification;
  riskOfInaction: string;
  timeline: string;
  categoryKey: PerformanceCategoryKey;
  impactScore: number;
  sortOrder: number;
}

export interface ServicePathway {
  key: ServicePathwayKey;
  name: string;
  introduction: string;
  services: string[];
}

export interface DataConfidenceSummary {
  percent: number;
  level: DataConfidenceLevel;
  populated: number;
  total: number;
  missingFields: string[];
  overrideRecommended: boolean;
}

export interface StrategicFinding {
  id: string;
  title: string;
  body: string;
  metricLabel: string;
  metricValue: string;
  riskLevel: RiskLevel;
}

export interface GeneratedNarrativeSections {
  executiveSummary: string;
  marketPositionSummary: string;
  recommendationsIntroduction: string;
  servicePathwayIntroduction: string;
  closingStatement: string;
  strategicFindings: StrategicFinding[];
}

export interface NarrativeHistory<T> {
  current: T;
  previous: T[];
}

export interface OutreachEmailDraft {
  subjectOptions: string[];
  body: string;
  signerName: string;
}

export interface IndustryBenchmarkPreset {
  industry: string;
  defaults: Partial<PerformanceData>;
  description: string;
}

export interface ReportComputation {
  entities: ReportEntity[];
  prospect: ReportEntity;
  competitors: ReportEntity[];
  categoryScores: CategoryScore[];
  totalScore: number;
  scoreBand: {
    label: string;
    description: string;
  };
  confidence: DataConfidenceSummary;
  metricBenchmarks: MetricBenchmark[];
  recommendations: TriggeredRecommendation[];
  primaryPathway: ServicePathway | null;
  secondaryPathway: ServicePathway | null;
  benchmarkRankLabel: BenchmarkPositionLabel;
  radarSeries: {
    name: string;
    values: Array<{ label: string; value: number }>;
  }[];
}

export interface ReportBuildResult extends ReportComputation {
  industryBenchmark: IndustryBenchmarkPreset | null;
}
