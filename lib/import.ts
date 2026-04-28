import { read, utils } from "xlsx";

import { PERFORMANCE_FIELDS } from "@/lib/config";
import { FIXED_COMPETITOR_IDS, createEmptyPerformanceData } from "@/lib/defaults";
import type { PerformanceData, UploadedDataset, UploadMapping } from "@/lib/types";
import { normaliseUrl } from "@/lib/utils";

export type ImportFieldKey = "entityName" | "entityUrl" | "entityType" | keyof PerformanceData;

export const IMPORTABLE_FIELDS: Array<{ key: ImportFieldKey; label: string }> = [
  { key: "entityName", label: "Company Name" },
  { key: "entityUrl", label: "Website URL" },
  { key: "entityType", label: "Entity Type (Prospect / Competitor)" },
  ...PERFORMANCE_FIELDS.map((field) => ({
    key: field.key,
    label: field.label
  }))
];

const IMPORT_ALIASES: Record<ImportFieldKey, string[]> = {
  entityName: ["company", "company name", "name", "business", "entity"],
  entityUrl: ["url", "website", "website url", "domain", "site"],
  entityType: ["type", "entity type", "company type"],
  domainAuthority: ["da", "domain authority"],
  pageAuthority: ["pa", "page authority"],
  backlinks: ["backlinks", "links"],
  referringDomains: ["referring domains", "ref domains", "domains"],
  criticalSeoHealth: ["critical seo health", "seo health", "health score"],
  indexedPages: ["indexed pages", "pages indexed"],
  metadataIssues: ["metadata issues", "meta issues"],
  brokenLinks: ["broken links"],
  organicMonthlyVisits: ["organic visits", "organic monthly visits", "monthly organic visits", "traffic"],
  topKeyword1: ["top keyword 1", "keyword 1"],
  topKeyword2: ["top keyword 2", "keyword 2"],
  topKeyword3: ["top keyword 3", "keyword 3"],
  bounceRate: ["bounce rate"],
  pagesPerVisit: ["pages per visit", "pages / visit"],
  averageSessionDuration: ["average session duration", "session duration"],
  coreWebVitals: ["core web vitals", "cwv"],
  pageSpeedScore: ["page speed score", "pagespeed", "speed score"],
  mobilePerformanceScore: ["mobile performance score", "mobile score"],
  trustScore: ["trust score"],
  googleReviewsCount: ["google reviews count", "reviews count", "google reviews"],
  averageReviewRating: ["average review rating", "review rating", "avg review rating"],
  socialMediaPresenceScore: ["social media presence score", "social score"],
  aiGeoVisibilityScore: ["ai / geo visibility score", "ai geo visibility score", "geo visibility", "ai visibility"],
  paidMediaVisibility: ["paid media visibility", "paid visibility", "paid media"]
};

function sanitizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function createInitialMapping(columns: string[]): UploadMapping {
  return IMPORTABLE_FIELDS.reduce<UploadMapping>((mapping, field) => {
    const match = columns.find((column) =>
      IMPORT_ALIASES[field.key].some((alias) => sanitizeHeader(column) === sanitizeHeader(alias))
    );

    mapping[field.key] = match ?? null;
    return mapping;
  }, {});
}

export async function parseUploadFile(file: File): Promise<UploadedDataset> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const rows: Record<string, string>[] = [];

  workbook.SheetNames.forEach((sheetName, index) => {
    const sheet = workbook.Sheets[sheetName];
    const sheetRows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
      raw: false,
      defval: ""
    });

    sheetRows.forEach((row) => {
      const serialisedRow = Object.entries(row).reduce<Record<string, string>>(
        (accumulator, [key, value]) => {
          accumulator[key] = String(value ?? "");
          return accumulator;
        },
        { __sheetName: sheetName, __sheetIndex: String(index) }
      );

      rows.push(serialisedRow);
    });
  });

  const detectedColumns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row).filter((key) => !key.startsWith("__"))))
  );

  return {
    fileName: file.name,
    detectedColumns,
    rows,
    mapping: createInitialMapping(detectedColumns),
    warnings: []
  };
}

function parseNumber(value: string): number | null {
  const trimmed = value.replace(/,/g, "").replace(/%/g, "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePerformanceValue(fieldKey: keyof PerformanceData, rawValue: string) {
  const field = PERFORMANCE_FIELDS.find((item) => item.key === fieldKey);
  if (!field) return null;
  if (field.type === "text") {
    return rawValue.trim() || null;
  }
  if (field.type === "dropdown") {
    const value = rawValue.trim();
    return value ? value : null;
  }
  return parseNumber(rawValue);
}

function determineEntityType(
  row: Record<string, string>,
  rowIndex: number,
  mapping: UploadMapping
): "prospect" | "competitor" {
  const mappedTypeKey = mapping.entityType;
  const typeValue = mappedTypeKey ? row[mappedTypeKey]?.toLowerCase() ?? "" : "";
  const sheetName = row.__sheetName?.toLowerCase() ?? "";

  if (typeValue.includes("prospect")) return "prospect";
  if (typeValue.includes("competitor")) return "competitor";
  if (sheetName.includes("prospect")) return "prospect";
  if (sheetName.includes("competitor")) return "competitor";

  return rowIndex === 0 ? "prospect" : "competitor";
}

export function applyUploadMapping(dataset: UploadedDataset): {
  prospect: {
    companyName: string;
    websiteUrl: string;
    performance: PerformanceData;
  } | null;
  competitors: Array<{
    id: string;
    name: string;
    websiteUrl: string;
    performance: PerformanceData;
  }>;
  warnings: string[];
} {
  const warnings = [...dataset.warnings];
  let prospect: {
    companyName: string;
    websiteUrl: string;
    performance: PerformanceData;
  } | null = null;
  const competitors: Array<{
    id: string;
    name: string;
    websiteUrl: string;
    performance: PerformanceData;
  }> = [];

  dataset.rows.forEach((row, rowIndex) => {
    const entityType = determineEntityType(row, rowIndex, dataset.mapping);
    const entityName = dataset.mapping.entityName ? row[dataset.mapping.entityName] ?? "" : "";
    const entityUrl = dataset.mapping.entityUrl ? row[dataset.mapping.entityUrl] ?? "" : "";
    const performance = createEmptyPerformanceData();

    PERFORMANCE_FIELDS.forEach((field) => {
      const mappedColumn = dataset.mapping[field.key];
      if (!mappedColumn) return;
      const parsed = parsePerformanceValue(field.key, row[mappedColumn] ?? "");
      (performance[field.key] as unknown) = parsed;
    });

    if (entityType === "prospect" && !prospect) {
      prospect = {
        companyName: entityName,
        websiteUrl: normaliseUrl(entityUrl),
        performance
      };
      return;
    }

    if (competitors.length < FIXED_COMPETITOR_IDS.length) {
      competitors.push({
        id: FIXED_COMPETITOR_IDS[competitors.length],
        name: entityName || `Competitor ${competitors.length + 1}`,
        websiteUrl: normaliseUrl(entityUrl),
        performance
      });
      return;
    }
  });

  if (!prospect) {
    warnings.push("No prospect row could be identified. The first row should represent the prospect.");
  }

  if (!competitors.length) {
    warnings.push("No competitor rows were identified from the uploaded file.");
  }

  if (dataset.rows.length > 4) {
    warnings.push("Only the first prospect and first three competitors were imported.");
  }

  return {
    prospect,
    competitors,
    warnings
  };
}
