"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileUp,
  GripVertical,
  Loader2,
  Mail,
  RefreshCcw,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import {
  INDUSTRIES,
  PERFORMANCE_FIELD_GROUPS,
  PERFORMANCE_FIELDS,
  TONE_OPTIONS
} from "@/lib/config";
import { createDefaultReportInput, FIXED_COMPETITOR_IDS } from "@/lib/defaults";
import { applyUploadMapping, IMPORTABLE_FIELDS, parseUploadFile } from "@/lib/import";
import { buildReportComputation } from "@/lib/scoring";
import { useDmiStore } from "@/lib/store/dmi-store";
import type {
  GeneratedNarrativeSections,
  PerformanceData,
  ReportBuildResult,
  ReportInput,
  ToneSetting,
  UploadedDataset
} from "@/lib/types";
import { reportInputSchema } from "@/lib/validation";
import { cn, formatDateForFilename, normaliseUrl, slugify } from "@/lib/utils";
import { ReportDocument } from "@/components/dmi/report-document";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TooltipHint } from "@/components/ui/tooltip";

const STEPS = [
  "Prospect details",
  "Competitors",
  "Performance data",
  "Confidence review",
  "Preview and export"
] as const;

type NarrativeSectionKey = Exclude<keyof GeneratedNarrativeSections, "strategicFindings">;
type ActiveEntityKey = "prospect" | (typeof FIXED_COMPETITOR_IDS)[number];

