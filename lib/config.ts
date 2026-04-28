import type {
  CoreWebVitalsStatus,
  IndustryBenchmarkPreset,
  PaidMediaVisibility,
  PerformanceCategoryKey,
  PerformanceData,
  RecommendationClassification,
  ServicePathwayKey,
  ToneSetting
} from "@/lib/types";

export const PRODUCT_NAME = "Republic Digital Maturity Index";
export const PRODUCT_SHORT_NAME = "Republic DMI";
export const REPORT_VERSION = "Republic Digital Maturity Index v1 — Republic Digital Consultancy";

export const INDUSTRIES = [
  "Financial Services",
  "Legal",
  "Property and Real Estate",
  "Professional Services",
  "Healthcare",
  "Technology and SaaS",
  "Retail and E-commerce",
  "Hospitality and Tourism",
  "Education",
  "Construction and Engineering",
  "Manufacturing",
  "Other"
] as const;

export const CORE_WEB_VITALS_OPTIONS: CoreWebVitalsStatus[] = ["Poor", "Needs Improvement", "Good"];
export const PAID_MEDIA_OPTIONS: PaidMediaVisibility[] = ["None", "Low", "Medium", "High"];
export const TONE_OPTIONS: Array<{ value: ToneSetting; label: string; description: string }> = [
  {
    value: "consultative",
    label: "Consultative",
    description: "Evidence-led, measured and advisory. Best for default use."
  },
  {
    value: "direct",
    label: "Direct",
    description: "Commercially urgent and clear. Best for short-attention cold outreach."
  },
  {
    value: "conservative",
    label: "Conservative",
    description: "Analytical and understated. Best for highly data-driven audiences."
  }
];

export const PERFORMANCE_CATEGORY_LABELS: Record<PerformanceCategoryKey, string> = {
  websiteAuthority: "Website Authority",
  seoHealth: "SEO Health",
  organicVisibility: "Organic Visibility",
  userEngagement: "User Engagement",
  technicalPerformance: "Technical Performance",
  trustAndConversion: "Trust and Conversion",
  strategicDigitalMaturity: "Strategic Digital Maturity"
};

export const CATEGORY_WEIGHTS: Record<PerformanceCategoryKey, number> = {
  websiteAuthority: 15,
  seoHealth: 20,
  organicVisibility: 15,
  userEngagement: 15,
  technicalPerformance: 15,
  trustAndConversion: 10,
  strategicDigitalMaturity: 10
};

export const SCORE_BANDS = [
  {
    min: 85,
    label: "Market Leading",
    description: "High authority, strong visibility and a strong conversion foundation."
  },
  {
    min: 70,
    label: "Competitive",
    description: "A strong digital presence with room for refinement and sharper execution."
  },
  {
    min: 50,
    label: "Developing",
    description: "A solid foundation is visible, but material gaps are still limiting growth."
  },
  {
    min: 30,
    label: "Underdeveloped",
    description: "Some presence exists, but it is not yet commercially optimised."
  },
  {
    min: 0,
    label: "Digitally Vulnerable",
    description: "Weak visibility, fragile technical health and limited authority."
  }
] as const;

export const PROHIBITED_WORDS = [
  "leverage",
  "unlock",
  "game-changer",
  "revolutionary",
  "world-class"
];

export const SECTION_PROMPTS = {
  executiveSummary:
    "Write a 3–4 sentence strategic overview of the prospect's current digital position. Reference the overall maturity score, the score band, the biggest gap identified, and one specific competitor comparison. Do not open with the company name. Do not use a question as an opening line. Do not describe what the report contains.",
  marketPositionSummary:
    "Describe where the prospect sits relative to its competitive set. Reference rank, benchmark position label, and the two largest metric gaps. Frame commercially — what does this mean for pipeline, not for a website score.",
  strategicFindings:
    "Return 3 to 5 findings. Each finding must name the specific gap, explain the commercial consequence, avoid generic digital marketing language, and read like it is written for a board-level audience.",
  recommendationsIntroduction:
    "Write a short framing paragraph before the recommendations list that explains why these priorities were selected and what the intended outcome is. This is not a list of services. It is a strategic rationale.",
  servicePathwayIntroduction:
    "Write a short introduction to the recommended service pathway that connects the diagnostic findings to the proposed engagement. Frame it as a logical next step, not a sales pitch.",
  closingStatement:
    "Write a closing paragraph that summarises the opportunity, reinforces urgency without alarmism, and ends with a calm, confident call to action. Do not use the phrase 'don't hesitate to contact us.'"
} as const;

