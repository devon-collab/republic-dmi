import {
  CATEGORY_WEIGHTS,
  INDUSTRY_BENCHMARKS,
  PROHIBITED_WORDS,
  SCORE_BANDS,
  SECTION_PROMPTS
} from "@/lib/config";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-ink">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-burgundy">Republic DMI</p>
          <h1 className="font-serif text-4xl">Methodology and Configuration</h1>
          <p className="max-w-3xl text-sm leading-7 text-stone-600">
            This route exposes the current v1 configuration in code. The editable admin experience
            described in the brief is planned for a later phase, but the methodology values are
            already centralised and ready for that step.
          </p>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-panel">
            <h2 className="font-serif text-2xl">Category Weights</h2>
            <pre className="mt-4 overflow-x-auto rounded-3xl bg-stone-950 p-4 text-xs text-stone-100">
              {JSON.stringify(CATEGORY_WEIGHTS, null, 2)}
            </pre>
          </div>
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-panel">
            <h2 className="font-serif text-2xl">Score Bands</h2>
            <pre className="mt-4 overflow-x-auto rounded-3xl bg-stone-950 p-4 text-xs text-stone-100">
              {JSON.stringify(SCORE_BANDS, null, 2)}
            </pre>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-panel">
            <h2 className="font-serif text-2xl">Prompt Templates</h2>
            <pre className="mt-4 overflow-x-auto rounded-3xl bg-stone-950 p-4 text-xs text-stone-100">
              {JSON.stringify(SECTION_PROMPTS, null, 2)}
            </pre>
          </div>
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-panel">
            <h2 className="font-serif text-2xl">Prohibited Words</h2>
            <pre className="mt-4 overflow-x-auto rounded-3xl bg-stone-950 p-4 text-xs text-stone-100">
              {JSON.stringify(PROHIBITED_WORDS, null, 2)}
            </pre>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-panel">
          <h2 className="font-serif text-2xl">Industry Benchmarks</h2>
          <pre className="mt-4 overflow-x-auto rounded-3xl bg-stone-950 p-4 text-xs text-stone-100">
            {JSON.stringify(INDUSTRY_BENCHMARKS, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
