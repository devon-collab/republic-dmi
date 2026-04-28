import {
  CATEGORY_WEIGHTS,
  INDUSTRY_BENCHMARKS,
  PERFORMANCE_CATEGORY_LABELS,
  PERFORMANCE_FIELDS,
  RECOMMENDATION_LIBRARY,
  SCORE_BANDS,
  SERVICE_PATHWAYS
} from "@/lib/config";
import type {
  BenchmarkPositionLabel,
  CategoryScore,
  DataConfidenceSummary,
  MetricBenchmark,
  PerformanceCategoryKey,
  PerformanceData,
  ReportBuildResult,
  ReportEntity,
  ReportInput,
  RiskLevel,
  ServicePathway,
  StrategicFinding,
  TriggeredRecommendation
} from "@/lib/types";

type CategoryComputation = {
  baseScore: number;
  score: number;
  max: number;
  unscored: number;
  completeness: number;
  triggers: string[];
};

const CATEGORY_REQUIRED_FIELDS: Record<PerformanceCategoryKey, Array<keyof PerformanceData>> = {
  websiteAuthority: ["domainAuthority", "backlinks", "referringDomains"],
  seoHealth: ["criticalSeoHealth", "indexedPages", "metadataIssues", "brokenLinks"],
  organicVisibility: ["organicMonthlyVisits", "topKeyword1", "topKeyword2", "topKeyword3"],
  userEngagement: ["bounceRate", "pagesPerVisit", "averageSessionDuration"],
  technicalPerformance: ["coreWebVitals", "pageSpeedScore", "mobilePerformanceScore"],
  trustAndConversion: ["trustScore", "googleReviewsCount", "averageReviewRating"],
  strategicDigitalMaturity: ["socialMediaPresenceScore", "aiGeoVisibilityScore", "paidMediaVisibility"]
};

const DISPLAY_METRICS: Array<keyof PerformanceData> = [
  "domainAuthority",
  "pageAuthority",
  "backlinks",
  "referringDomains",
  "criticalSeoHealth",
  "indexedPages",
  "metadataIssues",
  "brokenLinks",
  "organicMonthlyVisits",
  "bounceRate",
  "pagesPerVisit",
  "averageSessionDuration",
  "pageSpeedScore",
  "mobilePerformanceScore",
  "trustScore",
  "googleReviewsCount",
  "averageReviewRating",
  "socialMediaPresenceScore",
  "aiGeoVisibilityScore"
];

const DISPLAY_LABELS = PERFORMANCE_FIELDS.reduce<Record<string, string>>((accumulator, field) => {
  accumulator[field.key] = field.label;
  return accumulator;
}, {});

const NUMERIC_UNITS: Partial<Record<keyof PerformanceData, string>> = {
  domainAuthority: "",
  pageAuthority: "",
  backlinks: "",
  referringDomains: "",
  criticalSeoHealth: "",
  indexedPages: "",
  metadataIssues: "",
  brokenLinks: "",
  organicMonthlyVisits: "",
  bounceRate: "%",
  pagesPerVisit: "",
  averageSessionDuration: "s",
  pageSpeedScore: "",
  mobilePerformanceScore: "",
  trustScore: "",
  googleReviewsCount: "",
  averageReviewRating: ""
};

