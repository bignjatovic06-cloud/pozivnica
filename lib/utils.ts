import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { srLatn } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return format(date, "EEEE, d. MMMM yyyy.", { locale: srLatn });
}

export function formatDateTime(date: Date): string {
  return format(date, "d.MM.yyyy. HH:mm", { locale: srLatn });
}

export function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

export const DIETARY_LABELS: Record<string, string> = {
  omnivore: "Omnivore (sve)",
  vegetarian: "Vegetarijanska",
  vegan: "Veganska",
  glutenfree: "Bez glutena",
};

export const STATUS_LABELS: Record<string, string> = {
  confirmed: "Potvrđen",
  declined: "Odbijen",
  maybe: "Nije siguran",
};

export const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-green-600 bg-green-50",
  declined: "text-red-600 bg-red-50",
  maybe: "text-yellow-600 bg-yellow-50",
};
