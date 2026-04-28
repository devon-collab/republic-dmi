# Republic Digital Maturity Index

Next.js 14 App Router build of the Republic Digital Maturity Index internal outreach report tool.

## What it does

- Collects prospect, competitor, and digital performance data
- Supports manual entry plus CSV/XLSX browser-side import with field mapping
- Scores the prospect across seven weighted digital maturity categories
- Benchmarks the prospect against up to three competitors
- Generates AI-assisted narrative sections and outreach email copy
- Exports a premium multi-page PDF report without storing data in a database

## Stack

- Next.js 14 App Router
- Tailwind CSS
- React Hook Form + Zod
- Zustand
- SheetJS (`xlsx`)
- OpenAI API via Next.js route handlers
- Puppeteer + `@sparticuz/chromium-min` for PDF rendering

## Environment variables

Create a `.env.local` file from `.env.example` and set:

- `OPENAI_API_KEY`
- `SITE_URL`
- `CHROME_EXECUTABLE_PATH` if your environment needs an explicit Chrome/Chromium binary path
- `REPORT_PASSWORD` only if you later choose to add route protection

## Getting started

1. Install dependencies
2. Run the dev server
3. Open `/dmi`

Typical commands:

```bash
npm install
npm run dev
```

## Notes

- The app is stateless by design. No database is included.
- Uploaded files are parsed client-side in memory.
- If server-side PDF rendering is unavailable in a given environment, the export route falls back to downloading the report as HTML so the session output is still recoverable.
- The `/dmi/admin` route currently exposes the live methodology/config values in code and acts as the v1 bridge toward the fuller editable admin panel described in the brief.
