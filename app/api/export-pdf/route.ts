import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import { NextResponse } from "next/server";
import { z } from "zod";

import { reportInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

const requestSchema = z.object({
  input: reportInputSchema,
  html: z.string().min(1, "Rendered HTML is required for export.")
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

  const fileName = buildDownloadName(
    parsed.data.input.prospect.companyName,
    parsed.data.input.prospect.reportDate
  );
  const html = parsed.data.html;

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

function buildDownloadName(companyName: string, reportDate: string) {
  const safeCompany = (companyName || "prospect").trim().replace(/[^a-z0-9]+/gi, "_");
  const safeDate = (reportDate || new Date().toISOString().slice(0, 10)).replaceAll("/", "-");
  return `RepublicDMI_${safeCompany}_${safeDate}.pdf`;
}
Deployment refresh