export const FALLBACK_SECTION_COPY = {
  executiveSummary:
    "The available data suggests a meaningful digital performance gap relative to the competitive set, with the strongest risks concentrated in visibility, authority and technical readiness. This snapshot should be reviewed manually before external use because the AI summary could not be generated.",
  marketPositionSummary:
    "Relative to the current benchmark set, the prospect is not yet capturing the same level of digital visibility or competitive authority. The metric table on the following pages highlights where shortlisting risk is most likely to materialise.",
  recommendationsIntroduction:
    "These priorities were selected because they represent the clearest commercial constraints visible in the current dataset. They are intended to focus attention on the few changes most likely to improve discoverability, trust and conversion readiness.",
  servicePathwayIntroduction:
    "The recommended pathway reflects the most commercially material weaknesses identified in this diagnostic. It is intended as the most logical first engagement if the prospect wants to close the benchmark gap with discipline.",
  closingStatement:
    "The opportunity is clear: the prospect already has the ingredients for stronger digital performance, but the current system is not converting them into competitive visibility consistently enough. A focused discovery conversation would clarify the fastest route to improvement."
};

export const PERFORMANCE_FIELD_GROUPS = [
  {
    key: "websiteAuthority" as const,
    label: "Website Authority",
    description: "Signals of domain credibility and ranking strength.",
    fields: ["domainAuthority", "pageAuthority", "backlinks", "referringDomains"] as const
  },
  {
    key: "seoHealth" as const,
    label: "SEO Health",
    description: "Structural crawl and optimisation signals that affect rankings.",
    fields: ["criticalSeoHealth", "indexedPages", "metadataIssues", "brokenLinks"] as const
  },
  {
    key: "organicVisibility" as const,
    label: "Organic Visibility",
    description: "How visible the site is in search and which terms it wins on.",
    fields: ["organicMonthlyVisits", "topKeyword1", "topKeyword2", "topKeyword3"] as const
  },
  {
    key: "userEngagement" as const,
    label: "User Engagement",
    description: "How well the current traffic behaves once it lands on site.",
    fields: ["bounceRate", "pagesPerVisit", "averageSessionDuration"] as const
  },
  {
    key: "technicalPerformance" as const,
    label: "Technical Performance",
    description: "User experience signals tied to speed and device performance.",
    fields: ["coreWebVitals", "pageSpeedScore", "mobilePerformanceScore"] as const
  },
  {
    key: "trustAndConversion" as const,
    label: "Trust and Conversion",
    description: "Signals that influence shortlist confidence and conversion readiness.",
    fields: ["trustScore", "googleReviewsCount", "averageReviewRating"] as const
  },
  {
    key: "strategicDigitalMaturity" as const,
    label: "Strategic Digital Maturity",
    description: "Signals of broader strategic visibility and future-readiness.",
    fields: ["socialMediaPresenceScore", "aiGeoVisibilityScore", "paidMediaVisibility"] as const
  }
];

type FieldType = "number" | "text" | "dropdown";

export interface PerformanceFieldDefinition {
  key: keyof PerformanceData;
  label: string;
  type: FieldType;
  unit: string;
  min?: number;
  max?: number;
  category: PerformanceCategoryKey;
  tooltip: string;
}

