import { z } from "zod";

import { CORE_WEB_VITALS_OPTIONS, INDUSTRIES, PAID_MEDIA_OPTIONS } from "@/lib/config";

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const optionalNumberInRange = (min: number, max?: number) =>
  z
    .number({ invalid_type_error: "Must be a number." })
    .min(min)
    .max(max ?? Number.POSITIVE_INFINITY)
    .optional()
    .nullable();

export const prospectDetailsSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required."),
  websiteUrl: z
    .string()
    .trim()
    .min(1, "Website URL is required.")
    .refine((value) => /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}/i.test(value), "Enter a valid website URL."),
  industry: z.enum(INDUSTRIES, {
    invalid_type_error: "Select an industry."
  }),
  region: optionalTrimmedString,
  contactName: optionalTrimmedString,
  contactRole: optionalTrimmedString,
  reportDate: z.string().trim().min(1, "Report date is required.")
});

export const competitorDetailsSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "Competitor name is required."),
  websiteUrl: z
    .string()
    .trim()
    .min(1, "Competitor URL is required.")
    .refine((value) => /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}/i.test(value), "Enter a valid website URL.")
});

export const performanceDataSchema = z.object({
  domainAuthority: optionalNumberInRange(0, 100),
  pageAuthority: optionalNumberInRange(0, 100),
  backlinks: optionalNumberInRange(0),
  referringDomains: optionalNumberInRange(0),
  criticalSeoHealth: optionalNumberInRange(0, 100),
  indexedPages: optionalNumberInRange(0),
  metadataIssues: optionalNumberInRange(0),
  brokenLinks: optionalNumberInRange(0),
  organicMonthlyVisits: optionalNumberInRange(0),
  topKeyword1: optionalTrimmedString.nullable(),
  topKeyword2: optionalTrimmedString.nullable(),
  topKeyword3: optionalTrimmedString.nullable(),
  bounceRate: optionalNumberInRange(0, 100),
  pagesPerVisit: optionalNumberInRange(0, 20),
  averageSessionDuration: optionalNumberInRange(0),
  coreWebVitals: z.enum(CORE_WEB_VITALS_OPTIONS).optional().nullable(),
  pageSpeedScore: optionalNumberInRange(0, 100),
  mobilePerformanceScore: optionalNumberInRange(0, 100),
  trustScore: optionalNumberInRange(0, 100),
  googleReviewsCount: optionalNumberInRange(0),
  averageReviewRating: optionalNumberInRange(0, 5),
  socialMediaPresenceScore: optionalNumberInRange(0, 100),
  aiGeoVisibilityScore: optionalNumberInRange(0, 100),
  paidMediaVisibility: z.enum(PAID_MEDIA_OPTIONS).optional().nullable()
});

export const toneSchema = z.enum(["consultative", "direct", "conservative"]);

export const reportInputSchema = z.object({
  prospect: prospectDetailsSchema,
  competitors: z.array(competitorDetailsSchema).min(1, "At least one competitor is required.").max(3),
  prospectPerformance: performanceDataSchema,
  competitorPerformance: z.record(performanceDataSchema),
  tone: toneSchema,
  inputMode: z.enum(["manual", "upload"])
});

export type ProspectDetailsFormValues = z.infer<typeof prospectDetailsSchema>;
export type CompetitorDetailsFormValues = z.infer<typeof competitorDetailsSchema>;
export type PerformanceDataFormValues = z.infer<typeof performanceDataSchema>;