export function DmiBuilder() {
  const initialValuesRef = useRef(createDefaultReportInput());
  const {
    register,
    watch,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors }
  } = useForm<ReportInput>({
    resolver: zodResolver(reportInputSchema),
    defaultValues: initialValuesRef.current,
    mode: "onBlur"
  });

  const [
    report,
    narratives,
    narrativeHistory,
    hasDownloadedPdf,
    emailDraft,
    setGeneratedReport,
    updateNarrativeSection,
    applyRegeneratedSection,
    updateStrategicFinding,
    applyRegeneratedStrategicFindings,
    reorderRecommendations,
    orderedRecommendations,
    setEmailDraft,
    markPdfDownloaded,
    resetStore
  ] = useDmiStore((state) => [
    state.report,
    state.narratives,
    state.narrativeHistory,
    state.hasDownloadedPdf,
    state.emailDraft,
    state.setGeneratedReport,
    state.updateNarrativeSection,
    state.applyRegeneratedSection,
    state.updateStrategicFinding,
    state.applyRegeneratedStrategicFindings,
    state.reorderRecommendations,
    state.orderedRecommendations,
    state.setEmailDraft,
    state.markPdfDownloaded,
    state.reset
  ]);

  const values = watch();
  const [currentStep, setCurrentStep] = useState(0);
  const [activeEntity, setActiveEntity] = useState<ActiveEntityKey>("prospect");
  const [uploadDataset, setUploadDataset] = useState<UploadedDataset | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [copied, setCopied] = useState(false);
  const [draggedRecommendationId, setDraggedRecommendationId] = useState<string | null>(null);

  const normalizedInput = normaliseReportInput(values);
  const draftComputation = buildDraftComputation(normalizedInput);
  const availableRecommendations = orderedRecommendations();
  const selectedIndustryBenchmark = draftComputation?.industryBenchmark;

  useEffect(() => {
    const storedTone = window.sessionStorage.getItem("republic-dmi-tone");
    if (storedTone && (storedTone === "consultative" || storedTone === "direct" || storedTone === "conservative")) {
      setValue("tone", storedTone);
    }
  }, [setValue]);

  useEffect(() => {
    window.sessionStorage.setItem("republic-dmi-tone", values.tone);
  }, [values.tone]);

  async function handleNextStep() {
    if (currentStep === 0) {
      const valid = await trigger([
        "prospect.companyName",
        "prospect.websiteUrl",
        "prospect.industry",
        "prospect.reportDate"
      ]);
      if (!valid) return;
    }

    if (currentStep === 1) {
      const valid = await trigger(["competitors.0.name", "competitors.0.websiteUrl"]);
      if (!valid) return;
    }

    if (currentStep === 2) {
      if (uploadDataset && uploadWarnings.length) {
        setCurrentStep(3);
        return;
      }
    }

    setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
  }

  function handlePreviousStep() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  async function handleUpload(file: File) {
    const dataset = await parseUploadFile(file);
    const storedMapping = window.sessionStorage.getItem("republic-dmi-upload-mapping");

    if (storedMapping) {
      try {
        dataset.mapping = {
          ...dataset.mapping,
          ...JSON.parse(storedMapping)
        };
      } catch {
        // Ignore malformed session storage values.
      }
    }

    setUploadDataset(dataset);
    setUploadWarnings([]);
  }

  function updateMapping(fieldKey: string, column: string) {
    if (!uploadDataset) return;

    const nextDataset: UploadedDataset = {
      ...uploadDataset,
      mapping: {
        ...uploadDataset.mapping,
        [fieldKey]: column || null
      }
    };

    setUploadDataset(nextDataset);
    window.sessionStorage.setItem(
      "republic-dmi-upload-mapping",
      JSON.stringify(nextDataset.mapping)
    );
  }

  function handleApplyUpload() {
    if (!uploadDataset) return;
    const mapped = applyUploadMapping(uploadDataset);

    if (mapped.prospect) {
      if (mapped.prospect.companyName) {
        setValue("prospect.companyName", mapped.prospect.companyName, { shouldDirty: true });
      }
      if (mapped.prospect.websiteUrl) {
        setValue("prospect.websiteUrl", mapped.prospect.websiteUrl, { shouldDirty: true });
      }
      setValue("prospectPerformance", mapped.prospect.performance, { shouldDirty: true });
    }

    FIXED_COMPETITOR_IDS.forEach((competitorId, index) => {
      const competitor = mapped.competitors[index];
      setValue(`competitors.${index}.id`, competitorId);
      setValue(`competitors.${index}.name`, competitor?.name ?? "");
      setValue(`competitors.${index}.websiteUrl`, competitor?.websiteUrl ?? "");
      setValue(`competitorPerformance.${competitorId}`, competitor?.performance ?? {}, {
        shouldDirty: true
      });
    });

    setUploadWarnings(mapped.warnings);
  }

  async function handleGenerateReport() {
    const valid = await trigger();
    if (!valid) {
      if (currentStep !== 0) setCurrentStep(0);
      return;
    }

    setIsGenerating(true);
    setEmailDraft(null);

    try {
      const payload = normaliseReportInput(getValues());
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: payload })
      });

      if (!response.ok) {
        throw new Error("Failed to generate the report.");
      }

      const data = (await response.json()) as {
        report: ReportBuildResult;
        narratives: GeneratedNarrativeSections;
        input: ReportInput;
      };

      setGeneratedReport({
        reportInputSnapshot: data.input,
        report: data.report,
        narratives: data.narratives
      });
      markPdfDownloaded(false);
      setCurrentStep(4);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerateAll(nextTone?: ToneSetting) {
    setIsRegeneratingAll(true);

    try {
      const payload = normaliseReportInput({
        ...getValues(),
        tone: nextTone ?? values.tone
      });
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: payload })
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate the report.");
      }

      const data = (await response.json()) as {
        report: ReportBuildResult;
        narratives: GeneratedNarrativeSections;
        input: ReportInput;
      };

      setGeneratedReport({
        reportInputSnapshot: data.input,
        report: data.report,
        narratives: data.narratives
      });
    } finally {
      setIsRegeneratingAll(false);
    }
  }

  async function handleSectionRegenerate(section: NarrativeSectionKey | "strategicFindings") {
    if (!report) return;

    setRegeneratingSection(section);

    try {
      const payload = normaliseReportInput(getValues());
      const response = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          input: payload,
          report
        })
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate section.");
      }

      const data = (await response.json()) as {
        section: string;
        value: string | GeneratedNarrativeSections["strategicFindings"];
      };

      if (section === "strategicFindings" && Array.isArray(data.value)) {
        applyRegeneratedStrategicFindings(data.value);
      } else if (typeof data.value === "string" && section !== "strategicFindings") {
        applyRegeneratedSection(section, data.value);
      }
    } finally {
      setRegeneratingSection(null);
    }
  }

  async function handleToneChange(nextTone: ToneSetting) {
    setValue("tone", nextTone, { shouldDirty: true });

    if (report && narratives) {
      await handleRegenerateAll(nextTone);
    }
  }

  async function handleExportPdf() {
    if (!report || !narratives) return;

    setIsExporting(true);

    try {
      const payload = normaliseReportInput(getValues());
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: payload,
          report,
          narratives,
          recommendations: availableRecommendations
        })
      });

      if (!response.ok) {
        throw new Error("PDF export failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const disposition = response.headers.get("content-disposition");
      const suggestedName =
        disposition?.match(/filename="?([^"]+)"?/)?.[1] ??
        buildDownloadName(payload.prospect.companyName, payload.prospect.reportDate, response.headers.get("content-type") === "text/html");

      anchor.href = url;
      anchor.download = suggestedName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      markPdfDownloaded(true);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleGenerateEmail() {
    if (!report || !narratives) return;

    setIsGeneratingEmail(true);

    try {
      const payload = normaliseReportInput(getValues());
      const response = await fetch("/api/generate-outreach-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: payload,
          report,
          findings: narratives.strategicFindings,
          signerName
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate outreach email.");
      }

      const draft = await response.json();
      setEmailDraft(draft);
    } finally {
      setIsGeneratingEmail(false);
    }
  }

  async function handleCopyEmail() {
    if (!emailDraft) return;

    const selectedSubject = emailDraft.subjectOptions[0] ?? "";
    const fullEmail = `Subject: ${selectedSubject}\n\n${emailDraft.body}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function handleNewReport() {
    reset(createDefaultReportInput());
    setUploadDataset(null);
    setUploadWarnings([]);
    setCurrentStep(0);
    setActiveEntity("prospect");
    setSignerName("");
    window.sessionStorage.removeItem("republic-dmi-tone");
    window.sessionStorage.removeItem("republic-dmi-upload-mapping");
    resetStore();
  }

  function handleRecommendationDrop(targetId: string) {
    if (!draggedRecommendationId || draggedRecommendationId === targetId) return;

    const order = availableRecommendations.map((recommendation) => recommendation.id);
    const nextOrder = [...order];
    const fromIndex = nextOrder.indexOf(draggedRecommendationId);
    const toIndex = nextOrder.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, draggedRecommendationId);
    reorderRecommendations(nextOrder);
    setDraggedRecommendationId(null);
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden bg-white/95 backdrop-blur">
            <div className="border-b border-stone-200 px-6 py-6">
              <p className="text-xs uppercase tracking-[0.35em] text-burgundy">Republic DMI</p>
              <h1 className="mt-3 font-serif text-4xl leading-tight">Digital Maturity Index Builder</h1>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Stateless internal report builder for premium cold outreach, competitor benchmarking,
                and discovery-call nudges.
              </p>
            </div>
            <div className="space-y-3 px-4 py-5">
              {STEPS.map((step, index) => {
                const active = index === currentStep;
                const completed = index < currentStep || (index === 4 && Boolean(report && narratives));

                return (
                  <button
                    key={step}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-[1.5rem] px-4 py-4 text-left transition",
                      active ? "bg-burgundy text-white" : "bg-stone-50 text-ink hover:bg-stone-100"
                    )}
                    onClick={() => {
                      if (index < currentStep || (index === 4 && report && narratives)) {
                        setCurrentStep(index);
                      }
                    }}
                    type="button"
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        active
                          ? "bg-white text-burgundy"
                          : completed
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-white text-stone-500"
                      )}
                    >
                      {completed && !active ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{step}</span>
                      <span className={cn("mt-1 block text-xs leading-5", active ? "text-white/80" : "text-stone-500")}>
                        {getStepDescription(index)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="border border-burgundy/15 bg-white">
            <div className="px-6 py-6">
              <p className="text-xs uppercase tracking-[0.35em] text-burgundy">Methodology</p>
              <h2 className="mt-3 font-serif text-2xl">What this build prioritises</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
                <li>Seven-category weighted maturity scoring.</li>
                <li>Prospect versus three-competitor benchmarking.</li>
                <li>AI-assisted narrative sections with regeneration controls.</li>
                <li>High-fidelity PDF export with no database or stored reports.</li>
              </ul>
            </div>
          </Card>
        </aside>

        <section className="space-y-6">
          <Card className="overflow-hidden bg-white/95 backdrop-blur">
            <div className="border-b border-stone-200 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-burgundy">
                    Step {currentStep + 1}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl">{STEPS[currentStep]}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={handleNewReport}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    New report
                  </Button>
                  {currentStep > 0 ? (
                    <Button variant="secondary" onClick={handlePreviousStep}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  ) : null}
                  {currentStep < 3 ? (
                    <Button onClick={handleNextStep}>
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 0 ? (
                    <div className="grid gap-5 md:grid-cols-2">
                      <FieldBlock
                        label="Prospect company name"
                        error={errors.prospect?.companyName?.message}
                      >
                        <Input
                          placeholder="Merchant West"
                          {...register("prospect.companyName")}
                        />
                      </FieldBlock>
                      <FieldBlock
                        label="Prospect website URL"
                        error={errors.prospect?.websiteUrl?.message}
                      >
                        <Input
                          placeholder="merchantwest.co.za"
                          {...register("prospect.websiteUrl")}
                        />
                      </FieldBlock>
                      <FieldBlock
                        label="Industry"
                        error={errors.prospect?.industry?.message}
                      >
                        <Select {...register("prospect.industry")}>
                          {INDUSTRIES.map((industry) => (
                            <option key={industry} value={industry}>
                              {industry}
                            </option>
                          ))}
                        </Select>
                      </FieldBlock>
                      <FieldBlock label="Region">
                        <Input placeholder="Johannesburg" {...register("prospect.region")} />
                      </FieldBlock>
                      <FieldBlock label="Contact name">
                        <Input placeholder="Jane Smith" {...register("prospect.contactName")} />
                      </FieldBlock>
                      <FieldBlock label="Contact role">
                        <Input placeholder="Managing Director" {...register("prospect.contactRole")} />
                      </FieldBlock>
                      <FieldBlock
                        label="Report date"
                        error={errors.prospect?.reportDate?.message}
                      >
                        <Input type="date" {...register("prospect.reportDate")} />
                      </FieldBlock>
                    </div>
                  ) : null}

                  {currentStep === 1 ? (
                    <div className="space-y-5">
                      {values.competitors.map((competitor, index) => (
                        <Card key={competitor.id} className="p-5">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.25em] text-burgundy">
                                Competitor {index + 1}
                              </p>
                              <h3 className="mt-1 font-serif text-2xl">
                                {competitor.name || `Comparison business ${index + 1}`}
                              </h3>
                            </div>
                            <Badge tone={index === 0 ? "danger" : "default"}>
                              {index === 0 ? "Required" : "Optional"}
                            </Badge>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <FieldBlock
                              label="Competitor name"
                              error={errors.competitors?.[index]?.name?.message}
                            >
                              <Input
                                placeholder={`Competitor ${index + 1}`}
                                {...register(`competitors.${index}.name` as const)}
                              />
                            </FieldBlock>
                            <FieldBlock
                              label="Competitor URL"
                              error={errors.competitors?.[index]?.websiteUrl?.message}
                            >
                              <Input
                                placeholder="competitor.com"
                                {...register(`competitors.${index}.websiteUrl` as const)}
                              />
                            </FieldBlock>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : null}

                  {currentStep === 2 ? (
                    <div className="space-y-8">
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant={values.inputMode === "manual" ? "primary" : "secondary"}
                          onClick={() => setValue("inputMode", "manual", { shouldDirty: true })}
                        >
                          Manual entry
                        </Button>
                        <Button
                          variant={values.inputMode === "upload" ? "primary" : "secondary"}
                          onClick={() => setValue("inputMode", "upload", { shouldDirty: true })}
                        >
                          Upload CSV / XLSX
                        </Button>
                      </div>

                      {values.inputMode === "upload" ? (
                        <Card className="p-5">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.25em] text-burgundy">
                                Upload source data
                              </p>
                              <h3 className="mt-2 font-serif text-2xl">Import and map your file</h3>
                              <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-600">
                                Upload a CSV or XLSX. The tool parses it in the browser, suggests
                                column mappings, and lets you correct anything before the values land
                                in the report form.
                              </p>
                            </div>
                            <label className="inline-flex cursor-pointer items-center rounded-full bg-burgundy px-4 py-3 text-sm font-medium text-white transition hover:bg-burgundy-deep">
                              <FileUp className="mr-2 h-4 w-4" />
                              Choose file
                              <input
                                className="hidden"
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    await handleUpload(file);
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {uploadDataset ? (
                            <div className="mt-6 space-y-5">
                              <div className="rounded-[1.5rem] bg-stone-50 px-4 py-4 text-sm text-stone-600">
                                Imported <strong>{uploadDataset.fileName}</strong> with{" "}
                                <strong>{uploadDataset.detectedColumns.length}</strong> detected columns
                                and <strong>{uploadDataset.rows.length}</strong> rows.
                              </div>
                              <div className="grid gap-3 lg:grid-cols-2">
                                {IMPORTABLE_FIELDS.map((field) => (
                                  <div key={field.key} className="rounded-[1.5rem] border border-stone-200 p-4">
                                    <label className="mb-2 block text-sm font-semibold text-ink">
                                      {field.label}
                                    </label>
                                    <Select
                                      value={uploadDataset.mapping[field.key] ?? ""}
                                      onChange={(event) => updateMapping(field.key, event.target.value)}
                                    >
                                      <option value="">Not mapped</option>
                                      {uploadDataset.detectedColumns.map((column) => (
                                        <option key={`${field.key}-${column}`} value={column}>
                                          {column}
                                        </option>
                                      ))}
                                    </Select>
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <Button onClick={handleApplyUpload}>Apply mapped values</Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setValue("inputMode", "manual", { shouldDirty: true });
                                  }}
                                >
                                  Switch to manual review
                                </Button>
                              </div>
                              {uploadWarnings.length ? (
                                <div className="rounded-[1.5rem] border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                                  <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                                    <div>
                                      <p className="font-semibold">Import warnings</p>
                                      <ul className="mt-2 space-y-1">
                                        {uploadWarnings.map((warning) => (
                                          <li key={warning}>{warning}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </Card>
                      ) : null}

                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            variant={activeEntity === "prospect" ? "primary" : "secondary"}
                            onClick={() => setActiveEntity("prospect")}
                          >
                            Prospect
                          </Button>
                          {values.competitors.map((competitor, index) => (
                            <Button
                              key={competitor.id}
                              variant={activeEntity === competitor.id ? "primary" : "secondary"}
                              onClick={() => setActiveEntity(competitor.id as ActiveEntityKey)}
                            >
                              {competitor.name || `Competitor ${index + 1}`}
                            </Button>
                          ))}
                        </div>

                        <Card className="p-5">
                          <div className="mb-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-burgundy">
                              {activeEntity === "prospect" ? "Prospect data" : "Competitor data"}
                            </p>
                            <h3 className="mt-2 font-serif text-2xl">
                              {activeEntity === "prospect"
                                ? values.prospect.companyName || "Prospect metrics"
                                : values.competitors.find((competitor) => competitor.id === activeEntity)?.name ||
                                  "Competitor metrics"}
                            </h3>
                            <p className="mt-2 text-sm leading-7 text-stone-600">
                              Every metric can be entered manually. Indicators show whether the current
                              value looks strong, moderate or weak relative to the selected industry
                              preset where one exists.
                            </p>
                          </div>

                          <div className="space-y-6">
                            {PERFORMANCE_FIELD_GROUPS.map((group) => (
                              <div key={group.key} className="rounded-[1.75rem] border border-stone-200 p-5">
                                <div className="mb-4">
                                  <h4 className="font-serif text-xl">{group.label}</h4>
                                  <p className="mt-1 text-sm leading-7 text-stone-600">
                                    {group.description}
                                  </p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                  {group.fields.map((fieldKey) => {
                                    const field = PERFORMANCE_FIELDS.find((item) => item.key === fieldKey);
                                    if (!field) return null;
                                    const path = buildPerformancePath(activeEntity, field.key);
                                    const fieldValue = watch(path as never);
                                    const benchmarkStatus = resolveBenchmarkStatus(
                                      field.key,
                                      fieldValue,
                                      selectedIndustryBenchmark?.defaults[field.key]
                                    );

                                    return (
                                      <div key={`${activeEntity}-${field.key}`} className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                                          {field.label}
                                          <TooltipHint text={field.tooltip} />
                                          {benchmarkStatus ? (
                                            <Badge
                                              tone={
                                                benchmarkStatus === "Strong"
                                                  ? "success"
                                                  : benchmarkStatus === "Moderate"
                                                    ? "warning"
                                                    : "danger"
                                              }
                                            >
                                              {benchmarkStatus}
                                            </Badge>
                                          ) : null}
                                        </label>
                                        {field.type === "dropdown" ? (
                                          <Select {...register(path as never)}>
                                            <option value="">Unscored</option>
                                            {field.key === "coreWebVitals" ? (
                                              <>
                                                <option value="Poor">Poor</option>
                                                <option value="Needs Improvement">Needs Improvement</option>
                                                <option value="Good">Good</option>
                                              </>
                                            ) : (
                                              <>
                                                <option value="None">None</option>
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                              </>
                                            )}
                                          </Select>
                                        ) : field.type === "text" ? (
                                          <Input placeholder={field.label} {...register(path as never)} />
                                        ) : (
                                          <Input
                                            type="number"
                                            step={field.key === "pagesPerVisit" || field.key === "averageReviewRating" ? "0.1" : "1"}
                                            min={field.min}
                                            max={field.max}
                                            placeholder={field.unit}
                                            {...register(path as never, {
                                              setValueAs: (value) => {
                                                if (value === "" || value == null) return undefined;
                                                const numeric = Number(value);
                                                return Number.isFinite(numeric) ? numeric : undefined;
                                              }
                                            })}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 3 ? (
                    <div className="space-y-6">
                      <Card className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-burgundy">
                              Data confidence
                            </p>
                            <h3 className="mt-2 font-serif text-3xl">
                              {draftComputation?.confidence.percent ?? 0}% populated
                            </h3>
                          </div>
                          <Badge
                            tone={
                              draftComputation?.confidence.level === "full"
                                ? "success"
                                : draftComputation?.confidence.level === "estimated"
                                  ? "warning"
                                  : "danger"
                            }
                          >
                            {draftComputation?.confidence.level === "full"
                              ? "Full Report"
                              : draftComputation?.confidence.level === "estimated"
                                ? "Estimated Report"
                                : "Partial Report"}
                          </Badge>
                        </div>
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600">
                          The tool withholds missing fields from category scoring so incomplete data
                          does not artificially depress the final score. You can still continue with an
                          estimated or partial report, but the cover page will flag the lower confidence.
                        </p>
                        {draftComputation?.confidence.overrideRecommended ? (
                          <div className="mt-5 rounded-[1.5rem] border border-red-300 bg-red-50 px-4 py-4 text-sm text-red-900">
                            <div className="flex gap-3">
                              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                              <p>
                                Only {draftComputation.confidence.percent}% of performance data has been
                                entered. The report will be heavily estimated and may not accurately
                                represent the prospect&apos;s position.
                              </p>
                            </div>
                          </div>
                        ) : null}
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          <div className="rounded-[1.5rem] bg-stone-50 p-4">
                            <p className="text-sm font-semibold text-ink">Populated fields</p>
                            <p className="mt-2 text-3xl font-semibold text-burgundy">
                              {draftComputation?.confidence.populated ?? 0}
                            </p>
                          </div>
                          <div className="rounded-[1.5rem] bg-stone-50 p-4">
                            <p className="text-sm font-semibold text-ink">Missing fields</p>
                            <p className="mt-2 text-3xl font-semibold text-ink">
                              {(draftComputation?.confidence.total ?? 0) -
                                (draftComputation?.confidence.populated ?? 0)}
                            </p>
                          </div>
                        </div>
                        {draftComputation?.confidence.missingFields.length ? (
                          <div className="mt-6 rounded-[1.5rem] border border-stone-200 p-4">
                            <p className="text-sm font-semibold text-ink">Unpopulated inputs</p>
                            <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-2 text-sm text-stone-600">
                              {draftComputation.confidence.missingFields.slice(0, 120).map((item) => (
                                <div key={item}>{item}</div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </Card>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button variant="secondary" onClick={handlePreviousStep}>
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Back to data
                        </Button>
                        <Button onClick={handleGenerateReport} disabled={isGenerating}>
                          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                          Generate report
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 4 ? (
                    <div className="space-y-6">
                      {report && narratives ? (
                        <>
                          <Card className="p-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-burgundy">
                                  Narrative controls
                                </p>
                                <h3 className="mt-2 font-serif text-2xl">Preview, refine, export</h3>
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <Select
                                  className="min-w-[220px]"
                                  value={values.tone}
                                  onChange={(event) => handleToneChange(event.target.value as ToneSetting)}
                                >
                                  {TONE_OPTIONS.map((tone) => (
                                    <option key={tone.value} value={tone.value}>
                                      {tone.label}
                                    </option>
                                  ))}
                                </Select>
                                <Button
                                  variant="secondary"
                                  onClick={() => handleRegenerateAll()}
                                  disabled={isRegeneratingAll}
                                >
                                  {isRegeneratingAll ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                  )}
                                  Regenerate all
                                </Button>
                                <Button onClick={handleExportPdf} disabled={isExporting}>
                                  {isExporting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                  )}
                                  Export PDF
                                </Button>
                              </div>
                            </div>
                            <p className="mt-3 text-sm leading-7 text-stone-600">
                              Tone changes rerun the AI-generated sections. Manual edits remain inline in
                              the preview. Recommendation order can be adjusted below before export.
                            </p>
                          </Card>

                          <div className="grid gap-6 2xl:grid-cols-[320px_minmax(0,1fr)]">
                            <div className="space-y-6">
                              <Card className="p-5">
                                <p className="text-xs uppercase tracking-[0.25em] text-burgundy">
                                  Recommendation order
                                </p>
                                <h4 className="mt-2 font-serif text-2xl">Drag to reprioritise</h4>
                                <div className="mt-4 space-y-3">
                                  {availableRecommendations.map((recommendation) => (
                                    <div
                                      key={recommendation.id}
                                      className="flex cursor-move items-start gap-3 rounded-[1.25rem] border border-stone-200 p-4"
                                      draggable
                                      onDragStart={() => setDraggedRecommendationId(recommendation.id)}
                                      onDragOver={(event) => event.preventDefault()}
                                      onDrop={() => handleRecommendationDrop(recommendation.id)}
                                    >
                                      <GripVertical className="mt-1 h-4 w-4 text-stone-400" />
                                      <div>
                                        <p className="text-sm font-semibold text-ink">
                                          {recommendation.title}
                                        </p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.15em] text-stone-500">
                                          {recommendation.classification}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Card>

                              <Card className="p-5">
                                <p className="text-xs uppercase tracking-[0.25em] text-burgundy">
                                  Outreach follow-up
                                </p>
                                <h4 className="mt-2 font-serif text-2xl">Optional email draft</h4>
                                <p className="mt-2 text-sm leading-7 text-stone-600">
                                  This appears after export so the narrative stays consistent with the PDF.
                                </p>
                                <div className="mt-4 space-y-3">
                                  <FieldBlock label="Republic team member name">
                                    <Input
                                      placeholder="Keri Kirsten"
                                      value={signerName}
                                      onChange={(event) => setSignerName(event.target.value)}
                                    />
                                  </FieldBlock>
                                  <Button
                                    className="w-full"
                                    onClick={handleGenerateEmail}
                                    disabled={!hasDownloadedPdf || isGeneratingEmail}
                                  >
                                    {isGeneratingEmail ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Mail className="mr-2 h-4 w-4" />
                                    )}
                                    {hasDownloadedPdf ? "Generate email draft" : "Export PDF first"}
                                  </Button>
                                </div>

                                {emailDraft ? (
                                  <div className="mt-5 space-y-3">
                                    <div className="rounded-[1.25rem] border border-stone-200 p-4">
                                      <p className="text-xs uppercase tracking-[0.15em] text-stone-500">
                                        Subject line options
                                      </p>
                                      <div className="mt-2 space-y-2 text-sm text-ink">
                                        {emailDraft.subjectOptions.map((subject) => (
                                          <div key={subject}>{subject}</div>
                                        ))}
                                      </div>
                                    </div>
                                    <Textarea
                                      rows={12}
                                      value={emailDraft.body}
                                      onChange={(event) =>
                                        setEmailDraft({ ...emailDraft, body: event.target.value })
                                      }
                                    />
                                    <Button variant="secondary" className="w-full" onClick={handleCopyEmail}>
                                      <Copy className="mr-2 h-4 w-4" />
                                      {copied ? "Copied" : "Copy to clipboard"}
                                    </Button>
                                  </div>
                                ) : null}
                              </Card>
                            </div>

                            <div className="overflow-x-auto rounded-[2rem] border border-stone-200 bg-stone-200/70 p-4">
                              <div className="min-w-[230mm]">
                                <ReportDocument
                                  input={normaliseReportInput(getValues())}
                                  report={report}
                                  narratives={narratives}
                                  recommendations={availableRecommendations}
                                  editable
                                  sectionHistory={{
                                    executiveSummary: narrativeHistory.executiveSummary,
                                    marketPositionSummary: narrativeHistory.marketPositionSummary,
                                    recommendationsIntroduction: narrativeHistory.recommendationsIntroduction,
                                    servicePathwayIntroduction: narrativeHistory.servicePathwayIntroduction,
                                    closingStatement: narrativeHistory.closingStatement
                                  }}
                                  findingsHistory={narrativeHistory.strategicFindings}
                                  onSectionChange={(section, value) => updateNarrativeSection(section, value)}
                                  onSectionRegenerate={(section) => void handleSectionRegenerate(section)}
                                  onSectionRestore={(section, value) => updateNarrativeSection(section, value)}
                                  onFindingChange={(findingId, value) =>
                                    updateStrategicFinding(findingId, value)
                                  }
                                  onFindingsRegenerate={() => void handleSectionRegenerate("strategicFindings")}
                                  onFindingsRestore={(findings) =>
                                    applyRegeneratedStrategicFindings(findings)
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          {regeneratingSection ? (
                            <div className="fixed bottom-6 right-6 rounded-full border border-burgundy/20 bg-white px-4 py-3 text-sm text-ink shadow-xl">
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Regenerating {regeneratingSection}...
                              </span>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="rounded-[2rem] border border-dashed border-stone-300 bg-stone-50 p-12 text-center">
                          <p className="font-serif text-2xl">No generated report yet</p>
                          <p className="mt-2 text-sm leading-7 text-stone-600">
                            Complete the previous steps and generate the report to unlock the preview.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function FieldBlock({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-ink">{label}</label>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function getStepDescription(index: number) {
  if (index === 0) return "Set the company context and cover-page metadata.";
  if (index === 1) return "Define one to three competitors for the benchmark.";
  if (index === 2) return "Upload or enter the performance data behind the diagnostic.";
  if (index === 3) return "Review confidence, missing fields, and estimation risk.";
  return "Regenerate, edit, export, and draft the outreach follow-up.";
}

function buildDownloadName(companyName: string, reportDate: string, htmlFallback = false) {
  const safeCompany = slugify(companyName || "prospect").replace(/-/g, "_");
  const safeDate = formatDateForFilename(reportDate || new Date().toISOString().slice(0, 10));
  return `RepublicDMI_${safeCompany}_${safeDate}.${htmlFallback ? "html" : "pdf"}`;
}

function normaliseReportInput(values: ReportInput): ReportInput {
  const competitors = values.competitors
    .map((competitor, index) => ({
      id: competitor.id || FIXED_COMPETITOR_IDS[index],
      name: competitor.name?.trim() ?? "",
      websiteUrl: competitor.websiteUrl?.trim() ? normaliseUrl(competitor.websiteUrl) : ""
    }))
    .filter((competitor) => competitor.name || competitor.websiteUrl)
    .slice(0, 3);

  const competitorPerformance = competitors.reduce<Record<string, PerformanceData>>(
    (accumulator, competitor) => {
      accumulator[competitor.id] = values.competitorPerformance[competitor.id] ?? {};
      return accumulator;
    },
    {}
  );

  return {
    ...values,
    prospect: {
      ...values.prospect,
      companyName: values.prospect.companyName.trim(),
      websiteUrl: normaliseUrl(values.prospect.websiteUrl),
      region: values.prospect.region?.trim() || "",
      contactName: values.prospect.contactName?.trim() || "",
      contactRole: values.prospect.contactRole?.trim() || ""
    },
    competitors,
    competitorPerformance
  };
}

function buildDraftComputation(input: ReportInput) {
  try {
    return buildReportComputation(input);
  } catch {
    return null;
  }
}

function buildPerformancePath(entity: ActiveEntityKey, fieldKey: keyof PerformanceData) {
  return entity === "prospect"
    ? `prospectPerformance.${fieldKey}`
    : `competitorPerformance.${entity}.${fieldKey}`;
}

function resolveBenchmarkStatus(
  fieldKey: keyof PerformanceData,
  fieldValue: unknown,
  benchmarkValue: unknown
) {
  if (fieldValue == null || fieldValue === "" || benchmarkValue == null || benchmarkValue === "") {
    return null;
  }

  if (typeof fieldValue !== "number" || typeof benchmarkValue !== "number") {
    return null;
  }

  const lowerIsBetter = fieldKey === "bounceRate" || fieldKey === "metadataIssues" || fieldKey === "brokenLinks";

  if (lowerIsBetter) {
    if (fieldValue <= benchmarkValue) return "Strong";
    if (fieldValue <= benchmarkValue * 1.15) return "Moderate";
    return "Weak";
  }

  if (fieldValue >= benchmarkValue) return "Strong";
  if (fieldValue >= benchmarkValue * 0.85) return "Moderate";
  return "Weak";
}