export const PERFORMANCE_FIELDS: PerformanceFieldDefinition[] = [
  {
    key: "domainAuthority",
    label: "Domain Authority",
    type: "number",
    unit: "Score",
    min: 0,
    max: 100,
    category: "websiteAuthority",
    tooltip: "Find this in Moz, Ahrefs, or SEMrush. Score from 0 to 100 where higher is stronger."
  },
  {
    key: "pageAuthority",
    label: "Page Authority",
    type: "number",
    unit: "Score",
    min: 0,
    max: 100,
    category: "websiteAuthority",
    tooltip: "A page-level authority score from 0 to 100."
  },
  {
    key: "backlinks",
    label: "Backlinks",
    type: "number",
    unit: "Count",
    min: 0,
    category: "websiteAuthority",
    tooltip: "Total backlink count from your SEO data source."
  },
  {
    key: "referringDomains",
    label: "Referring Domains",
    type: "number",
    unit: "Count",
    min: 0,
    category: "websiteAuthority",
    tooltip: "Unique referring domains linking to the site."
  },
  {
    key: "criticalSeoHealth",
    label: "Critical SEO Health",
    type: "number",
    unit: "Score",
    min: 0,
    max: 100,
    category: "seoHealth",
    tooltip: "Overall technical SEO health score from 0 to 100."
  },
  {
    key: "indexedPages",
    label: "Indexed Pages",
    type: "number",
    unit: "Count",
    min: 0,
    category: "seoHealth",
    tooltip: "Number of pages indexed in Google."
  },
  {
    key: "metadataIssues",
    label: "Metadata Issues",
    type: "number",
    unit: "Count",
    min: 0,
    category: "seoHealth",
    tooltip: "Missing or duplicated titles, descriptions or similar metadata problems."
  },
  {
    key: "brokenLinks",
    label: "Broken Links",
    type: "number",
    unit: "Count",
    min: 0,
    category: "seoHealth",
    tooltip: "Broken internal or external links detected on the site."
  },
  {
    key: "organicMonthlyVisits",
    label: "Organic Monthly Visits",
    type: "number",
    unit: "Count",
    min: 0,
    category: "organicVisibility",
    tooltip: "Estimated monthly organic traffic from a consistent SEO source."
  },
  {
    key: "topKeyword1",
    label: "Top Keyword 1",
    type: "text",
    unit: "Text",
    category: "organicVisibility",
    tooltip: "One of the three most important ranking keywords or phrases."
  },
  {
    key: "topKeyword2",
    label: "Top Keyword 2",
    type: "text",
    unit: "Text",
    category: "organicVisibility",
    tooltip: "A second commercially meaningful ranking keyword or phrase."
  },
  {
    key: "topKeyword3",
    label: "Top Keyword 3",
    type: "text",
    unit: "Text",
    category: "organicVisibility",
    tooltip: "A third important keyword or phrase."
  },
  {
    key: "bounceRate",
    label: "Bounce Rate",
    type: "number",
    unit: "Percentage",
    min: 0,
    max: 100,
    category: "userEngagement",
    tooltip: "Enter as a whole number percentage, for example 72 not 0.72."
  },
  {
    key: "pagesPerVisit",
    label: "Pages Per Visit",
    type: "number",
    unit: "Decimal",
    min: 0,
    max: 20,
    category: "userEngagement",
    tooltip: "Average number of pages viewed per visit."
  },
  {
    key: "averageSessionDuration",
    label: "Average Session Duration",
    type: "number",
    unit: "Seconds",
    min: 0,
    category: "userEngagement",
    tooltip: "Average session duration in seconds."
  },
  {
    key: "coreWebVitals",
    label: "Core Web Vitals",
    type: "dropdown",
    unit: "Status",
    category: "technicalPerformance",
    tooltip: "Use Google's CWV status: Poor, Needs Improvement, or Good."
  },
  {
    key: "pageSpeedScore",
    label: "Page Speed Score",
    type: "number",
    unit: "Score",
    min: 0,
    max: 100,
    category: "technicalPerformance",
    tooltip: "PageSpeed Insights score from 0 to 100."
  },
  {
    key: "mobilePerformanceScore",
    label: "Mobile Performance Score",
    type: "number",
    unit: "Score",
    min: 0,
    max: 100,
    category: "technicalPerformance",
    tooltip: "Mobile device performance score from 0 to 100."
  },
  {
    key: "trustScore",
    label: "Trust Score",
    type: "number",
    unit: "Score",
    min: 0,
    max: 100,
    category: "trustAndConversion",
    tooltip: "Internal or external trust score from 0 to 100."
  },
  {
    key: "googleReviewsCount",
    label: "Google Reviews Count",
    type: "number",
    unit: "Count",
    min: 0,
    category: "trustAndConversion",
    tooltip: "Number of public Google reviews."
  },
  {
    key: "averageReviewRating",
    label: "Average Review Rating",
    type: "number",
    unit: "Decimal",
    min: 0,
    max: 5,
    category: "trustAndConversion",
    tooltip: "Average public review rating, typically from 0 to 5."
  },
  {
    key: "socialMediaPresenceScore",
    label: "Social Media Presence Score",
    type: "number",
    unit: "Score",
    min: 0,
    max: 100,
    category: "strategicDigitalMaturity",
    tooltip: "A score from 0 to 100 reflecting activity, consistency and platform presence."
  },
  {
    key: "aiGeoVisibilityScore",
    label: "AI / GEO Visibility Score",
    type: "number",
    unit: "Score",
    min: 0,
    max: 100,
    category: "strategicDigitalMaturity",
    tooltip: "A 0 to 100 estimate of answer-engine and generative search visibility."
  },
  {
    key: "paidMediaVisibility",
    label: "Paid Media Visibility",
    type: "dropdown",
    unit: "Status",
    category: "strategicDigitalMaturity",
    tooltip: "Whether the brand is visibly active in paid media: None, Low, Medium or High."
  }
];

