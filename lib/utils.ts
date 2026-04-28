import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normaliseUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function formatDateForFilename(dateString: string) {
  return dateString.replaceAll("/", "-");
}

export function formatNumber(value: number | null | undefined, maximumFractionDigits = 0) {
  if (value == null || Number.isNaN(value)) return "Unscored";
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits }).format(value);
}
