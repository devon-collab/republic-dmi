import { RefreshCcw, RotateCcw } from "lucide-react";

import { PERFORMANCE_FIELDS, PRODUCT_NAME, REPORT_VERSION } from "@/lib/config";
import { REPORT_DOCUMENT_CSS } from "@/lib/report-styles";
import type {
  GeneratedNarrativeSections,
  MetricBenchmark,
  PerformanceData,
  ReportBuildResult,
  ReportInput,
  RiskLevel,
  StrategicFinding,
  TriggeredRecommendation
} from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TABLE_METRICS: Array<keyof PerformanceData> = [
  "domainAuthority",
  "pageAuthority",
  "backlinks",
  "referringDomains",
  "criticalSeoHealth",
  "indexedPages",
  "organicMonthlyVisits",
  "bounceRate",
  "pagesPerVisit",
  "pageSpeedScore",
  "mobilePerformanceScore",
  "trustScore",
  "googleReviewsCount",
  "averageReviewRating",
  "socialMediaPresenceScore",
  "aiGeoVisibilityScore"
];

type NarrativeSectionKey = Exclude<keyof GeneratedNarrativeSections, "strategicFindings">;

type SectionHistory = Record<NarrativeSectionKey, string[]>;

interface ReportDocumentProps {
  input: ReportInput;
  report: ReportBuildResult;
  narratives: GeneratedNarrativeSections;
  recommendations: TriggeredRecommendation[];
  editable?: boolean;
  injectStyles?: boolean;
  sectionHistory?: SectionHistory;
  findingsHistory?: StrategicFinding[][];
  onSectionChange?: (section: NarrativeSectionKey, value: string) => void;
  onSectionRegenerate?: (section: NarrativeSectionKey) => void;
  onSectionRestore?: (section: NarrativeSectionKey, value: string) => void;
  onFindingChange?: (findingId: string, value: string) => void;
  onFindingsRegenerate?: () => void;
  onFindingsRestore?: (findings: StrategicFinding[]) => void;
}

const metricLabelMap = PERFORMANCE_FIELDS.reduce<Record<string, string>>((accumulator, field) => {
  accumulator[field.key] = field.label;
  return accumulator;
}, {});

const reportContacts = [
  { label: "Email", value: "info@republicdigitalconsultancy.com" },
  { label: "Phone", value: "087 550 0630" },
  { label: "Website", value: "republicdigitalconsultancy.com" },
  { label: "Address", value: "Atrium on 5th, 5th St, Sandhurst, Sandton, 2196" }
];