export function buildReportComputation(input: ReportInput): ReportBuildResult {
  const entities = buildEntities(input);
  const prospect = entities[0];
  const competitors = entities.slice(1);
  const confidence = computeDataConfidence(entities);

  const categoryScores = buildCategoryScores(prospect, competitors);
  const totalScore = round(categoryScores.reduce((sum, score) => sum + score.score, 0));
  const scoreBand =
    SCORE_BANDS.find((band) => totalScore >= band.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
  const metricBenchmarks = buildMetricBenchmarks(entities);
  const recommendations = buildRecommendations(prospect, competitors, categoryScores, metricBenchmarks);
  const { primaryPathway, secondaryPathway } = selectServicePathways(categoryScores);
  const benchmarkRankLabel = resolveBenchmarkPositionLabel(
    rankProspect(metricBenchmarks),
    entities.length
  );
  const industryBenchmark =
    INDUSTRY_BENCHMARKS.find((preset) => preset.industry === input.prospect.industry) ?? null;
  const industryEntity = industryBenchmark
    ? ({
        id: "industry-benchmark",
        type: "competitor",
        name: `${industryBenchmark.industry} Benchmark`,
        url: "",
        performance: industryBenchmark.defaults
      } satisfies ReportEntity)
    : null;

  const radarSeries = [
    {
      name: prospect.name,
      values: categoryScores.map((category) => ({
        label: category.label,
        value: round((category.score / category.max) * 100)
      }))
    },
    {
      name: "Competitor Average",
      values: buildCompetitorAverageCategoryScores(competitors).map((score) => ({
        label: score.label,
        value: round((score.score / score.max) * 100)
      }))
    }
  ];

  if (industryEntity) {
    radarSeries.push({
      name: industryEntity.name,
      values: buildCategoryScores(industryEntity, []).map((category) => ({
        label: category.label,
        value: round((category.score / category.max) * 100)
      }))
    });
  }

  return {
    entities,
    prospect,
    competitors,
    categoryScores,
    totalScore,
    scoreBand,
    confidence,
    metricBenchmarks,
    recommendations,
    primaryPathway,
    secondaryPathway,
    benchmarkRankLabel,
    radarSeries,
    industryBenchmark
  };
}

export function buildEntities(input: ReportInput): ReportEntity[] {
  const prospectEntity: ReportEntity = {
    id: "prospect",
    type: "prospect",
    name: input.prospect.companyName,
    url: input.prospect.websiteUrl,
    performance: input.prospectPerformance
  };

  const competitorEntities = input.competitors.map((competitor) => ({
    id: competitor.id,
    type: "competitor" as const,
    name: competitor.name,
    url: competitor.websiteUrl,
    performance: input.competitorPerformance[competitor.id] ?? {}
  }));

  return [prospectEntity, ...competitorEntities];
}

export function buildStrategicFindings(
  prospect: ReportEntity,
  metricBenchmarks: MetricBenchmark[]
): StrategicFinding[] {
  const largestGaps = metricBenchmarks
    .filter((benchmark) => benchmark.gapPercentage != null)
    .sort((left, right) => (right.gapPercentage ?? 0) - (left.gapPercentage ?? 0))
    .slice(0, 5);

  return largestGaps.map((benchmark, index) => ({
    id: `finding-${index + 1}`,
    title: benchmark.label,
    body: `${prospect.name} is currently trailing the competitor benchmark in ${benchmark.label.toLowerCase()}, which materially affects its ability to earn attention and convert interest during early research.`,
    metricLabel: benchmark.label,
    metricValue: benchmark.prospectValue == null ? "Unscored" : String(benchmark.prospectValue),
    riskLevel: benchmark.riskLevel
  }));
}

function buildCategoryScores(prospect: ReportEntity, competitors: ReportEntity[]): CategoryScore[] {
  const authority = scoreWebsiteAuthority(prospect, competitors);
  const seoHealth = scoreSeoHealth(prospect);
  const organicVisibility = scoreOrganicVisibility(prospect, competitors);
  const userEngagement = scoreUserEngagement(prospect);
  const technicalPerformance = scoreTechnicalPerformance(prospect);
  const trustAndConversion = scoreTrustAndConversion(prospect);
  const strategicDigitalMaturity = scoreStrategicDigitalMaturity(prospect);

  const map: Record<PerformanceCategoryKey, CategoryComputation> = {
    websiteAuthority: authority,
    seoHealth,
    organicVisibility,
    userEngagement,
    technicalPerformance,
    trustAndConversion,
    strategicDigitalMaturity
  };

  return (Object.keys(map) as PerformanceCategoryKey[]).map((key) => {
    const computation = map[key];
    return {
      key,
      label: PERFORMANCE_CATEGORY_LABELS[key],
      weight: CATEGORY_WEIGHTS[key],
      score: round(computation.score),
      max: CATEGORY_WEIGHTS[key],
      unscored: round(computation.unscored),
      completeness: round(computation.completeness * 100),
      status: resolveCategoryStatus(computation.score, CATEGORY_WEIGHTS[key]),
      triggers: computation.triggers
    };
  });
}

function buildCompetitorAverageCategoryScores(competitors: ReportEntity[]): CategoryScore[] {
  if (!competitors.length) {
    return (Object.keys(CATEGORY_WEIGHTS) as PerformanceCategoryKey[]).map((key) => ({
      key,
      label: PERFORMANCE_CATEGORY_LABELS[key],
      weight: CATEGORY_WEIGHTS[key],
      score: 0,
      max: CATEGORY_WEIGHTS[key],
      unscored: 0,
      completeness: 0,
      status: "Critical",
      triggers: []
    }));
  }

  const perCompetitorScores = competitors.map((competitor) => buildCategoryScores(competitor, []));

  return (Object.keys(CATEGORY_WEIGHTS) as PerformanceCategoryKey[]).map((key) => {
    const scores = perCompetitorScores.map((categories) =>
      categories.find((category) => category.key === key)
    );
    const scoreAverage = average(scores.map((score) => score?.score ?? 0));
    return {
      key,
      label: PERFORMANCE_CATEGORY_LABELS[key],
      weight: CATEGORY_WEIGHTS[key],
      score: round(scoreAverage),
      max: CATEGORY_WEIGHTS[key],
      unscored: 0,
      completeness: 100,
      status: resolveCategoryStatus(scoreAverage, CATEGORY_WEIGHTS[key]),
      triggers: []
    };
  });
}

function scoreWebsiteAuthority(
  prospect: ReportEntity,
  competitors: ReportEntity[]
): CategoryComputation {
  const max = CATEGORY_WEIGHTS.websiteAuthority;
  const present = presentCount(prospect.performance, CATEGORY_REQUIRED_FIELDS.websiteAuthority);
  const completeness = present / CATEGORY_REQUIRED_FIELDS.websiteAuthority.length;
  const effectiveMax = max * completeness;
  const da = valueOfNumber(prospect.performance.domainAuthority);
  let base = interpolateBand(da, [
    { min: 0, max: 10, score: 2, next: 5 },
    { min: 11, max: 20, score: 5, next: 8 },
    { min: 21, max: 30, score: 8, next: 11 },
    { min: 31, max: 45, score: 11, next: 15 },
    { min: 46, max: 100, score: 15, next: 15 }
  ]);

  const triggers: string[] = [];
  const competitorDas = competitors
    .map((competitor) => valueOfNumber(competitor.performance.domainAuthority))
    .filter((value): value is number => value != null);

  if (competitorDas.length && da != null) {
    const averageDa = average(competitorDas);
    if (competitorDas.every((value) => da < value)) {
      triggers.push("Authority Gap — Critical");
    } else if (averageDa > 0 && da < averageDa * 0.8) {
      triggers.push("Authority Gap");
    } else if (competitorDas.filter((value) => da > value).length >= 2) {
      triggers.push("Authority Advantage");
    }
  }

  const competitorBacklinks = average(
    competitors.map((competitor) => valueOfNumber(competitor.performance.backlinks))
  );
  const competitorReferringDomains = average(
    competitors.map((competitor) => valueOfNumber(competitor.performance.referringDomains))
  );
  const backlinks = valueOfNumber(prospect.performance.backlinks);
  const referringDomains = valueOfNumber(prospect.performance.referringDomains);

  if (backlinks != null && competitors.length) {
    const lowerThanAllCompetitors = competitors.every((competitor) => {
      const competitorBacklinkCount = valueOfNumber(competitor.performance.backlinks);
      return competitorBacklinkCount == null || backlinks < competitorBacklinkCount;
    });

    if (lowerThanAllCompetitors) {
      base -= 2;
    }
  }

  if (
    referringDomains != null &&
    competitorReferringDomains > 0 &&
    referringDomains < competitorReferringDomains * 0.6
  ) {
    base -= 1;
  }

  const score = clamp(round(Math.max(1, Math.min(base, effectiveMax))), 1, Math.max(1, effectiveMax));

  return {
    baseScore: round(base),
    score,
    max,
    unscored: round(max - effectiveMax),
    completeness,
    triggers
  };
}

function scoreSeoHealth(prospect: ReportEntity): CategoryComputation {
  const max = CATEGORY_WEIGHTS.seoHealth;
  const completeness = presentCount(prospect.performance, CATEGORY_REQUIRED_FIELDS.seoHealth) /
    CATEGORY_REQUIRED_FIELDS.seoHealth.length;
  const effectiveMax = max * completeness;
  const health = valueOfNumber(prospect.performance.criticalSeoHealth);
  let base = interpolateBand(health, [
    { min: 0, max: 49, score: 3, next: 7 },
    { min: 50, max: 64, score: 7, next: 11 },
    { min: 65, max: 74, score: 11, next: 15 },
    { min: 75, max: 84, score: 15, next: 20 },
    { min: 85, max: 100, score: 20, next: 20 }
  ]);

  const metadataIssues = valueOfNumber(prospect.performance.metadataIssues);
  const brokenLinks = valueOfNumber(prospect.performance.brokenLinks);
  const indexedPages = valueOfNumber(prospect.performance.indexedPages);
  const triggers: string[] = [];

  if (metadataIssues != null && metadataIssues > 20) base -= 2;
  if (brokenLinks != null && brokenLinks > 10) base -= 2;
  if (indexedPages != null && indexedPages < 10) base -= 1;

  if ((health ?? 0) < 65) {
    triggers.push("Technical SEO Remediation");
  } else if ((health ?? 0) < 80) {
    triggers.push("SEO Foundation Improvement");
  } else {
    triggers.push("Ongoing Optimisation");
  }

  return {
    baseScore: round(base),
    score: clamp(Math.max(1, Math.min(base, effectiveMax)), 1, Math.max(1, effectiveMax)),
    max,
    unscored: round(max - effectiveMax),
    completeness,
    triggers
  };
}

function scoreOrganicVisibility(
  prospect: ReportEntity,
  competitors: ReportEntity[]
): CategoryComputation {
  const max = CATEGORY_WEIGHTS.organicVisibility;
  const completeness = presentCount(prospect.performance, CATEGORY_REQUIRED_FIELDS.organicVisibility) /
    CATEGORY_REQUIRED_FIELDS.organicVisibility.length;
  const effectiveMax = max * completeness;
  const visits = valueOfNumber(prospect.performance.organicMonthlyVisits);
  let base = interpolateBand(visits, [
    { min: 0, max: 100, score: 2, next: 5 },
    { min: 101, max: 500, score: 5, next: 8 },
    { min: 501, max: 2000, score: 8, next: 12 },
    { min: 2001, max: 10000, score: 12, next: 15 },
    { min: 10001, max: 999999999, score: 15, next: 15 }
  ]);
  const triggers: string[] = [];
  const competitorAverageTraffic = average(
    competitors.map((competitor) => valueOfNumber(competitor.performance.organicMonthlyVisits))
  );

  if (visits != null && competitorAverageTraffic > 0 && visits < competitorAverageTraffic * 0.5) {
    triggers.push("Visibility Deficit");
  }

  const bounceRate = valueOfNumber(prospect.performance.bounceRate);

  if (visits != null && competitorAverageTraffic > 0 && visits > competitorAverageTraffic && (bounceRate ?? 0) > 65) {
    triggers.push("Traffic Quality Issue");
  }

  if (isNonBrandedKeywordDominant(prospect)) {
    base -= 2;
    triggers.push("Non-Branded Keyword Gap");
  }

  return {
    baseScore: round(base),
    score: clamp(Math.max(1, Math.min(base, effectiveMax)), 1, Math.max(1, effectiveMax)),
    max,
    unscored: round(max - effectiveMax),
    completeness,
    triggers
  };
}

function scoreUserEngagement(prospect: ReportEntity): CategoryComputation {
  const max = CATEGORY_WEIGHTS.userEngagement;
  const completeness = presentCount(prospect.performance, CATEGORY_REQUIRED_FIELDS.userEngagement) /
    CATEGORY_REQUIRED_FIELDS.userEngagement.length;
  const effectiveMax = max * completeness;
  const bounceRate = valueOfNumber(prospect.performance.bounceRate);
  const pagesPerVisit = valueOfNumber(prospect.performance.pagesPerVisit);
  const sessionDuration = valueOfNumber(prospect.performance.averageSessionDuration);
  let base = 0;

  if ((bounceRate ?? 101) > 75 && (pagesPerVisit ?? 0) < 1.5) {
    base = 3;
  } else if ((bounceRate ?? 101) >= 65) {
    base = 6;
  } else if ((bounceRate ?? 101) >= 50) {
    base = 10;
  } else if ((bounceRate ?? 101) >= 35) {
    base = 13;
  } else if ((bounceRate ?? 101) < 35 && (pagesPerVisit ?? 0) > 3) {
    base = 15;
  } else {
    base = 10;
  }

  if (sessionDuration != null && sessionDuration < 60) {
    base -= 2;
  } else if (sessionDuration != null && sessionDuration > 180) {
    base += 1;
  }

  return {
    baseScore: round(base),
    score: clamp(Math.max(1, Math.min(base, effectiveMax)), 1, Math.max(1, effectiveMax)),
    max,
    unscored: round(max - effectiveMax),
    completeness,
    triggers: []
  };
}

function scoreTechnicalPerformance(prospect: ReportEntity): CategoryComputation {
  const max = CATEGORY_WEIGHTS.technicalPerformance;
  const completeness =
    presentCount(prospect.performance, CATEGORY_REQUIRED_FIELDS.technicalPerformance) /
    CATEGORY_REQUIRED_FIELDS.technicalPerformance.length;
  const effectiveMax = max * completeness;
  const coreWebVitals = prospect.performance.coreWebVitals;
  const pageSpeed = valueOfNumber(prospect.performance.pageSpeedScore);
  const mobilePerformance = valueOfNumber(prospect.performance.mobilePerformanceScore);
  let base = coreWebVitals === "Good" ? 15 : coreWebVitals === "Needs Improvement" ? 8 : 3;

  if (pageSpeed != null) {
    if (pageSpeed < 50) base -= 3;
    else if (pageSpeed < 70) base -= 1;
  }

  if (mobilePerformance != null) {
    if (mobilePerformance < 50) base -= 2;
    else if (mobilePerformance < 70) base -= 1;
  }

  return {
    baseScore: round(base),
    score: clamp(Math.max(1, Math.min(base, effectiveMax)), 1, Math.max(1, effectiveMax)),
    max,
    unscored: round(max - effectiveMax),
    completeness,
    triggers: []
  };
}

function scoreTrustAndConversion(prospect: ReportEntity): CategoryComputation {
  const max = CATEGORY_WEIGHTS.trustAndConversion;
  const completeness =
    presentCount(prospect.performance, CATEGORY_REQUIRED_FIELDS.trustAndConversion) /
    CATEGORY_REQUIRED_FIELDS.trustAndConversion.length;
  const effectiveMax = max * completeness;
  const trustScore = valueOfNumber(prospect.performance.trustScore);
  const reviewsCount = valueOfNumber(prospect.performance.googleReviewsCount);
  const reviewRating = valueOfNumber(prospect.performance.averageReviewRating);
  let base = interpolateBand(trustScore, [
    { min: 0, max: 39, score: 2, next: 5 },
    { min: 40, max: 59, score: 5, next: 7 },
    { min: 60, max: 74, score: 7, next: 10 },
    { min: 75, max: 100, score: 10, next: 10 }
  ]);

  if ((reviewsCount ?? 0) > 20 && (reviewRating ?? 0) > 4.0) base += 1;
  if ((reviewsCount ?? 0) < 5 || (reviewRating ?? 5) < 3.5) base -= 1;

  return {
    baseScore: round(base),
    score: clamp(Math.max(1, Math.min(base, effectiveMax)), 1, Math.max(1, effectiveMax)),
    max,
    unscored: round(max - effectiveMax),
    completeness,
    triggers: []
  };
}

function scoreStrategicDigitalMaturity(prospect: ReportEntity): CategoryComputation {
  const max = CATEGORY_WEIGHTS.strategicDigitalMaturity;
  const completeness =
    presentCount(prospect.performance, CATEGORY_REQUIRED_FIELDS.strategicDigitalMaturity) /
    CATEGORY_REQUIRED_FIELDS.strategicDigitalMaturity.length;
  const effectiveMax = max * completeness;
  const socialScore = valueOfNumber(prospect.performance.socialMediaPresenceScore);
  const aiScore = valueOfNumber(prospect.performance.aiGeoVisibilityScore);
  const averageStrategicScore = average([socialScore, aiScore]);
  const paidMediaVisibility = prospect.performance.paidMediaVisibility;
  let base = interpolateBand(averageStrategicScore, [
    { min: 0, max: 29, score: 2, next: 5 },
    { min: 30, max: 49, score: 5, next: 7 },
    { min: 50, max: 69, score: 7, next: 10 },
    { min: 70, max: 100, score: 10, next: 10 }
  ]);

  if (paidMediaVisibility === "Medium" || paidMediaVisibility === "High") {
    base += 1;
  }

  return {
    baseScore: round(base),
    score: clamp(Math.max(1, Math.min(base, effectiveMax)), 1, Math.max(1, effectiveMax)),
    max,
    unscored: round(max - effectiveMax),
    completeness,
    triggers: []
  };
}

function buildMetricBenchmarks(entities: ReportEntity[]): MetricBenchmark[] {
  const prospect = entities[0];
  const competitors = entities.slice(1);

  return DISPLAY_METRICS.map((metricKey) => {
    const metricLabel = DISPLAY_LABELS[metricKey] ?? String(metricKey);
    const prospectValue = prospect.performance[metricKey] ?? null;
    const competitorValues = competitors
      .map((competitor) => competitor.performance[metricKey])
      .filter((value): value is number => typeof value === "number");
    const averageValue = competitorValues.length ? average(competitorValues) : null;
    const bestValue = competitorValues.length ? Math.max(...competitorValues) : null;
    const worstValue = competitorValues.length ? Math.min(...competitorValues) : null;
    const rank = computeRank(entities, metricKey, metricValueOrdering(metricKey));
    const gapAmount =
      typeof prospectValue === "number" && averageValue != null ? averageValue - prospectValue : null;
    const gapPercentage =
      gapAmount != null && averageValue && averageValue !== 0
        ? Math.abs((gapAmount / averageValue) * 100)
        : null;
    const riskLevel = resolveRiskLevel(gapPercentage);
    const benchmarkPositionLabel = resolveBenchmarkPositionLabel(rank, entities.length);

    return {
      key: metricKey,
      label: metricLabel,
      prospectValue: formatMetricValue(metricKey, prospectValue),
      competitorAverage: formatMetricValue(metricKey, averageValue),
      bestCompetitor: formatMetricValue(metricKey, bestValue),
      worstCompetitor: formatMetricValue(metricKey, worstValue),
      rank,
      totalEntities: entities.length,
      gapAmount: gapAmount != null ? round(gapAmount) : null,
      gapPercentage: gapPercentage != null ? round(gapPercentage) : null,
      riskLevel,
      benchmarkPositionLabel
    };
  });
}

function buildRecommendations(
  prospect: ReportEntity,
  competitors: ReportEntity[],
  categoryScores: CategoryScore[],
  metricBenchmarks: MetricBenchmark[]
): TriggeredRecommendation[] {
  const categoryByKey = categoryScores.reduce<Record<PerformanceCategoryKey, CategoryScore>>(
    (accumulator, category) => {
      accumulator[category.key] = category;
      return accumulator;
    },
    {} as Record<PerformanceCategoryKey, CategoryScore>
  );

  const competitorAverageTraffic = average(
    competitors.map((competitor) => valueOfNumber(competitor.performance.organicMonthlyVisits))
  );
  const competitorAverageAuthority = average(
    competitors.map((competitor) => valueOfNumber(competitor.performance.domainAuthority))
  );
  const prospectTraffic = valueOfNumber(prospect.performance.organicMonthlyVisits) ?? 0;
  const prospectAuthority = valueOfNumber(prospect.performance.domainAuthority) ?? 0;
  const bounceRate = valueOfNumber(prospect.performance.bounceRate) ?? 0;
  const pagesPerVisit = valueOfNumber(prospect.performance.pagesPerVisit) ?? 0;
  const seoHealth = valueOfNumber(prospect.performance.criticalSeoHealth) ?? 0;
  const aiScore = valueOfNumber(prospect.performance.aiGeoVisibilityScore) ?? 0;
  const coreWebVitals = prospect.performance.coreWebVitals ?? "Poor";

  const triggeredIds: string[] = [];

  if (competitorAverageAuthority > 0 && prospectAuthority < competitorAverageAuthority * 0.8) {
    triggeredIds.push("authority-gap");
  }
  if (seoHealth < 75) {
    triggeredIds.push("technical-seo-foundation");
  }
  if (competitorAverageTraffic > 0 && prospectTraffic < competitorAverageTraffic) {
    triggeredIds.push("visibility-gap");
  }
  if (bounceRate > 65) {
    triggeredIds.push("conversion-leak");
  }
  if (pagesPerVisit > 0 && pagesPerVisit < 2) {
    triggeredIds.push("content-journey");
  }
  if (coreWebVitals === "Poor" || coreWebVitals === "Needs Improvement") {
    triggeredIds.push("performance");
  }
  if ((valueOfNumber(prospect.performance.trustScore) ?? 0) < 70) {
    triggeredIds.push("credibility-gap");
  }
  if (aiScore < 50) {
    triggeredIds.push("ai-discovery");
  }
  if (isNonBrandedKeywordDominant(prospect)) {
    triggeredIds.push("non-branded-keyword-gap");
  }

  return RECOMMENDATION_LIBRARY.filter((item) => triggeredIds.includes(item.id))
    .map((item, index) => {
      const category = categoryByKey[item.categoryKey];
      const gapPercentage = category.max
        ? ((category.max - category.score - category.unscored) / category.max) * 100
        : 0;
      return {
        ...item,
        impactScore: round((category.weight * Math.max(gapPercentage, 0)) / 100),
        sortOrder: index
      };
    })
    .sort((left, right) => {
      if (right.impactScore === left.impactScore) {
        return left.sortOrder - right.sortOrder;
      }
      return right.impactScore - left.impactScore;
    })
    .slice(0, 5);
}

function selectServicePathways(categoryScores: CategoryScore[]): {
  primaryPathway: ServicePathway | null;
  secondaryPathway: ServicePathway | null;
} {
  const scoreByKey = categoryScores.reduce<Record<PerformanceCategoryKey, number>>(
    (accumulator, category) => {
      accumulator[category.key] = category.score;
      return accumulator;
    },
    {} as Record<PerformanceCategoryKey, number>
  );

  const maxByKey = categoryScores.reduce<Record<PerformanceCategoryKey, number>>(
    (accumulator, category) => {
      accumulator[category.key] = category.max;
      return accumulator;
    },
    {} as Record<PerformanceCategoryKey, number>
  );

  const triggers: Array<{ key: keyof typeof SERVICE_PATHWAYS; gap: number }> = [];
  const foundationGap =
    Math.max(0, 0.5 * maxByKey.seoHealth - scoreByKey.seoHealth) +
    Math.max(0, 0.5 * maxByKey.technicalPerformance - scoreByKey.technicalPerformance);
  if (
    scoreByKey.seoHealth < maxByKey.seoHealth * 0.5 ||
    scoreByKey.technicalPerformance < maxByKey.technicalPerformance * 0.5
  ) {
    triggers.push({ key: "foundationFix", gap: round(foundationGap) });
  }

  const visibilityGap =
    Math.max(0, 0.5 * maxByKey.organicVisibility - scoreByKey.organicVisibility) +
    Math.max(0, 0.6 * maxByKey.websiteAuthority - scoreByKey.websiteAuthority);
  if (
    scoreByKey.organicVisibility < maxByKey.organicVisibility * 0.5 &&
    scoreByKey.websiteAuthority < maxByKey.websiteAuthority * 0.6
  ) {
    triggers.push({ key: "visibilityGrowth", gap: round(visibilityGap) });
  }

  const trustGap =
    Math.max(0, 0.6 * maxByKey.trustAndConversion - scoreByKey.trustAndConversion) +
    Math.max(0, 0.5 * maxByKey.userEngagement - scoreByKey.userEngagement);
  if (
    scoreByKey.trustAndConversion < maxByKey.trustAndConversion * 0.6 ||
    scoreByKey.userEngagement < maxByKey.userEngagement * 0.5
  ) {
    triggers.push({ key: "trustAndConversionUpgrade", gap: round(trustGap) });
  }

  const strategicGap = Math.max(
    0,
    0.5 * maxByKey.strategicDigitalMaturity - scoreByKey.strategicDigitalMaturity
  );
  const totalScore = categoryScores.reduce((sum, category) => sum + category.score, 0);
  if (
    scoreByKey.strategicDigitalMaturity < maxByKey.strategicDigitalMaturity * 0.5 &&
    totalScore > 45
  ) {
    triggers.push({ key: "strategicMarketLeadership", gap: round(strategicGap) });
  }

  const ordered = triggers.sort((left, right) => right.gap - left.gap);
  const primary = ordered[0] ? SERVICE_PATHWAYS[ordered[0].key] : null;
  const secondaryCandidate = ordered[1] ? SERVICE_PATHWAYS[ordered[1].key] : null;

  if (!primary) {
    return { primaryPathway: null, secondaryPathway: null };
  }

  if (ordered[0]?.key === "foundationFix" && secondaryCandidate?.name === SERVICE_PATHWAYS.strategicMarketLeadership.name) {
    return {
      primaryPathway: pathwayFromConfig("foundationFix"),
      secondaryPathway: null
    };
  }

  return {
    primaryPathway: pathwayFromConfig(ordered[0].key),
    secondaryPathway: ordered[1] ? pathwayFromConfig(ordered[1].key) : null
  };
}

function pathwayFromConfig(key: keyof typeof SERVICE_PATHWAYS): ServicePathway {
  const config = SERVICE_PATHWAYS[key];
  return {
    key,
    name: config.name,
    introduction: config.description,
    services: config.services
  };
}

function computeDataConfidence(entities: ReportEntity[]): DataConfidenceSummary {
  const relevantFields = PERFORMANCE_FIELDS.map((field) => field.key);
  const missingFields: string[] = [];
  let populated = 0;

  entities.forEach((entity) => {
    relevantFields.forEach((fieldKey) => {
      const value = entity.performance[fieldKey];
      const isPresent = typeof value === "number"
        ? Number.isFinite(value)
        : typeof value === "string"
          ? value.trim().length > 0
          : value != null;

      if (isPresent) {
        populated += 1;
      } else {
        missingFields.push(`${entity.name} — ${DISPLAY_LABELS[fieldKey]}`);
      }
    });
  });

  const total = entities.length * relevantFields.length;
  const percent = total === 0 ? 0 : round((populated / total) * 100);
  const level =
    percent >= 90 ? "full" : percent >= 60 ? "estimated" : "partial";

  return {
    percent,
    level,
    populated,
    total,
    missingFields,
    overrideRecommended: percent < 40
  };
}

function computeRank(
  entities: ReportEntity[],
  metricKey: keyof PerformanceData,
  order: "asc" | "desc"
): number | null {
  const values = entities
    .map((entity) => ({
      id: entity.id,
      value: entity.performance[metricKey]
    }))
    .filter((item): item is { id: string; value: number } => typeof item.value === "number");

  const sorted = values.sort((left, right) =>
    order === "desc" ? right.value - left.value : left.value - right.value
  );

  const prospectIndex = sorted.findIndex((item) => item.id === "prospect");
  return prospectIndex === -1 ? null : prospectIndex + 1;
}

function metricValueOrdering(metricKey: keyof PerformanceData): "asc" | "desc" {
  return metricKey === "bounceRate" || metricKey === "metadataIssues" || metricKey === "brokenLinks"
    ? "asc"
    : "desc";
}

function resolveRiskLevel(gapPercentage: number | null): RiskLevel {
  if (gapPercentage == null) return "Low";
  if (gapPercentage > 50) return "Critical";
  if (gapPercentage > 30) return "High";
  if (gapPercentage >= 10) return "Medium";
  return "Low";
}

function resolveBenchmarkPositionLabel(rank: number | null, totalEntities: number): BenchmarkPositionLabel {
  if (rank == null) return "Competitive";
  if (rank === 1) return "Market Leader";
  if (rank === 2) return "Competitive";
  if (rank === totalEntities) return "At Risk";
  return "Behind Key Competitors";
}

function rankProspect(metricBenchmarks: MetricBenchmark[]): number | null {
  const validRanks = metricBenchmarks.map((benchmark) => benchmark.rank).filter((rank): rank is number => rank != null);
  if (!validRanks.length) return null;
  return round(average(validRanks));
}

function resolveCategoryStatus(score: number, max: number): CategoryScore["status"] {
  const percent = max > 0 ? (score / max) * 100 : 0;
  if (percent >= 80) return "Strong";
  if (percent >= 60) return "Moderate";
  if (percent >= 40) return "Weak";
  return "Critical";
}

function interpolateBand(
  value: number | null,
  bands: Array<{ min: number; max: number; score: number; next: number }>
): number {
  if (value == null) return 0;
  const band = bands.find((candidate) => value >= candidate.min && value <= candidate.max);
  if (!band) return 0;
  if (band.min === band.max || band.score === band.next) return band.score;
  const progress = (value - band.min) / Math.max(1, band.max - band.min);
  return band.score + progress * (band.next - band.score);
}

function isNonBrandedKeywordDominant(prospect: ReportEntity): boolean {
  const companyName = prospect.name.toLowerCase();
  const keywords = [
    prospect.performance.topKeyword1,
    prospect.performance.topKeyword2,
    prospect.performance.topKeyword3
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (!keywords.length) return false;
  return keywords.every((keyword) => keyword.toLowerCase().includes(companyName));
}

function presentCount(object: PerformanceData, fields: Array<keyof PerformanceData>): number {
  return fields.filter((field) => {
    const value = object[field];
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "string") return value.trim().length > 0;
    return value != null;
  }).length;
}

function valueOfNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function average(values: Array<number | null | undefined>): number {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function formatMetricValue(metricKey: keyof PerformanceData, value: number | string | null): number | string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  const suffix = NUMERIC_UNITS[metricKey] ?? "";
  if (metricKey === "averageReviewRating") return `${round(value, 1)}/5`;
  if (metricKey === "bounceRate") return `${round(value)}%`;
  if (metricKey === "averageSessionDuration") return `${round(value)}s`;
  return `${round(value)}${suffix}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
