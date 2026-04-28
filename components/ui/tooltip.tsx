import { Info } from "lucide-react";

export function TooltipHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <Info className="h-4 w-4 text-stone-400" />
      <span className="pointer-events-none absolute left-6 top-1/2 z-20 hidden w-72 -translate-y-1/2 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs leading-5 text-stone-600 shadow-panel group-hover:block">
        {text}
      </span>
    </span>
  );
}
