import chromium from "@sparticuz/chromium-min";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import puppeteer from "puppeteer-core";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ReportDocument } from "@/components/dmi/report-document";
import type { GeneratedNarrativeSections, TriggeredRecommendation } from "@/lib/types";
import { buildReportComputation } from "@/lib/scoring";
import { reportInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

const strategicFindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  metricLabel: z.string(),
  metricValue: z.string(),
  riskLevel: z.enum(["Low", "Medium", "High", "Critical"])
});

const narrativesSchema = z.object({
  executiveSummary: z.string(),
  marketPositionSummary: z.string(),
  recommendationsIntroduction: z.string(),
  servicePathwayIntroduction: z.string(),
  closingStatement: z.string(),
  strategicFindings: z.array(strategicFindingSchema)
});

const recommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  rationale: z.string(),
  classification: z.enum(["Quick Win", "Strategic Programme", "Quick Win to Strategic Programme"]),
  riskOfInaction: z.string(),
  timeline: z.string(),
  categoryKey: z.enum([
    "websiteAuthority",
    "seoHealth",
    "organicVisibility",
    "userEngagement",
    "technicalPerformance",
    "trustAndConversion",
    "strategicDigitalMaturity"
  ]),
  impactScore: z.number(),
  sortOrder: z.number()
});

const requestSchema = z.object({
  input: reportInputSchema,
  narratives: narrativesSchema,
  recommendations: z.array(recommendationSchema)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid export payload.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const report = buildReportComputation(parsed.data.input);
  const fileName = buildDownloadName(parsed.data.input.prospect.companyName, parsed.data.input.prospect.reportDate);
  const html = buildDocumentHtml(
    parsed.data.input,
    report,
    parsed.data.narratives,
    parsed.data.recommendations
  );

  try {
    const executablePath = await resolveChromeExecutable();
    const browser = await puppeteer.launch({
      args: executablePath ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: chromium.defaultViewport ?? { width: 1440, height: 2200 },
      executablePath,
      headless: true
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: ["domcontentloaded", "networkidle0"] });
      await page.emulateMediaType("screen");
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm"
        }
      });

      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`
        }
      });
    } finally {
      await browser.close();
    }
  } catch {
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName.replace(/\.pdf$/i, ".html")}"`
      }
    });
  }
}

async function resolveChromeExecutable() {
  if (process.env.CHROME_EXECUTABLE_PATH) {
    return process.env.CHROME_EXECUTABLE_PATH;
  }

  if (typeof chromium.executablePath === "function") {
    try {
      return await chromium.executablePath();
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function buildDocumentHtml(
  input: z.infer<typeof reportInputSchema>,
  report: ReturnType<typeof buildReportComputation>,
  narratives: GeneratedNarrativeSections,
  recommendations: TriggeredRecommendation[]
) {
  const document = renderToStaticMarkup(
    createElement(ReportDocument, {
      input,
      report,
      narratives,
      recommendations
    })
  );

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charSet="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />',
    '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet" />',
    "<style>html,body{margin:0;padding:0;background:#f3efe9;}body{font-family:'Outfit',Arial,sans-serif;}</style>",
    "</head>",
    "<body>",
    document,
    "</body>",
    "</html>"
  ].join("");
}

function buildDownloadName(companyName: string, reportDate: string) {
  const safeCompany = (companyName || "prospect").trim().replace(/[^a-z0-9]+/gi, "_");
  const safeDate = (reportDate || new Date().toISOString().slice(0, 10)).replaceAll("/", "-");
  return `RepublicDMI_${safeCompany}_${safeDate}.pdf`;
}