export const INDUSTRY_BENCHMARKS: IndustryBenchmarkPreset[] = [
  {
    industry: "Financial Services",
    description: "Typical digital maturity profile for established financial services firms.",
    defaults: {
      domainAuthority: 42,
      criticalSeoHealth: 74,
      organicMonthlyVisits: 8500,
      bounceRate: 58,
      coreWebVitals: "Needs Improvement"
    }
  },
  {
    industry: "Legal",
    description: "Reference profile for legal firms with active digital positioning.",
    defaults: {
      domainAuthority: 31,
      criticalSeoHealth: 71,
      organicMonthlyVisits: 3200,
      bounceRate: 62,
      coreWebVitals: "Needs Improvement"
    }
  },
  {
    industry: "Property and Real Estate",
    description: "Reference profile for real estate and property businesses.",
    defaults: {
      domainAuthority: 35,
      criticalSeoHealth: 69,
      organicMonthlyVisits: 5400,
      bounceRate: 61,
      coreWebVitals: "Needs Improvement"
    }
  },
  {
    industry: "Professional Services",
    description: "Reference profile for consulting and specialist service businesses.",
    defaults: {
      domainAuthority: 28,
      criticalSeoHealth: 68,
      organicMonthlyVisits: 2100,
      bounceRate: 64,
      coreWebVitals: "Poor"
    }
  },
  {
    industry: "Healthcare",
    description: "Reference profile for healthcare and medical service providers.",
    defaults: {
      domainAuthority: 33,
      criticalSeoHealth: 72,
      organicMonthlyVisits: 4300,
      bounceRate: 59,
      coreWebVitals: "Needs Improvement"
    }
  },
  {
    industry: "Technology and SaaS",
    description: "Reference profile for software and technology businesses.",
    defaults: {
      domainAuthority: 51,
      criticalSeoHealth: 79,
      organicMonthlyVisits: 15200,
      bounceRate: 54,
      coreWebVitals: "Good"
    }
  },
  {
    industry: "Retail and E-commerce",
    description: "Reference profile for digital-first retail and e-commerce brands.",
    defaults: {
      domainAuthority: 44,
      criticalSeoHealth: 76,
      organicMonthlyVisits: 22000,
      bounceRate: 65,
      coreWebVitals: "Needs Improvement"
    }
  },
  {
    industry: "Hospitality and Tourism",
    description: "Reference profile for hospitality, accommodation and tourism brands.",
    defaults: {
      domainAuthority: 29,
      criticalSeoHealth: 65,
      organicMonthlyVisits: 6800,
      bounceRate: 67,
      coreWebVitals: "Poor"
    }
  },
  {
    industry: "Education",
    description: "Reference profile for educational institutions and training businesses.",
    defaults: {
      domainAuthority: 38,
      criticalSeoHealth: 73,
      organicMonthlyVisits: 9100,
      bounceRate: 57,
      coreWebVitals: "Needs Improvement"
    }
  },
  {
    industry: "Construction and Engineering",
    description: "Reference profile for construction and engineering businesses.",
    defaults: {
      domainAuthority: 22,
      criticalSeoHealth: 64,
      organicMonthlyVisits: 1400,
      bounceRate: 68,
      coreWebVitals: "Poor"
    }
  },
  {
    industry: "Manufacturing",
    description: "Reference profile for manufacturers and industrial businesses.",
    defaults: {
      domainAuthority: 24,
      criticalSeoHealth: 65,
      organicMonthlyVisits: 1800,
      bounceRate: 66,
      coreWebVitals: "Poor"
    }
  },
  {
    industry: "Other",
    description: "Fallback benchmark profile where a more specific industry reference is unavailable.",
    defaults: {
      domainAuthority: 30,
      criticalSeoHealth: 68,
      organicMonthlyVisits: 3000,
      bounceRate: 63,
      coreWebVitals: "Needs Improvement"
    }
  }
];