export function ReportDocument({
  input,
  report,
  narratives,
  recommendations,
  editable = false,
  injectStyles = true,
  sectionHistory,
  findingsHistory,
  onSectionChange,
  onSectionRegenerate,
  onSectionRestore,
  onFindingChange,
  onFindingsRegenerate,
  onFindingsRestore
}: ReportDocumentProps) {
  const metricBenchmarkMap = report.metricBenchmarks.reduce<Record<string, MetricBenchmark>>(
    (accumulator, benchmark) => {
      accumulator[benchmark.key] = benchmark;
      return accumulator;
    },
    {}
  );
  const competitorAverageEntity = report.radarSeries.find(
    (series) => series.name === "Competitor Average"
  );
  const industrySeries = report.radarSeries.find(
    (series) => series.name === report.industryBenchmark?.industry + " Benchmark"
  );
  const tableCompetitors = report.competitors.slice(0, 3);
  const topGaps = report.metricBenchmarks
    .filter((benchmark) => benchmark.gapPercentage != null)
    .sort((left, right) => (right.gapPercentage ?? 0) - (left.gapPercentage ?? 0))
    .slice(0, 5);

  return (
    <div className="report-document">
      {injectStyles ? <style dangerouslySetInnerHTML={{ __html: REPORT_DOCUMENT_CSS }} /> : null}

      <section className="report-page">
        <div className="report-cover-grid">
          <div>
            <img className="report-logo" src="/republic-logo.png" alt="Republic Digital Consultancy" />
            <p className="report-kicker">Prepared for private outreach</p>
            <h1 className="report-title">Digital Maturity Index</h1>
            <p className="report-subtitle">{input.prospect.companyName || "Prospect Company"}</p>
            <p className="report-positioning">
              A strategic snapshot of your current digital market position, visibility gaps, and
              growth opportunities.
            </p>
          </div>

          <div className="report-meta-card">
            <div className="report-meta-row">
              <div className="report-meta-label">Website</div>
              <div className="report-meta-value">{input.prospect.websiteUrl || "Unspecified"}</div>
            </div>
            <div className="report-meta-row">
              <div className="report-meta-label">Industry</div>
              <div className="report-meta-value">{input.prospect.industry}</div>
            </div>
            <div className="report-meta-row">
              <div className="report-meta-label">Region</div>
              <div className="report-meta-value">{input.prospect.region || "Not provided"}</div>
            </div>
            <div className="report-meta-row">
              <div className="report-meta-label">Report Date</div>
              <div className="report-meta-value">{input.prospect.reportDate}</div>
            </div>
            {input.prospect.contactName || input.prospect.contactRole ? (
              <div className="report-meta-row">
                <div className="report-meta-label">Prepared For</div>
                <div className="report-meta-value">
                  {[input.prospect.contactName, input.prospect.contactRole].filter(Boolean).join(" — ")}
                </div>
              </div>
            ) : null}
            {report.confidence.percent < 40 ? (
              <div className="report-meta-row">
                <div className="report-meta-label">Confidence Flag</div>
                <div className="report-meta-value">Estimated Report — Limited Data</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="report-band" />
        <div className="report-footer-note">
          <span>
            Prepared exclusively for {input.prospect.companyName || "the recipient"} by Republic Digital
            Consultancy. Not for distribution.
          </span>
          <span>{PRODUCT_NAME}</span>
        </div>
      </section>

      <section className="report-page">
        <p className="report-section-label">Executive Snapshot</p>
        <div className="report-two-column">
          <div>
            <h2 className="report-section-title">Current Digital Position</h2>
            <NarrativeBlock
              editable={editable}
              value={narratives.executiveSummary}
              section="executiveSummary"
              history={sectionHistory?.executiveSummary ?? []}
              onChange={onSectionChange}
              onRegenerate={onSectionRegenerate}
              onRestore={onSectionRestore}
            />
            {report.confidence.percent < 100 ? (
              <div className="report-confidence">
                <strong>Data confidence:</strong> {report.confidence.percent}% populated,{" "}
                {report.confidence.level === "full"
                  ? "Full Report"
                  : report.confidence.level === "estimated"
                    ? "Estimated Report"
                    : "Partial Report"}
              </div>
            ) : null}
          </div>

          <div className="report-gauge-card">
            <ScoreGauge score={report.totalScore} label={report.scoreBand.label} />
            <div className="report-gauge-meta">
              <div>{report.scoreBand.description}</div>
              <div style={{ marginTop: 12 }}>
                Benchmark position: <strong>{report.benchmarkRankLabel}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="report-grid-tiles">
          {report.categoryScores.map((category) => (
            <div className="report-tile" key={category.key}>
              <div className="report-tile-label">{category.label}</div>
              <div className="report-tile-value">
                {category.score}/{category.max}
              </div>
              <div className="report-tile-subvalue">
                {category.status}
                {category.unscored > 0 ? ` • ${category.unscored} unscored` : ""}
              </div>
              <div className="report-progress">
                <span style={{ width: `${(category.score / category.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="report-page">
        <p className="report-section-label">Competitive Position</p>
        <h2 className="report-section-title">Where The Market Is Pulling Ahead</h2>
        <NarrativeBlock
          editable={editable}
          value={narratives.marketPositionSummary}
          section="marketPositionSummary"
          history={sectionHistory?.marketPositionSummary ?? []}
          onChange={onSectionChange}
          onRegenerate={onSectionRegenerate}
          onRestore={onSectionRestore}
        />
        <div className="report-position-pill">{report.benchmarkRankLabel}</div>

        <table className="report-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Prospect</th>
              {tableCompetitors.map((competitor) => (
                <th key={competitor.id}>{competitor.name}</th>
              ))}
              {Array.from({ length: Math.max(0, 3 - tableCompetitors.length) }).map((_, index) => (
                <th key={`empty-head-${index}`}>—</th>
              ))}
              <th>Prospect Rank</th>
            </tr>
          </thead>
          <tbody>
            {TABLE_METRICS.map((metricKey) => {
              const benchmark = metricBenchmarkMap[metricKey];
              const prospectValue = report.prospect.performance[metricKey];
              const competitorValues = tableCompetitors.map((competitor) => competitor.performance[metricKey]);
              const prospectClass = resolveProspectCellClass(metricKey, prospectValue, competitorValues);

              return (
                <tr key={metricKey}>
                  <td>{metricLabelMap[metricKey] ?? metricKey}</td>
                  <td className={`report-table-prospect ${prospectClass}`}>
                    {formatMetricRawValue(metricKey, prospectValue)}
                  </td>
                  {tableCompetitors.map((competitor) => (
                    <td key={`${metricKey}-${competitor.id}`}>
                      {formatMetricRawValue(metricKey, competitor.performance[metricKey])}
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - tableCompetitors.length) }).map((_, index) => (
                    <td key={`${metricKey}-empty-${index}`}>—</td>
                  ))}
                  <td>{benchmark?.rank ? `${benchmark.rank}/${benchmark.totalEntities}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="report-layout-split" style={{ marginTop: 24 }}>
          <div className="report-radar-card">
            <div className="report-section-label">Category Radar</div>
            <RadarChart
              prospect={report.radarSeries[0]?.values ?? []}
              competitorAverage={competitorAverageEntity?.values ?? []}
              industry={industrySeries?.values ?? []}
            />
          </div>
          <div className="report-callout">
            <div className="report-section-label">Why This Matters</div>
            <p className="report-text">
              Competitive gaps in authority, discoverability and trust do not stay static. Every month
              that a stronger competitor compounds these advantages, the cost of closing the gap rises.
            </p>
          </div>
        </div>
      </section>

      <section className="report-page">
        <p className="report-section-label">Strategic Findings</p>
        <h2 className="report-section-title">The Gaps Most Likely To Affect Pipeline</h2>
        <div className="report-edit-controls" style={{ marginBottom: 12 }}>
          {editable && onFindingsRegenerate ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onFindingsRegenerate()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Regenerate findings
            </Button>
          ) : null}
        </div>
        {editable && findingsHistory?.length ? (
          <details className="report-note-card" style={{ padding: 16, marginBottom: 18 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Previous findings version</summary>
            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              {findingsHistory[0]?.map((finding) => (
                <div key={`previous-${finding.id}`} className="report-tile">
                  <strong>{finding.title}</strong>
                  <p className="report-text" style={{ marginTop: 8 }}>
                    {finding.body}
                  </p>
                </div>
              ))}
              {onFindingsRestore ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFindingsRestore(findingsHistory[0])}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore previous findings
                </Button>
              ) : null}
            </div>
          </details>
        ) : null}

        <div className="report-findings-grid">
          {narratives.strategicFindings.map((finding) => (
            <div className="report-finding-card" key={finding.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <h3 className="report-finding-title">{finding.title}</h3>
                <RiskChip riskLevel={finding.riskLevel} />
              </div>
              {editable ? (
                <textarea
                  className="report-textarea"
                  value={finding.body}
                  onChange={(event) => onFindingChange?.(finding.id, event.target.value)}
                />
              ) : (
                <p className="report-text">{finding.body}</p>
              )}
              <div className="report-metric-chip">
                <strong>{finding.metricLabel}</strong> {finding.metricValue}
              </div>
            </div>
          ))}
        </div>

        <div className="report-gap-card" style={{ marginTop: 24 }}>
          <div className="report-section-label">Largest Metric Gaps</div>
          {topGaps.map((benchmark) => (
            <GapBarRow
              key={benchmark.key}
              benchmark={benchmark}
            />
          ))}
        </div>
      </section>

      <section className="report-page">
        <p className="report-section-label">Priority Recommendations</p>
        <h2 className="report-section-title">Where Republic Would Focus First</h2>
        <NarrativeBlock
          editable={editable}
          value={narratives.recommendationsIntroduction}
          section="recommendationsIntroduction"
          history={sectionHistory?.recommendationsIntroduction ?? []}
          onChange={onSectionChange}
          onRegenerate={onSectionRegenerate}
          onRestore={onSectionRestore}
        />

        <div className="report-rec-grid">
          {recommendations.map((recommendation) => (
            <div
              className={`report-rec-card ${
                recommendation.classification === "Strategic Programme" ? "programme" : ""
              }`}
              key={recommendation.id}
            >
              <h3 className="report-rec-title">{recommendation.title}</h3>
              <p className="report-text">{recommendation.rationale}</p>
              <div className="report-rec-meta">
                <span className="report-pill">{recommendation.classification}</span>
                <span className="report-pill">{recommendation.timeline}</span>
              </div>
              <div className="report-risk-callout">
                <strong>Risk of inaction:</strong> {recommendation.riskOfInaction}
              </div>
            </div>
          ))}
        </div>

        <div className="report-pathway-grid">
          {report.primaryPathway ? (
            <div className="report-pathway-card">
              <div className="report-section-label">Primary Pathway</div>
              <h3 className="report-pathway-title">{report.primaryPathway.name}</h3>
              <NarrativeBlock
                editable={editable}
                value={narratives.servicePathwayIntroduction}
                section="servicePathwayIntroduction"
                history={sectionHistory?.servicePathwayIntroduction ?? []}
                onChange={onSectionChange}
                onRegenerate={onSectionRegenerate}
                onRestore={onSectionRestore}
              />
              <ul className="report-list">
                {report.primaryPathway.services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {report.secondaryPathway ? (
            <div className="report-pathway-card">
              <div className="report-section-label">Phase 2</div>
              <h3 className="report-pathway-title">{report.secondaryPathway.name}</h3>
              <p className="report-text">{report.secondaryPathway.introduction}</p>
              <ul className="report-list">
                {report.secondaryPathway.services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="report-pathway-card">
              <div className="report-section-label">What Success Looks Like</div>
              <p className="report-text">
                Once the primary pathway is underway, the next phase is to compound authority,
                trust and discoverability rather than layering on more isolated marketing activity.
              </p>
            </div>
          )}
        </div>

        <div className="report-callout">
          <p className="report-text">
            You do not need more marketing activity. You need a clearer digital growth system.
          </p>
        </div>
      </section>

      <section className="report-page">
        <p className="report-section-label">Next Steps</p>
        <h2 className="report-section-title">From Diagnostic To Action</h2>
        <NarrativeBlock
          editable={editable}
          value={narratives.closingStatement}
          section="closingStatement"
          history={sectionHistory?.closingStatement ?? []}
          onChange={onSectionChange}
          onRegenerate={onSectionRegenerate}
          onRestore={onSectionRestore}
        />

        <div className="report-action-grid">
          <div className="report-action-card">
            <h3 className="report-action-title">Book a Discovery Call</h3>
            <p className="report-text">
              Review the benchmark gaps, challenge assumptions, and identify the most urgent actions.
            </p>
          </div>
          <div className="report-action-card">
            <h3 className="report-action-title">Request a Full Diagnostic</h3>
            <p className="report-text">
              Move from this snapshot to a deeper technical, content, conversion and AI visibility roadmap.
            </p>
          </div>
          <div className="report-action-card">
            <h3 className="report-action-title">Share This Report</h3>
            <p className="report-text">
              Circulate the benchmark internally so leadership can see the commercial case for action.
            </p>
          </div>
        </div>

        <div className="report-contact-grid">
          {reportContacts.map((contact) => (
            <div className="report-contact-card" key={contact.label}>
              <div className="report-contact-label">{contact.label}</div>
              <div className="report-contact-value">{contact.value}</div>
            </div>
          ))}
        </div>

        <div className="report-version">
          <img className="report-logo" src="/republic-logo.png" alt="Republic Digital Consultancy" style={{ width: 160 }} />
          <span>
            {REPORT_VERSION} — {input.prospect.reportDate}
          </span>
        </div>
      </section>
    </div>
  );
}

function NarrativeBlock({
  editable,
  value,
  section,
  history,
  onChange,
  onRegenerate,
  onRestore
}: {
  editable: boolean;
  value: string;
  section: NarrativeSectionKey;
  history: string[];
  onChange?: (section: NarrativeSectionKey, value: string) => void;
  onRegenerate?: (section: NarrativeSectionKey) => void;
  onRestore?: (section: NarrativeSectionKey, value: string) => void;
}) {
  if (!editable) {
    return <p className="report-text">{value}</p>;
  }

  return (
    <div>
      <textarea
        className="report-textarea"
        value={value}
        onChange={(event) => onChange?.(section, event.target.value)}
      />
      <div className="report-edit-controls">
        {onRegenerate ? (
          <Button variant="secondary" size="sm" onClick={() => onRegenerate(section)}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Regenerate section
          </Button>
        ) : null}
      </div>
      {history.length ? (
        <details className="report-note-card" style={{ padding: 16, marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Previous version</summary>
          <p className="report-text" style={{ marginTop: 12 }}>
            {history[0]}
          </p>
          {onRestore ? (
            <div className="report-edit-controls">
              <Button variant="ghost" size="sm" onClick={() => onRestore(section, history[0])}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore previous version
              </Button>
            </div>
          ) : null}
        </details>
      ) : null}
    </div>
  );
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const progress = Math.max(0, Math.min(score, 100));
  const strokeColor = scoreToColor(score);

  return (
    <div className="report-gauge-wrap">
      <svg viewBox="0 0 220 140" role="img" aria-label={`Digital maturity score ${score} out of 100`}>
        <path
          d="M20 120 A90 90 0 0 1 200 120"
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="16"
          strokeLinecap="round"
          pathLength={100}
        />
        <path
          d="M20 120 A90 90 0 0 1 200 120"
          fill="none"
          stroke={strokeColor}
          strokeWidth="16"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${progress} 100`}
        />
        <text x="110" y="90" textAnchor="middle" fill="#182028" fontSize="42" fontWeight="600">
          {score}
        </text>
        <text x="110" y="112" textAnchor="middle" fill="rgba(24,32,40,0.62)" fontSize="14">
          /100
        </text>
      </svg>
      <div>
        <div className="report-tile-label" style={{ color: "#5f7379" }}>
          Overall Score
        </div>
        <div className="report-title" style={{ fontSize: 28, color: "#178A95", margin: "6px 0 0" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function RadarChart({
  prospect,
  competitorAverage,
  industry
}: {
  prospect: Array<{ label: string; value: number }>;
  competitorAverage: Array<{ label: string; value: number }>;
  industry: Array<{ label: string; value: number }>;
}) {
  const labels = prospect.map((item) => item.label);
  const size = 320;
  const center = size / 2;
  const radius = 112;

  const rings = [20, 40, 60, 80, 100];

  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="300" role="img" aria-label="Radar chart">
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={labels
              .map((_, index) => pointForValue(index, labels.length, radius * (ring / 100), center))
              .map(({ x, y }) => `${x},${y}`)
              .join(" ")}
            fill="none"
            stroke="rgba(17,24,39,0.08)"
          />
        ))}
        {labels.map((label, index) => {
          const point = pointForValue(index, labels.length, radius, center);
          return (
            <g key={label}>
              <line x1={center} y1={center} x2={point.x} y2={point.y} stroke="rgba(17,24,39,0.12)" />
              <text
                x={point.x}
                y={point.y}
                textAnchor={point.x < center - 8 ? "end" : point.x > center + 8 ? "start" : "middle"}
                fontSize="11"
                fill="#4b5563"
                dy={point.y < center ? -6 : 14}
              >
                {label}
              </text>
            </g>
          );
        })}
        <polygon
          points={seriesToPolygon(prospect, labels.length, radius, center)}
          fill="rgba(25,174,187,0.16)"
          stroke="#19AEBB"
          strokeWidth="2"
        />
        <polygon
          points={seriesToPolygon(competitorAverage, labels.length, radius, center)}
          fill="rgba(17,24,39,0.12)"
          stroke="#374151"
          strokeWidth="2"
        />
        {industry.length ? (
          <polygon
            points={seriesToPolygon(industry, labels.length, radius, center)}
            fill="rgba(148,163,184,0.1)"
            stroke="#94a3b8"
            strokeWidth="2"
          />
        ) : null}
      </svg>
      <div className="report-rec-meta">
        <span className="report-pill">Prospect</span>
        <span className="report-pill" style={{ color: "#374151" }}>
          Competitor Average
        </span>
        {industry.length ? (
          <span className="report-pill" style={{ color: "#64748b" }}>
            Industry Benchmark
          </span>
        ) : null}
      </div>
    </div>
  );
}

function GapBarRow({ benchmark }: { benchmark: MetricBenchmark }) {
  const prospect = extractComparableNumber(benchmark.prospectValue);
  const competitorAverage = extractComparableNumber(benchmark.competitorAverage);
  const maxValue = Math.max(prospect, competitorAverage, 1);

  return (
    <div className="report-gap-row">
      <div className="report-gap-label">{benchmark.label}</div>
      <div className="report-gap-bars">
        <div className="report-gap-bar-track">
          <span
            className="report-gap-bar-competitor"
            style={{ width: `${(competitorAverage / maxValue) * 100}%` }}
          />
        </div>
        <div className="report-gap-bar-track">
          <span
            className="report-gap-bar-prospect"
            style={{ width: `${(prospect / maxValue) * 100}%` }}
          />
        </div>
      </div>
      <div className="report-gap-value">
        {benchmark.gapPercentage != null ? `${benchmark.gapPercentage}% gap` : "Unscored"}
      </div>
    </div>
  );
}

function RiskChip({ riskLevel }: { riskLevel: RiskLevel }) {
  return (
    <span className={`report-risk-chip report-risk-${riskLevel.toLowerCase()}`}>{riskLevel}</span>
  );
}

function pointForValue(index: number, total: number, scaledRadius: number, center: number) {
  const angle = (-Math.PI / 2) + (index * Math.PI * 2) / total;
  return {
    x: center + Math.cos(angle) * scaledRadius,
    y: center + Math.sin(angle) * scaledRadius
  };
}

function seriesToPolygon(
  values: Array<{ label: string; value: number }>,
  total: number,
  radius: number,
  center: number
) {
  return values
    .map((value, index) => {
      const point = pointForValue(index, total, radius * (value.value / 100), center);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

function scoreToColor(score: number) {
  if (score >= 85) return "#22c55e";
  if (score >= 70) return "#84cc16";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function formatMetricRawValue(metricKey: keyof PerformanceData, value: unknown) {
  if (value == null || value === "") return "Unscored";
  if (typeof value === "string") return value;
  if (typeof value !== "number") return "Unscored";

  switch (metricKey) {
    case "bounceRate":
      return `${formatNumber(value, 0)}%`;
    case "averageReviewRating":
      return `${formatNumber(value, 1)}/5`;
    case "pagesPerVisit":
      return formatNumber(value, 1);
    default:
      return formatNumber(value, 0);
  }
}

function extractComparableNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function resolveProspectCellClass(
  metricKey: keyof PerformanceData,
  prospectValue: unknown,
  competitorValues: unknown[]
) {
  const prospect = extractComparableNumber(prospectValue);
  const comparables = competitorValues
    .map((value) => extractComparableNumber(value))
    .filter((value) => value > 0);

  if (!comparables.length) return "";

  const average =
    comparables.reduce((sum, value) => sum + value, 0) / comparables.length;
  const lowerIsBetter = metricKey === "bounceRate";
  const deltaPercent = average === 0 ? 0 : ((prospect - average) / average) * 100;

  if (lowerIsBetter) {
    if (prospect <= average) return "report-table-cell-good";
    if (prospect <= average * 1.15) return "report-table-cell-warning";
    return "report-table-cell-danger";
  }

  if (prospect >= average) return "report-table-cell-good";
  if (deltaPercent >= -15) return "report-table-cell-warning";
  return "report-table-cell-danger";
}
