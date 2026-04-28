import { create } from "zustand";

import type {
  GeneratedNarrativeSections,
  OutreachEmailDraft,
  ReportBuildResult,
  ReportInput,
  StrategicFinding,
  TriggeredRecommendation
} from "@/lib/types";

type NarrativeSectionKey = Exclude<keyof GeneratedNarrativeSections, "strategicFindings">;

type NarrativeHistoryState = {
  executiveSummary: string[];
  marketPositionSummary: string[];
  recommendationsIntroduction: string[];
  servicePathwayIntroduction: string[];
  closingStatement: string[];
  strategicFindings: StrategicFinding[][];
};

interface DmiStoreState {
  reportInputSnapshot: ReportInput | null;
  report: ReportBuildResult | null;
  narratives: GeneratedNarrativeSections | null;
  recommendationOrder: string[];
  emailDraft: OutreachEmailDraft | null;
  hasDownloadedPdf: boolean;
  narrativeHistory: NarrativeHistoryState;
  setGeneratedReport: (payload: {
    reportInputSnapshot: ReportInput;
    report: ReportBuildResult;
    narratives: GeneratedNarrativeSections;
  }) => void;
  applyRegeneratedNarratives: (narratives: GeneratedNarrativeSections) => void;
  updateNarrativeSection: (section: NarrativeSectionKey, value: string) => void;
  applyRegeneratedSection: (section: NarrativeSectionKey, value: string) => void;
  updateStrategicFinding: (findingId: string, value: string) => void;
  applyRegeneratedStrategicFindings: (findings: StrategicFinding[]) => void;
  reorderRecommendations: (nextOrder: string[]) => void;
  orderedRecommendations: () => TriggeredRecommendation[];
  setEmailDraft: (draft: OutreachEmailDraft | null) => void;
  markPdfDownloaded: (value: boolean) => void;
  reset: () => void;
}

const EMPTY_HISTORY: NarrativeHistoryState = {
  executiveSummary: [],
  marketPositionSummary: [],
  recommendationsIntroduction: [],
  servicePathwayIntroduction: [],
  closingStatement: [],
  strategicFindings: []
};

export const useDmiStore = create<DmiStoreState>((set, get) => ({
  reportInputSnapshot: null,
  report: null,
  narratives: null,
  recommendationOrder: [],
  emailDraft: null,
  hasDownloadedPdf: false,
  narrativeHistory: EMPTY_HISTORY,
  setGeneratedReport: ({ reportInputSnapshot, report, narratives }) =>
    set((state) => ({
      reportInputSnapshot,
      report,
      narratives,
      recommendationOrder: report.recommendations.map((recommendation) => recommendation.id),
      emailDraft: null,
      hasDownloadedPdf: false,
      narrativeHistory: state.narratives
        ? {
            executiveSummary: [
              state.narratives.executiveSummary,
              ...state.narrativeHistory.executiveSummary
            ],
            marketPositionSummary: [
              state.narratives.marketPositionSummary,
              ...state.narrativeHistory.marketPositionSummary
            ],
            recommendationsIntroduction: [
              state.narratives.recommendationsIntroduction,
              ...state.narrativeHistory.recommendationsIntroduction
            ],
            servicePathwayIntroduction: [
              state.narratives.servicePathwayIntroduction,
              ...state.narrativeHistory.servicePathwayIntroduction
            ],
            closingStatement: [
              state.narratives.closingStatement,
              ...state.narrativeHistory.closingStatement
            ],
            strategicFindings: [
              state.narratives.strategicFindings,
              ...state.narrativeHistory.strategicFindings
            ]
          }
        : EMPTY_HISTORY
    })),
  applyRegeneratedNarratives: (narratives) =>
    set((state) => {
      if (!state.narratives) {
        return { narratives };
      }

      return {
        narratives,
        narrativeHistory: {
          executiveSummary: [
            state.narratives.executiveSummary,
            ...state.narrativeHistory.executiveSummary
          ],
          marketPositionSummary: [
            state.narratives.marketPositionSummary,
            ...state.narrativeHistory.marketPositionSummary
          ],
          recommendationsIntroduction: [
            state.narratives.recommendationsIntroduction,
            ...state.narrativeHistory.recommendationsIntroduction
          ],
          servicePathwayIntroduction: [
            state.narratives.servicePathwayIntroduction,
            ...state.narrativeHistory.servicePathwayIntroduction
          ],
          closingStatement: [
            state.narratives.closingStatement,
            ...state.narrativeHistory.closingStatement
          ],
          strategicFindings: [
            state.narratives.strategicFindings,
            ...state.narrativeHistory.strategicFindings
          ]
        }
      };
    }),
  updateNarrativeSection: (section, value) =>
    set((state) => ({
      narratives: state.narratives
        ? {
            ...state.narratives,
            [section]: value
          }
        : null
    })),
  applyRegeneratedSection: (section, value) =>
    set((state) => {
      if (!state.narratives) return {};
      const current = state.narratives[section];

      return {
        narratives: {
          ...state.narratives,
          [section]: value
        },
        narrativeHistory: {
          ...state.narrativeHistory,
          [section]: [current, ...state.narrativeHistory[section]]
        }
      };
    }),
  updateStrategicFinding: (findingId, value) =>
    set((state) => ({
      narratives: state.narratives
        ? {
            ...state.narratives,
            strategicFindings: state.narratives.strategicFindings.map((finding) =>
              finding.id === findingId ? { ...finding, body: value } : finding
            )
          }
        : null
    })),
  applyRegeneratedStrategicFindings: (findings) =>
    set((state) => ({
      narratives: state.narratives
        ? {
            ...state.narratives,
            strategicFindings: findings
          }
        : null,
      narrativeHistory: state.narratives
        ? {
            ...state.narrativeHistory,
            strategicFindings: [
              state.narratives.strategicFindings,
              ...state.narrativeHistory.strategicFindings
            ]
          }
        : state.narrativeHistory
    })),
  reorderRecommendations: (nextOrder) => set({ recommendationOrder: nextOrder }),
  orderedRecommendations: () => {
    const state = get();
    if (!state.report) return [];

    const ordered = state.recommendationOrder
      .map((id) => state.report?.recommendations.find((recommendation) => recommendation.id === id))
      .filter((recommendation): recommendation is TriggeredRecommendation => Boolean(recommendation));
    const remaining = state.report.recommendations.filter(
      (recommendation) => !state.recommendationOrder.includes(recommendation.id)
    );

    return [...ordered, ...remaining];
  },
  setEmailDraft: (draft) => set({ emailDraft: draft }),
  markPdfDownloaded: (value) => set({ hasDownloadedPdf: value }),
  reset: () =>
    set({
      reportInputSnapshot: null,
      report: null,
      narratives: null,
      recommendationOrder: [],
      emailDraft: null,
      hasDownloadedPdf: false,
      narrativeHistory: EMPTY_HISTORY
    })
}));