export const SERVICE_PATHWAYS: Record<
  ServicePathwayKey,
  {
    name: string;
    description: string;
    services: string[];
  }
> = {
  foundationFix: {
    name: "Foundation Fix",
    description:
      "Recommended when the site's technical and experience foundations are not strong enough to support sustainable visibility growth.",
    services: [
      "Website audit",
      "Technical SEO remediation",
      "Core Web Vitals improvement",
      "UX improvements",
      "Mobile performance optimisation"
    ]
  },
  visibilityGrowth: {
    name: "Visibility Growth",
    description:
      "Recommended when the site is not earning enough search visibility or authority to capture demand consistently.",
    services: [
      "SEO retainer",
      "Content strategy",
      "Blog programme",
      "Local SEO",
      "Authority building",
      "PR distribution",
      "Backlink acquisition"
    ]
  },
  trustAndConversionUpgrade: {
    name: "Trust and Conversion Upgrade",
    description:
      "Recommended when traffic exists, but trust signals and engagement quality are limiting conversion potential.",
    services: [
      "Conversion audit",
      "Landing page optimisation",
      "Case study development",
      "Testimonial programme",
      "Sales funnel refinement"
    ]
  },
  strategicMarketLeadership: {
    name: "Strategic Market Leadership",
    description:
      "Recommended when foundational performance exists, but broader digital strategy and market positioning remain underpowered.",
    services: [
      "Fractional CMO support",
      "Brand strategy",
      "Digital strategy",
      "GEO and AI visibility strategy",
      "PR strategy",
      "Campaign development"
    ]
  }
};

export const RECOMMENDATION_LIBRARY: Array<{
  id: string;
  title: string;
  rationale: string;
  classification: RecommendationClassification;
  riskOfInaction: string;
  timeline: string;
  categoryKey: PerformanceCategoryKey;
}> = [
  {
    id: "authority-gap",
    title: "Authority Gap — Build Search Credibility",
    rationale:
      "The business is not earning the same level of domain trust as its competitors. This limits its ability to rank for commercial terms, even when content quality is high.",
    classification: "Strategic Programme",
    riskOfInaction:
      "Competitors will continue to compound their authority advantage, making the gap progressively more expensive and time-consuming to close.",
    timeline: "6–12 months",
    categoryKey: "websiteAuthority"
  },
  {
    id: "technical-seo-foundation",
    title: "Technical SEO — Fix the Foundation",
    rationale:
      "The site has structural issues that are limiting how effectively search engines can crawl, interpret and rank its content.",
    classification: "Quick Win",
    riskOfInaction:
      "Technical debt accumulates. Issues unresolved today will require more remediation later and will continue to suppress rankings in the interim.",
    timeline: "30–90 days",
    categoryKey: "seoHealth"
  },
  {
    id: "visibility-gap",
    title: "Visibility Gap — Capture High-Intent Search Demand",
    rationale:
      "The business is not appearing prominently when prospective clients search for its services. Competitors are capturing this demand instead.",
    classification: "Strategic Programme",
    riskOfInaction:
      "Every month of low visibility is a month of pipeline that shifts to a competitor.",
    timeline: "3–6 months",
    categoryKey: "organicVisibility"
  },
  {
    id: "conversion-leak",
    title: "Conversion Leak — Improve Visitor Engagement",
    rationale:
      "Visitors are arriving but not engaging. This suggests a disconnect between what the site promises and what it delivers.",
    classification: "Quick Win",
    riskOfInaction:
      "Traffic investment, whether paid or organic, is being wasted because the site is not converting attention into deeper interest.",
    timeline: "30–60 days",
    categoryKey: "userEngagement"
  },
  {
    id: "content-journey",
    title: "Content Journey — Improve Internal Navigation and Depth",
    rationale:
      "Visitors are not moving through the site. This limits exposure to service pages, case studies and conversion points.",
    classification: "Quick Win",
    riskOfInaction:
      "Low content engagement correlates with lower enquiry rates and a weaker shortlist position.",
    timeline: "30–60 days",
    categoryKey: "userEngagement"
  },
  {
    id: "performance",
    title: "Performance — Fix Site Speed and User Experience",
    rationale:
      "Slow, technically poor sites lose rankings and lose users. Google uses Core Web Vitals as a ranking factor and users abandon slow pages within seconds.",
    classification: "Quick Win",
    riskOfInaction:
      "Both search engines and users penalise poor performance, hurting visibility and conversion at the same time.",
    timeline: "30–90 days",
    categoryKey: "technicalPerformance"
  },
  {
    id: "credibility-gap",
    title: "Credibility Gap — Strengthen Trust Signals",
    rationale:
      "Prospective clients make shortlist decisions based on what they find online. Weak trust signals reduce the probability of being shortlisted even when the underlying service is strong.",
    classification: "Quick Win to Strategic Programme",
    riskOfInaction:
      "Lower conversion rates will persist across all traffic sources, regardless of how much visibility improves.",
    timeline: "60–90 days",
    categoryKey: "trustAndConversion"
  },
  {
    id: "ai-discovery",
    title: "AI Discovery — Optimise for Generative Search",
    rationale:
      "A growing proportion of B2B research now begins in AI tools. Brands that are not structured for AI discoverability are excluded from consideration before any human interaction takes place.",
    classification: "Strategic Programme",
    riskOfInaction:
      "This channel is growing fastest among senior decision-makers and early movers will establish a compounding advantage.",
    timeline: "3–6 months",
    categoryKey: "strategicDigitalMaturity"
  },
  {
    id: "non-branded-keyword-gap",
    title: "Search Strategy — Build Non-Branded Keyword Authority",
    rationale:
      "The business is primarily visible for its own name, which means it is not capturing prospective clients who do not yet know the brand exists.",
    classification: "Strategic Programme",
    riskOfInaction:
      "Organic growth remains capped by existing brand awareness rather than driven by active demand capture.",
    timeline: "6–12 months",
    categoryKey: "organicVisibility"
  }
];
